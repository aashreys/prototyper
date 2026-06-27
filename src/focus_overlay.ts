import { NavigationFocusConfig, NavigationFocusMode } from "./navigation_focus";
import { Utils } from "./utils";

const OVERLAY_NAME = '__Prototyper Focus Overlay'
const SCALE_CLONE_NAME = '__Prototyper Focus Scale Clone'
const OVERLAY_PLUGIN_DATA_KEY = 'prototyper_focus_overlay'

export class FocusOverlay {

  static removeManagedOverlays(root: SceneNode) {
    if (!Utils.hasChildren(root)) return
    const children = [...(root as any).children]
    for (const child of children) {
      if (FocusOverlay.isManagedOverlay(child)) {
        child.remove()
      } else {
        FocusOverlay.removeManagedOverlays(child)
      }
    }
  }

  static create(topLevelFrame: FrameNode, target: SceneNode, focus: NavigationFocusConfig): SceneNode {
    if (focus.mode === NavigationFocusMode.SCALE_SHADOW) {
      return FocusOverlay.createScaleShadow(topLevelFrame, target, focus)
    }

    const overlay = FocusOverlay.createManagedRectangle(OVERLAY_NAME)
    FocusOverlay.insertOverlay(topLevelFrame, target, overlay, focus.mode)

    if (FocusOverlay.canUseAbsoluteLayout(overlay, topLevelFrame)) {
      overlay.layoutPositioning = 'ABSOLUTE'
    }

    const targetBounds = Utils.getAbsoluteBounds(target)
    const frameBounds = Utils.getAbsoluteBounds(topLevelFrame)
    const focusBounds = FocusOverlay.getFocusBounds(targetBounds, frameBounds, FocusOverlay.getPadding(focus))

    overlay.resize(focusBounds.width, focusBounds.height)
    overlay.x = focusBounds.x
    overlay.y = focusBounds.y
    FocusOverlay.applyCornerRadius(overlay, target, focus, focusBounds)

    if (focus.mode === NavigationFocusMode.STROKE) {
      FocusOverlay.applyStroke(overlay, focus)
    }
    if (focus.mode === NavigationFocusMode.SHADOW) {
      FocusOverlay.applyShadow(overlay, focus)
    }

    return overlay
  }

  private static createScaleShadow(topLevelFrame: FrameNode, target: SceneNode, focus: NavigationFocusConfig): SceneNode {
    const scale = Math.max(0.01, focus.scaleShadow.scalePercent / 100)
    const targetBounds = Utils.getAbsoluteBounds(target)
    const frameBounds = Utils.getAbsoluteBounds(topLevelFrame)
    const scaledBounds = FocusOverlay.getScaledBounds(targetBounds, scale)
    const shadowBounds = FocusOverlay.getFocusBounds(scaledBounds, frameBounds, focus.scaleShadow.padding)
    shadowBounds.y = shadowBounds.y + focus.scaleShadow.offsetY

    const shadow = FocusOverlay.createManagedRectangle(OVERLAY_NAME)
    FocusOverlay.insertOverlay(topLevelFrame, target, shadow, NavigationFocusMode.SHADOW)
    if (FocusOverlay.canUseAbsoluteLayout(shadow, topLevelFrame)) {
      shadow.layoutPositioning = 'ABSOLUTE'
    }

    shadow.resize(shadowBounds.width, shadowBounds.height)
    shadow.x = shadowBounds.x
    shadow.y = shadowBounds.y
    FocusOverlay.applyScaleShadowCornerRadius(shadow, target, focus, shadowBounds, scale)
    FocusOverlay.applyDropShadow(
      shadow,
      focus.scaleShadow.color,
      focus.scaleShadow.opacity / 100,
      focus.scaleShadow.blur,
      focus.scaleShadow.spread,
      0
    )

    const clone = FocusOverlay.createScaledClone(topLevelFrame, target, scaledBounds, scale)
    return clone || shadow
  }

  private static createManagedRectangle(name: string): RectangleNode {
    const overlay = figma.createRectangle()
    overlay.name = name
    FocusOverlay.setManagedArtifactData(overlay)
    return overlay
  }

  private static setManagedArtifactData(node: SceneNode) {
    node.setPluginData(OVERLAY_PLUGIN_DATA_KEY, 'true')
  }

  private static isManagedOverlay(node): boolean {
    return Boolean(node?.getPluginData && node.getPluginData(OVERLAY_PLUGIN_DATA_KEY) === 'true')
  }

