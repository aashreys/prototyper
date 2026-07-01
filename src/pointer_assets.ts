export interface PointerPresetAsset {
  readonly id: string
  readonly label: string
  readonly mimeType: PointerAssetMimeType
  readonly base64: string
}

export type PointerAssetMimeType = 'image/png' | 'image/gif'

export const POINTER_MAX_DIMENSION = 1024
export const POINTER_MAX_FILE_BYTES = 5 * 1024 * 1024

export const POINTER_PRESETS: ReadonlyArray<PointerPresetAsset> = [
  {
    id: 'arrow',
    label: 'Arrow',
    mimeType: 'image/gif',
    base64: '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'
  }
]

export function getPointerPresetAsset(id: string): PointerPresetAsset {
  return POINTER_PRESETS.find(asset => asset.id === id) || POINTER_PRESETS[0]
}

export function getPointerPresetDataUrl(id: string): string {
  const asset = getPointerPresetAsset(id)
  return `data:${asset.mimeType};base64,${asset.base64}`
}

export function pointerAssetBase64ToBytes(base64: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes
  }

  const BufferConstructor = (globalThis as any).Buffer
  if (BufferConstructor) return new Uint8Array(BufferConstructor.from(base64, 'base64'))
  throw new Error('Unable to decode pointer asset.')
}
