import assert from 'node:assert/strict'
import test from 'node:test'
import { POINTER_MAX_FILE_BYTES } from '../src/pointer_assets'
import { createPointerAssetPayload } from '../src/pointer_asset_validation'

function createGif(width: number, height: number): Uint8Array {
  return new Uint8Array([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61,
    width & 0xff, (width >> 8) & 0xff,
    height & 0xff, (height >> 8) & 0xff
  ])
}

function createPng(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24)
  bytes.set([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], 0)
  writeUint32(bytes, 16, width)
  writeUint32(bytes, 20, height)
  return bytes
}

function writeUint32(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = (value >>> 24) & 0xff
  bytes[offset + 1] = (value >>> 16) & 0xff
  bytes[offset + 2] = (value >>> 8) & 0xff
  bytes[offset + 3] = value & 0xff
}

test('accepts PNG pointer assets up to 1024 px', () => {
  const result = createPointerAssetPayload(
    { name: 'pointer.png', type: 'image/png', size: 24 },
    createPng(1024, 512),
    123
  )

  assert.equal(result.error, undefined)
  assert.equal(result.payload?.metadata.mimeType, 'image/png')
  assert.equal(result.payload?.metadata.width, 1024)
  assert.equal(result.payload?.metadata.height, 512)
  assert.equal(result.payload?.metadata.updatedAt, 123)
})

test('accepts GIF pointer assets', () => {
  const result = createPointerAssetPayload(
    { name: 'pointer.gif', type: 'image/gif', size: 10 },
    createGif(256, 128)
  )

  assert.equal(result.error, undefined)
  assert.equal(result.payload?.metadata.mimeType, 'image/gif')
  assert.equal(result.payload?.metadata.width, 256)
  assert.equal(result.payload?.metadata.height, 128)
})

test('rejects unsupported pointer assets', () => {
  const result = createPointerAssetPayload(
    { name: 'pointer.jpg', type: 'image/jpeg', size: 4 },
    new Uint8Array([0xff, 0xd8, 0xff, 0xdb])
  )

  assert.equal(result.error, 'Use a PNG or GIF pointer image.')
})

test('rejects pointer assets larger than 1024 px', () => {
  const result = createPointerAssetPayload(
    { name: 'pointer.png', type: 'image/png', size: 24 },
    createPng(1025, 1024)
  )

  assert.equal(result.error, 'File too large. Must be 1024 x 1024 px or smaller.')
})

test('rejects pointer assets larger than 1 MB', () => {
  const result = createPointerAssetPayload(
    { name: 'pointer.gif', type: 'image/gif', size: POINTER_MAX_FILE_BYTES + 1 },
    createGif(128, 128)
  )

  assert.equal(result.error, 'File too large. Must be 1 MB or smaller.')
})