  private static insertOverlay(topLevelFrame: FrameNode, target: SceneNode, overlay: SceneNode, mode: NavigationFocusMode) {
    if (mode !== NavigationFocusMode.SHADOW) {
      topLevelFrame.appendChild(overlay)
      return
    }

    const topLevelChild = FocusOverlay.findTopLevelChild(topLevelFrame, target)
    const index = topLevelChild ? topLevelFrame.children.indexOf(topLevelChild) : -1
    if (index >= 0) {
      topLevelFrame.insertChild(index, overlay)
      return
    }

    topLevelFrame.appendChild(overlay)
  }

  private static findTopLevelChild(topLevelFrame: FrameNode, target: SceneNode): SceneNode | null {
    let current: any = target
    while (
      current?.parent &&
      current.parent !== topLevelFrame &&
      current.parent.id !== topLevelFrame.id
    ) {
      current = current.parent
    }
    if (current?.parent === topLevelFrame || current?.parent?.id === topLevelFrame.id) return current
    return null
  }

  private static canUseAbsoluteLayout(node: SceneNode, parent: FrameNode): boolean {
    return 'layoutPositioning' in node && 'layoutMode' in parent && parent.layoutMode !== 'NONE'
  }

  private static getFocusBounds(targetBounds: Rect, frameBounds: Rect, padding: number) {
    return {
      x: targetBounds.x - frameBounds.x - padding,
      y: targetBounds.y - frameBounds.y - padding,
      width: targetBounds.width + padding * 2,
      height: targetBounds.height + padding * 2
    }
  }

  private static applyStroke(overlay: RectangleNode, focus: NavigationFocusConfig) {
    overlay.fills = []
    overlay.strokes = [FocusOverlay.createSolidPaint(focus.stroke.color)]
    overlay.strokeWeight = focus.stroke.weight
    overlay.strokeAlign = 'OUTSIDE'
  }

  private static applyShadow(overlay: RectangleNode, focus: NavigationFocusConfig) {
    FocusOverlay.applyDropShadow(overlay, focus.shadow.color, 1, focus.shadow.blur, focus.shadow.spread, 0)
  }

  private static applyDropShadow(
    overlay: RectangleNode,
    colorValue: string,
    opacity: number,
    blur: number,
    spread: number,
    offsetY: number
  ) {
    const color = FocusOverlay.parseHexColor(colorValue)
    overlay.fills = [{
      type: 'SOLID',
      color: color,
      opacity: 0.01
    }]
    overlay.strokes = []
    overlay.effects = [{
      type: 'DROP_SHADOW',
      color: {
        ...color,
        a: Math.min(Math.max(0, opacity), 1)
      },
      offset: {
        x: 0,
        y: offsetY
      },
      radius: blur,
      spread: spread,
      visible: true,
      blendMode: 'NORMAL',
      showShadowBehindNode: true
    }]
  }

  private static getPadding(focus: NavigationFocusConfig): number {
    if (focus.mode === NavigationFocusMode.SCALE_SHADOW) return focus.scaleShadow.padding
    if (focus.mode === NavigationFocusMode.SHADOW) return focus.shadow.padding
    return focus.stroke.padding
  }

  private static applyCornerRadius(overlay: RectangleNode, target: SceneNode, focus: NavigationFocusConfig, focusBounds: Rect) {
    const padding = FocusOverlay.getPadding(focus)
    const maxRadius = FocusOverlay.getMaxRadius(focusBounds)
    if (focus.mode === NavigationFocusMode.STROKE && focus.stroke.useAutoCornerRadius) {
      const radii = FocusOverlay.getTargetCornerRadii(target)
      if (radii) {
        FocusOverlay.setOverlayCornerRadii(overlay, radii, padding, maxRadius)
        return
      }
    }
    overlay.cornerRadius = FocusOverlay.clampRadius(FocusOverlay.getCornerRadius(focus), maxRadius)
  }

  private static applyScaleShadowCornerRadius(
    overlay: RectangleNode,
    target: SceneNode,
    focus: NavigationFocusConfig,
    focusBounds: Rect,
    scale: number
  ) {
    const maxRadius = FocusOverlay.getMaxRadius(focusBounds)
    if (focus.scaleShadow.useAutoCornerRadius) {
      const radii = FocusOverlay.getTargetCornerRadii(target)
      if (radii) {
        FocusOverlay.setOverlayCornerRadii(overlay, radii, focus.scaleShadow.padding, maxRadius, scale)
        return
      }
    }
    overlay.cornerRadius = FocusOverlay.clampRadius(focus.scaleShadow.cornerRadius, maxRadius)
  }

  private static getCornerRadius(focus: NavigationFocusConfig): number {
    if (focus.mode === NavigationFocusMode.SCALE_SHADOW) return focus.scaleShadow.cornerRadius
    if (focus.mode === NavigationFocusMode.SHADOW) return focus.shadow.cornerRadius
    return focus.stroke.cornerRadius
  }

