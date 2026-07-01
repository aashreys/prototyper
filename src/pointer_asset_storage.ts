import {
  normalizePointerAssetPayload,
  PointerAssetMetadata,
  PointerAssetPayload
} from "./pointer_asset_validation";

export class PointerAssetStorage {
  static POINTER_ASSET_KEY = 'com.aashreys.prototyper.pointer.customAsset'

  static async getCustomAsset(): Promise<PointerAssetPayload | undefined> {
    try {
      const storedAsset = await figma.clientStorage.getAsync(PointerAssetStorage.POINTER_ASSET_KEY)
      return normalizePointerAssetPayload(storedAsset)
    } catch (error) {
      console.error('Failed to get custom pointer asset', {
        error: error instanceof Error ? error.message : String(error || '')
      })
      return undefined
    }
  }

  static async getCustomAssetMetadata(): Promise<PointerAssetMetadata | undefined> {
    const asset = await PointerAssetStorage.getCustomAsset()
    return asset?.metadata
  }

  static async saveCustomAsset(asset: PointerAssetPayload): Promise<PointerAssetPayload> {
    const normalizedAsset = normalizePointerAssetPayload(asset)
    if (!normalizedAsset) {
      throw new Error('Use a PNG or GIF pointer image.')
    }

    await figma.clientStorage.setAsync(PointerAssetStorage.POINTER_ASSET_KEY, normalizedAsset)
    return normalizedAsset
  }

  static async deleteCustomAsset(): Promise<void> {
    try {
      await figma.clientStorage.deleteAsync(PointerAssetStorage.POINTER_ASSET_KEY)
    } catch (error) {
      console.error('Failed to delete custom pointer asset', {
        error: error instanceof Error ? error.message : String(error || '')
      })
    }
  }
}
