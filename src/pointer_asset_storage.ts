import {
  DEFAULT_POINTER_HOTSPOT,
  PointerHotspot,
  normalizePointerHotspot
} from "./navigation_focus";
import {
  normalizePointerAssetPayload,
  PointerAssetMetadata,
  PointerAssetPayload
} from "./pointer_asset_validation";

export interface CustomPointerAsset extends PointerAssetPayload {
  readonly id: string
  readonly hotspot: PointerHotspot
}

export const MAX_CUSTOM_POINTER_ASSETS = 5

export class PointerAssetStorage {
  static POINTER_ASSETS_KEY = 'com.aashreys.prototyper.pointer.customAssets'
  static LEGACY_POINTER_ASSET_KEY = 'com.aashreys.prototyper.pointer.customAsset'

  static async getCustomAssets(): Promise<Array<CustomPointerAsset>> {
    try {
      const storedAssets = await figma.clientStorage.getAsync(PointerAssetStorage.POINTER_ASSETS_KEY)
      if (typeof storedAssets !== 'undefined') {
        return normalizeCustomPointerAssets(storedAssets)
      }

      const legacyAsset = normalizePointerAssetPayload(
        await figma.clientStorage.getAsync(PointerAssetStorage.LEGACY_POINTER_ASSET_KEY)
      )
      if (!legacyAsset) return []

      const migratedAsset = createStoredCustomPointerAsset(legacyAsset, DEFAULT_POINTER_HOTSPOT, 'legacy-custom-pointer')
      await PointerAssetStorage.saveCustomAssets([migratedAsset])
      await figma.clientStorage.deleteAsync(PointerAssetStorage.LEGACY_POINTER_ASSET_KEY)
      return [migratedAsset]
    } catch (error) {
      console.error('Failed to get custom pointer assets', {
        error: error instanceof Error ? error.message : String(error || '')
      })
      return []
    }
  }

  static async getCustomAsset(id?: string): Promise<CustomPointerAsset | undefined> {
    const assets = await PointerAssetStorage.getCustomAssets()
    if (id) return assets.find(asset => asset.id === id)
    return assets[0]
  }

  static async getCustomAssetMetadata(): Promise<PointerAssetMetadata | undefined> {
    const asset = await PointerAssetStorage.getCustomAsset()
    return asset?.metadata
  }

  static async saveCustomAsset(asset: CustomPointerAsset): Promise<Array<CustomPointerAsset>> {
    const normalizedAsset = normalizeCustomPointerAsset(asset)
    if (!normalizedAsset) {
      throw new Error('Use a PNG or GIF pointer image.')
    }

    const assets = await PointerAssetStorage.getCustomAssets()
    const existingIndex = assets.findIndex(item => item.id === normalizedAsset.id)
    if (existingIndex >= 0) {
      const nextAssets = [...assets]
      nextAssets[existingIndex] = normalizedAsset
      await PointerAssetStorage.saveCustomAssets(nextAssets)
      return nextAssets
    }

    if (assets.length >= MAX_CUSTOM_POINTER_ASSETS) {
      throw new Error('Delete a custom pointer before adding another.')
    }

    const nextAssets = [...assets, normalizedAsset]
    await PointerAssetStorage.saveCustomAssets(nextAssets)
    return nextAssets
  }

  static async updateCustomAssetHotspot(id: string, hotspot: PointerHotspot): Promise<Array<CustomPointerAsset>> {
    const assets = await PointerAssetStorage.getCustomAssets()
    const index = assets.findIndex(asset => asset.id === id)
    if (index < 0) throw new Error('Custom pointer was not found.')

    const nextAssets = [...assets]
    nextAssets[index] = {
      ...nextAssets[index],
      hotspot: normalizePointerHotspot(hotspot)
    }
    await PointerAssetStorage.saveCustomAssets(nextAssets)
    return nextAssets
  }

  static async deleteCustomAsset(id?: string): Promise<Array<CustomPointerAsset>> {
    try {
      const assets = await PointerAssetStorage.getCustomAssets()
      const nextAssets = id
        ? assets.filter(asset => asset.id !== id)
        : []
      await PointerAssetStorage.saveCustomAssets(nextAssets)
      return nextAssets
    } catch (error) {
      console.error('Failed to delete custom pointer asset', {
        error: error instanceof Error ? error.message : String(error || '')
      })
      return PointerAssetStorage.getCustomAssets()
    }
  }

  private static async saveCustomAssets(assets: Array<CustomPointerAsset>): Promise<void> {
    await figma.clientStorage.setAsync(
      PointerAssetStorage.POINTER_ASSETS_KEY,
      normalizeCustomPointerAssets(assets).slice(0, MAX_CUSTOM_POINTER_ASSETS)
    )
  }
}

export function createStoredCustomPointerAsset(
  asset: PointerAssetPayload,
  hotspot: PointerHotspot = DEFAULT_POINTER_HOTSPOT,
  id = createCustomPointerAssetId()
): CustomPointerAsset {
  return {
    ...asset,
    id: id,
    hotspot: normalizePointerHotspot(hotspot)
  }
}

export function createCustomPointerAssetId(): string {
  return `custom-pointer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function normalizeCustomPointerAssets(value): Array<CustomPointerAsset> {
  if (!Array.isArray(value)) return []
  const assets: Array<CustomPointerAsset> = []
  for (const item of value) {
    const asset = normalizeCustomPointerAsset(item)
    if (asset && !assets.some(existing => existing.id === asset.id)) {
      assets.push(asset)
    }
    if (assets.length >= MAX_CUSTOM_POINTER_ASSETS) break
  }
  return assets
}

function normalizeCustomPointerAsset(value): CustomPointerAsset | undefined {
  const asset = normalizePointerAssetPayload(value)
  if (!asset) return undefined
  return {
    ...asset,
    id: typeof value?.id === 'string' && value.id.length > 0
      ? value.id
      : createCustomPointerAssetId(),
    hotspot: normalizePointerHotspot(value?.hotspot)
  }
}