  private static getTargetCornerRadii(target: SceneNode): [number, number, number, number] | null {
    const node: any = target
    if (!('cornerRadius' in node)) return null
    if (typeof node.cornerRadius === 'number' && Number.isFinite(node.cornerRadius)) {
      return [node.cornerRadius, node.cornerRadius, node.cornerRadius, node.cornerRadius]
    }
    const mixed = typeof figma !== 'undefined' ? (figma as any).mixed : undefined
    if (node.cornerRadius !== mixed) return null
    const radii = [
      node.topLeftRadius,
      node.topRightRadius,
      node.bottomRightRadius,
      node.bottomLeftRadius
    ]
    if (!radii.every(radius => typeof radius === 'number' && Number.isFinite(radius))) return null
    return radii as [number, number, number, number]
  }

  private static setOverlayCornerRadii(
    overlay: RectangleNode,
    radii: [number, number, number, number],
    padding: number,
    maxRadius: number,
    scale = 1
  ) {
    const [topLeft, topRight, bottomRight, bottomLeft] = radii.map(radius => FocusOverlay.clampRadius((radius * scale) + padding, maxRadius))
    if (topLeft === topRight && topRight === bottomRight && bottomRight === bottomLeft) {
      overlay.cornerRadius = topLeft
      return
    }
    overlay.topLeftRadius = topLeft
    overlay.topRightRadius = topRight
    overlay.bottomRightRadius = bottomRight
    overlay.bottomLeftRadius = bottomLeft
  }

  private static getMaxRadius(bounds: Rect): number {
    return Math.max(0, Math.min(bounds.width, bounds.height) / 2)
  }

  private static clampRadius(radius: number, maxRadius: number): number {
    return Math.min(Math.max(0, radius), maxRadius)
  }

  private static getScaledBounds(bounds: Rect, scale: number): Rect {
    const width = bounds.width * scale
    const height = bounds.height * scale
    return {
      x: bounds.x + (bounds.width - width) / 2,
      y: bounds.y + (bounds.height - height) / 2,
      width: width,
      height: height
    }
  }

  private static createScaledClone(topLevelFrame: FrameNode, target: SceneNode, scaledBounds: Rect, scale: number): SceneNode | null {
    const cloneTarget: any = target
    if (typeof cloneTarget.clone !== 'function') {
      FocusOverlay.logScaleCloneFailure('Unable to create scale focus clone', target)
      return null
    }

    let clone: SceneNode | null = null
    try {
      clone = cloneTarget.clone() as SceneNode
      clone.name = SCALE_CLONE_NAME
      FocusOverlay.setManagedArtifactData(clone)
      topLevelFrame.appendChild(clone)
      if (FocusOverlay.canUseAbsoluteLayout(clone, topLevelFrame)) {
        ;(clone as any).layoutPositioning = 'ABSOLUTE'
      }

      if (typeof (clone as any).rescale === 'function') {
        ;(clone as any).rescale(scale)
      } else if (typeof (clone as any).resizeWithoutConstraints === 'function') {
        ;(clone as any).resizeWithoutConstraints((clone as any).width * scale, (clone as any).height * scale)
      } else if (typeof (clone as any).resize === 'function') {
        ;(clone as any).resize((clone as any).width * scale, (clone as any).height * scale)
      } else {
        FocusOverlay.logScaleCloneFailure('Unable to scale focus clone', target)
        clone.remove()
        return null
      }

      const cloneBounds = Utils.getAbsoluteBounds(clone)
      clone.x = clone.x + (scaledBounds.x - cloneBounds.x)
      clone.y = clone.y + (scaledBounds.y - cloneBounds.y)
      return clone
    } catch (error) {
      FocusOverlay.logScaleCloneFailure('Unable to create scale focus clone', target, error)
      if (clone) clone.remove()
      return null
    }
  }

  private static logScaleCloneFailure(message: string, target: SceneNode, error?: unknown) {
    console.warn(message, {
      targetId: target.id,
      targetName: target.name,
      targetType: target.type,
      error: error instanceof Error ? error.message : String(error || '')
    })
  }

  private static createSolidPaint(color: string): SolidPaint {
    return {
      type: 'SOLID',
      color: FocusOverlay.parseHexColor(color),
      opacity: 1
    }
  }

  private static parseHexColor(value: string): RGB {
    const fallback = '#0C8CE9'
    let hex = typeof value === 'string' ? value.trim() : fallback
    if (hex.startsWith('#')) hex = hex.slice(1)
    if (hex.length === 3) {
      hex = hex.split('').map(character => character + character).join('')
    }
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
      hex = fallback.slice(1)
    }
    return {
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255
    }
  }

}
