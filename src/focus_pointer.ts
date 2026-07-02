import {
  getPointerPresetAsset,
  getPointerPresetHotspot,
  pointerAssetBase64ToBytes
} from "./pointer_assets";
import { CustomPointerAsset, PointerAssetStorage } from "./pointer_asset_storage";
import {
  DEFAULT_POINTER_FOCUS,
  getPointerHotspot,
  getPointerPosition,
  getPointerSize,
  NavigationFocusConfig,
  NavigationFocusMode,
  PointerHotspot,
  PointerFocusConfig
} from "./navigation_focus";
import { PrototypeFrame } from "./prototype_frame";
import { Utils } from "./utils";

const POINTER_NAME = "__Prototyper Focus Pointer";
const POINTER_PLUGIN_DATA_KEY = "prototyper_focus_pointer";

export class FocusPointer {
  static async createPointers(
    protoFrames: Array<PrototypeFrame>,
    focus: NavigationFocusConfig
  ): Promise<number> {
    for (let protoFrame of protoFrames) {
      FocusPointer.resetManagedPointers(protoFrame.topLevelFrame)
    }

    if (focus.mode !== NavigationFocusMode.POINTER) return 0

    const pointerAsset = await FocusPointer.getPointerAsset(focus.pointer)
    const image = figma.createImage(pointerAsset.bytes)
    let pointersCreated = 0
    for (let protoFrame of protoFrames) {
      FocusPointer.createPointer(protoFrame.topLevelFrame, protoFrame.instance, focus.pointer, image.hash, pointerAsset.hotspot)
      pointersCreated++
    }
    return pointersCreated
  }

  static resetManagedPointers(root: SceneNode) {
    if (!Utils.hasChildren(root)) return
    const children = [...(root as any).children]
    for (const child of children) {
      if (FocusPointer.isManagedPointer(child)) {
        child.remove()
      } else {
        FocusPointer.resetManagedPointers(child)
      }
    }
  }

  static createPointer(
    topLevelFrame: FrameNode,
    target: SceneNode,
    pointer: PointerFocusConfig,
    imageHash: string,
    hotspot: PointerHotspot = getPointerHotspot(pointer)
  ): RectangleNode {
    const size = getPointerSize(pointer)
    const position = getPointerPosition(pointer)
    const targetBounds = Utils.getAbsoluteBounds(target)
    const frameBounds = Utils.getAbsoluteBounds(topLevelFrame)
    const pointX = targetBounds.x - frameBounds.x + targetBounds.width * position.x
    const pointY = targetBounds.y - frameBounds.y + targetBounds.height * position.y
    const node = figma.createRectangle()
    node.name = POINTER_NAME
    node.setPluginData(POINTER_PLUGIN_DATA_KEY, "true")
    node.resize(size, size)
    node.x = pointX - size * hotspot.x
    node.y = pointY - size * hotspot.y
    node.fills = [
      {
        type: 'IMAGE',
        imageHash: imageHash,
        scaleMode: 'FIT'
      }
    ]
    node.strokes = []
    if (FocusPointer.canUseAbsoluteLayout(node, topLevelFrame)) {
      node.layoutPositioning = "ABSOLUTE"
    }
    topLevelFrame.appendChild(node)
    return node
  }

  private static async getPointerAsset(pointer: PointerFocusConfig): Promise<{
    readonly bytes: Uint8Array
    readonly hotspot: PointerHotspot
  }> {
    if (pointer.assetSource !== 'custom') {
      return {
        bytes: pointerAssetBase64ToBytes(getPointerPresetAsset(pointer.presetId).base64),
        hotspot: getPointerPresetHotspot(pointer.presetId)
      }
    }

    const asset = await FocusPointer.getSelectedCustomPointerAsset(pointer)
    if (!asset) {
      const fallbackAsset = getPointerPresetAsset(DEFAULT_POINTER_FOCUS.presetId)
      return {
        bytes: pointerAssetBase64ToBytes(fallbackAsset.base64),
        hotspot: getPointerPresetHotspot(DEFAULT_POINTER_FOCUS.presetId)
      }
    }
    return {
      bytes: asset.bytes,
      hotspot: getPointerHotspot({ ...pointer, hotspot: asset.hotspot })
    }
  }

  private static async getSelectedCustomPointerAsset(pointer: PointerFocusConfig): Promise<CustomPointerAsset | undefined> {
    const assets = await PointerAssetStorage.getCustomAssets()
    if (pointer.customAssetId) {
      return assets.find(asset => asset.id === pointer.customAssetId)
    }
    return assets[0]
  }

  private static isManagedPointer(node): boolean {
    return Boolean(
      node?.getPluginData &&
      node.getPluginData(POINTER_PLUGIN_DATA_KEY) === "true"
    )
  }

  private static canUseAbsoluteLayout(
    node: SceneNode,
    topLevelFrame: FrameNode,
  ): node is SceneNode & { layoutPositioning: "AUTO" | "ABSOLUTE" } {
    return (
      "layoutPositioning" in node &&
      "layoutMode" in topLevelFrame &&
      topLevelFrame.layoutMode !== "NONE"
    )
  }
}
