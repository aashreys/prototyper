import {
  getLoopingGifBytes,
  POINTER_MAX_DIMENSION,
  POINTER_MAX_FILE_BYTES,
  PointerAssetMimeType
} from "./pointer_assets";

export interface PointerAssetMetadata {
  readonly name: string
  readonly mimeType: PointerAssetMimeType
  readonly size: number
  readonly width: number
  readonly height: number
  readonly updatedAt: number
}

export interface PointerAssetPayload {
  readonly bytes: Uint8Array
  readonly metadata: PointerAssetMetadata
}

export interface PointerAssetValidationResult {
  readonly error?: string
  readonly payload?: PointerAssetPayload
}

export function createPointerAssetPayload(
  file: { readonly name: string; readonly type?: string; readonly size?: number },
  bytes: Uint8Array,
  updatedAt = Date.now()
): PointerAssetValidationResult {
  const mimeType = detectPointerAssetMimeType(file.name, file.type, bytes)
  if (!mimeType) {
    return { error: 'Use a PNG or GIF pointer image.' }
  }

  const size = typeof file.size === 'number' ? file.size : bytes.byteLength
  if (size > POINTER_MAX_FILE_BYTES) {
    return { error: 'File too large. Must be 1 MB or smaller.' }
  }

  const dimensions = getPointerAssetDimensions(mimeType, bytes)
  if (!dimensions) {
    return { error: 'Could not read pointer image dimensions.' }
  }

  if (dimensions.width > POINTER_MAX_DIMENSION || dimensions.height > POINTER_MAX_DIMENSION) {
    return { error: 'File too large. Must be 1024 x 1024 px or smaller.' }
  }

  return {
    payload: {
      bytes: mimeType === 'image/gif' ? getLoopingGifBytes(bytes) : bytes,
      metadata: {
        name: file.name || 'Pointer',
        mimeType: mimeType,
        size: size,
        width: dimensions.width,
        height: dimensions.height,
        updatedAt: updatedAt
      }
    }
  }
}

export function normalizePointerAssetPayload(value): PointerAssetPayload | undefined {
  if (!value || typeof value !== 'object') return undefined
  const bytes = normalizeBytes(value.bytes)
  if (!bytes) return undefined
  const metadata = normalizePointerAssetMetadata(value.metadata)
  if (!metadata) return undefined
  const result = createPointerAssetPayload(metadata, bytes, metadata.updatedAt)
  return result.payload
}

function normalizePointerAssetMetadata(value): PointerAssetMetadata | undefined {
  if (!value || typeof value !== 'object') return undefined
  if (value.mimeType !== 'image/png' && value.mimeType !== 'image/gif') return undefined
  if (typeof value.width !== 'number' || typeof value.height !== 'number') return undefined
  return {
    name: typeof value.name === 'string' && value.name.length > 0 ? value.name : 'Pointer',
    mimeType: value.mimeType,
    size: typeof value.size === 'number' ? value.size : 0,
    width: value.width,
    height: value.height,
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : Date.now()
  }
}

function normalizeBytes(value): Uint8Array | undefined {
  if (value instanceof Uint8Array) return value
  if (Array.isArray(value)) return new Uint8Array(value)
  if (value && typeof value === 'object' && Array.isArray(value.data)) {
    return new Uint8Array(value.data)
  }
  return undefined
}

function detectPointerAssetMimeType(
  fileName: string,
  fileType: string | undefined,
  bytes: Uint8Array
): PointerAssetMimeType | undefined {
  if (isPng(bytes)) return 'image/png'
  if (isGif(bytes)) return 'image/gif'
  const normalizedType = (fileType || '').toLowerCase()
  if (normalizedType === 'image/png' || normalizedType === 'image/gif') return normalizedType
  const normalizedName = (fileName || '').toLowerCase()
  if (normalizedName.endsWith('.png')) return 'image/png'
  if (normalizedName.endsWith('.gif')) return 'image/gif'
  return undefined
}

function getPointerAssetDimensions(
  mimeType: PointerAssetMimeType,
  bytes: Uint8Array
): { readonly width: number; readonly height: number } | undefined {
  if (mimeType === 'image/png') return getPngDimensions(bytes)
  return getGifDimensions(bytes)
}

function getPngDimensions(bytes: Uint8Array): { readonly width: number; readonly height: number } | undefined {
  if (!isPng(bytes) || bytes.length < 24) return undefined
  return {
    width: readUint32(bytes, 16),
    height: readUint32(bytes, 20)
  }
}

function getGifDimensions(bytes: Uint8Array): { readonly width: number; readonly height: number } | undefined {
  if (!isGif(bytes) || bytes.length < 10) return undefined
  return {
    width: readUint16(bytes, 6),
    height: readUint16(bytes, 8)
  }
}

function isPng(bytes: Uint8Array): boolean {
  return bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4E &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0D &&
    bytes[5] === 0x0A &&
    bytes[6] === 0x1A &&
    bytes[7] === 0x0A
}

function isGif(bytes: Uint8Array): boolean {
  if (bytes.length < 6) return false
  const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5])
  return header === 'GIF87a' || header === 'GIF89a'
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 24) >>> 0) +
    ((bytes[offset + 1] << 16) >>> 0) +
    ((bytes[offset + 2] << 8) >>> 0) +
    bytes[offset + 3]
}

function readUint16(bytes: Uint8Array, offset: number): number {
  return bytes[offset] + (bytes[offset + 1] << 8)
}
