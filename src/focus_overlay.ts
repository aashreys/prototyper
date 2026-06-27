import { NavigationFocusConfig, NavigationFocusMode } from "./navigation_focus";
import { Utils } from "./utils";

const OVERLAY_NAME = '__Prototyper Focus Overlay'
const OVERLAY_PLUGIN_DATA_KEY = 'prototyper_focus_overlay'
const DIRECT_FOCUS_PLUGIN_DATA_KEY = 'prototyper_focus_direct_state'

interface DirectFocusState {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly effects?: ReadonlyArray<Effect>
  readonly layoutPositioning?: string
}

export class FocusOverlay {

  static resetManagedFocus(root: SceneNode) {
    FocusOverlay.removeManagedOverlays(root)
    FocusOverlay.restoreManagedDirectFocus(root)
  }

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
      return FocusOverlay.createScaleShadow(target, focus)
    }
    if (focus.mode === NavigationFocusMode.SHADOW) {
      return FocusOverlay.createDirectShadow(topLevelFrame, target, focus)
    }

    const overlay = FocusOverlay.createManagedRectangle(OVERLAY_NAME, topLevelFrame)
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

    return overlay
  }

  private static createScaleShadow(target: SceneNode, focus: NavigationFocusConfig): SceneNode {
    const scale = Math.max(0.01, focus.scaleShadow.scalePercent / 100)
    const targetBounds = Utils.getAbsoluteBounds(target)
    const scaledBounds = FocusOverlay.getScaledBounds(targetBounds, scale)
    FocusOverlay.saveDirectFocusState(target)
    FocusOverlay.scaleNodeCentered(target, scaledBounds, scale)
    if (!FocusOverlay.applyDirectDropShadow(
      target,
      focus.scaleShadow.color,
      focus.scaleShadow.opacity / 100,
      focus.scaleShadow.blur,
      focus.scaleShadow.spread,
      focus.scaleShadow.offsetY
    )) {
      FocusOverlay.logDirectFocusFailure('Unable to apply scale shadow focus effect', target)
    }
    return target
  }

  private static createDirectShadow(topLevelFrame: FrameNode, target: SceneNode, focus: NavigationFocusConfig): SceneNode {
    FocusOverlay.saveDirectFocusState(target)
    if (FocusOverlay.applyDirectDropShadow(target, focus.shadow.color, 1, focus.shadow.blur, focus.shadow.spread, 0)) {
      return target
    }
    FocusOverlay.logDirectFocusFailure('Unable to apply direct shadow focus effect', target)
    return FocusOverlay.createShadowOverlayFallback(topLevelFrame, target, focus)
  }

  private static createShadowOverlayFallback(topLevelFrame: FrameNode, target: SceneNode, focus: NavigationFocusConfig): SceneNode {
    const shadow = FocusOverlay.createManagedRectangle(OVERLAY_NAME, topLevelFrame)
    FocusOverlay.insertOverlay(topLevelFrame, target, shadow, NavigationFocusMode.SHADOW)
    if (FocusOverlay.canUseAbsoluteLayout(shadow, topLevelFrame)) {
      shadow.layoutPositioning = 'ABSOLUTE'
    }

    const targetBounds = Utils.getAbsoluteBounds(target)
    const frameBounds = Utils.getAbsoluteBounds(topLevelFrame)
    const focusBounds = FocusOverlay.getFocusBounds(targetBounds, frameBounds, focus.shadow.padding)

    shadow.resize(focusBounds.width, focusBounds.height)
    shadow.x = focusBounds.x
    shadow.y = focusBounds.y
    shadow.cornerRadius = FocusOverlay.clampRadius(focus.shadow.cornerRadius, FocusOverlay.getMaxRadius(focusBounds))
    FocusOverlay.applyDropShadow(shadow, focus.shadow.color, 1, focus.shadow.blur, focus.shadow.spread, 0)
    return shadow
  }

  private static createManagedRectangle(name: string, topLevelFrame: FrameNode): RectangleNode {
    const overlay = figma.createRectangle()
    overlay.name = FocusOverlay.getManagedArtifactName(name, topLevelFrame)
    FocusOverlay.setManagedArtifactData(overlay)
    return overlay
  }

  private static getManagedArtifactName(name: string, topLevelFrame: FrameNode): string {
    return `${name} ${topLevelFrame.id}`
  }

  private static setManagedArtifactData(node: SceneNode) {
    node.setPluginData(OVERLAY_PLUGIN_DATA_KEY, 'true')
  }

  private static isManagedOverlay(node): boolean {
    return Boolean(node?.getPluginData && node.getPluginData(OVERLAY_PLUGIN_DATA_KEY) === 'true')
  }

  private static restoreManagedDirectFocus(root: SceneNode) {
    FocusOverlay.restoreDirectFocus(root)
    if (!Utils.hasChildren(root)) return
    const children = [...(root as any).children]
    for (const child of children) {
      FocusOverlay.restoreManagedDirectFocus(child)
    }
  }

  private static saveDirectFocusState(target: SceneNode) {
    if (!target?.setPluginData || target.getPluginData(DIRECT_FOCUS_PLUGIN_DATA_KEY).length > 0) return
    const node: any = target
    const state: DirectFocusState = {
      x: typeof node.x === 'number' ? node.x : 0,
      y: typeof node.y === 'number' ? node.y : 0,
      width: typeof node.width === 'number' ? node.width : 0,
      height: typeof node.height === 'number' ? node.height : 0,
      effects: 'effects' in node ? node.effects : undefined,
      layoutPositioning: 'layoutPositioning' in node ? node.layoutPositioning : undefined
    }
    target.setPluginData(DIRECT_FOCUS_PLUGIN_DATA_KEY, JSON.stringify(state))
  }

  private static restoreDirectFocus(target: SceneNode) {
    if (!target?.getPluginData) return
    const stateString = target.getPluginData(DIRECT_FOCUS_PLUGIN_DATA_KEY)
    if (!stateString || stateString.length === 0) return

    try {
      const state = JSON.parse(stateString) as DirectFocusState
      const node: any = target
      if ('effects' in node && state.effects) node.effects = state.effects
      if ('layoutPositioning' in node && state.layoutPositioning) node.layoutPositioning = state.layoutPositioning
      FocusOverlay.resizeNodeTo(target, state.width, state.height)
      if (typeof node.x === 'number') node.x = state.x
      if (typeof node.y === 'number') node.y = state.y
    } catch (error) {
      FocusOverlay.logDirectFocusFailure('Unable to restore direct focus state', target, error)
    }
    target.setPluginData(DIRECT_FOCUS_PLUGIN_DATA_KEY, '')
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
    overlay.effects = [FocusOverlay.createDropShadowEffect(colorValue, opacity, blur, spread, offsetY)]
  }

  private static applyDirectDropShadow(
    target: SceneNode,
    colorValue: string,
    opacity: number,
    blur: number,
    spread: number,
    offsetY: number
  ): boolean {
    const node: any = target
    if (!('effects' in node)) return false
    const effects = Array.isArray(node.effects) ? node.effects.slice() : []
    node.effects = [
      ...effects,
      FocusOverlay.createDropShadowEffect(colorValue, opacity, blur, spread, offsetY)
    ]
    return true
  }

  private static createDropShadowEffect(
    colorValue: string,
    opacity: number,
    blur: number,
    spread: number,
    offsetY: number
  ): DropShadowEffect {
    const color = FocusOverlay.parseHexColor(colorValue)
    return {
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
    }
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

  private static scaleNodeCentered(target: SceneNode, scaledBounds: Rect, scale: number) {
    const parent: any = target.parent
    const node: any = target
    if (parent && FocusOverlay.canUseAbsoluteLayout(target, parent)) {
      node.layoutPositioning = 'ABSOLUTE'
    }
    FocusOverlay.scaleNode(target, scale)
    const nextBounds = Utils.getAbsoluteBounds(target)
    if (typeof node.x === 'number') node.x = node.x + (scaledBounds.x - nextBounds.x)
    if (typeof node.y === 'number') node.y = node.y + (scaledBounds.y - nextBounds.y)
  }

  private static scaleNode(target: SceneNode, scale: number) {
    const node: any = target
    if (typeof node.rescale === 'function') {
      node.rescale(scale)
      return
    }
    FocusOverlay.resizeNodeTo(target, node.width * scale, node.height * scale)
  }

  private static resizeNodeTo(target: SceneNode, width: number, height: number) {
    const node: any = target
    if (typeof node.rescale === 'function' && typeof node.width === 'number' && node.width > 0) {
      node.rescale(width / node.width)
      return
    }
    if (typeof node.resizeWithoutConstraints === 'function') {
      node.resizeWithoutConstraints(width, height)
      return
    }
    if (typeof node.resize === 'function') {
      node.resize(width, height)
      return
    }
    FocusOverlay.logDirectFocusFailure('Unable to resize direct focus target', target)
  }

  private static logDirectFocusFailure(message: string, target: SceneNode, error?: unknown) {
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
