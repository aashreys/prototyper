import { NavigationFocusConfig, NavigationFocusMode } from "./navigation_focus";
import { Utils } from "./utils";

const OVERLAY_NAME = '__Prototyper Focus Overlay'
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
    const overlay = figma.createRectangle()
    overlay.name = OVERLAY_NAME
    overlay.setPluginData(OVERLAY_PLUGIN_DATA_KEY, 'true')
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

  private static isManagedOverlay(node): boolean {
    return Boolean(node?.getPluginData && node.getPluginData(OVERLAY_PLUGIN_DATA_KEY) === 'true')
  }

  private static insertOverlay(topLevelFrame: FrameNode, target: SceneNode, overlay: RectangleNode, mode: NavigationFocusMode) {
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

  private static canUseAbsoluteLayout(overlay: RectangleNode, parent: FrameNode): boolean {
    return 'layoutPositioning' in overlay && 'layoutMode' in parent && parent.layoutMode !== 'NONE'
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
    const color = FocusOverlay.parseHexColor(focus.shadow.color)
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
        a: 1
      },
      offset: {
        x: 0,
        y: 0
      },
      radius: focus.shadow.blur,
      spread: focus.shadow.spread,
      visible: true,
      blendMode: 'NORMAL',
      showShadowBehindNode: true
    }]
  }

  private static getPadding(focus: NavigationFocusConfig): number {
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

  private static setOverlayCornerRadii(overlay: RectangleNode, radii: [number, number, number, number], padding: number, maxRadius: number) {
    const [topLeft, topRight, bottomRight, bottomLeft] = radii.map(radius => FocusOverlay.clampRadius(radius + padding, maxRadius))
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
