import { getPointerPresetAsset, pointerAssetBase64ToBytes } from "./pointer_assets";
import { PointerAssetStorage } from "./pointer_asset_storage";
import {
  getPointerHotspot,
  getPointerPosition,
  getPointerSize,
  NavigationFocusConfig,
  NavigationFocusMode,
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

    const imageBytes = await FocusPointer.getPointerImageBytes(focus.pointer)
    const image = figma.createImage(imageBytes)
    let pointersCreated = 0
    for (let protoFrame of protoFrames) {
      FocusPointer.createPointer(protoFrame.topLevelFrame, protoFrame.instance, focus.pointer, image.hash)
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
    imageHash: string
  ): RectangleNode {
    const size = getPointerSize(pointer)
    const position = getPointerPosition(pointer)
    const hotspot = getPointerHotspot(pointer)
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

  private static async getPointerImageBytes(pointer: PointerFocusConfig): Promise<Uint8Array> {
    if (pointer.assetSource !== 'custom') {
      return pointerAssetBase64ToBytes(getPointerPresetAsset(pointer.presetId).base64)
    }

    const asset = await PointerAssetStorage.getCustomAsset()
    if (!asset) throw new Error('Upload a custom pointer image or choose a built-in pointer.')
    return asset.bytes
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
