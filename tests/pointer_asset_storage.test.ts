import assert from 'node:assert/strict'
import test from 'node:test'
import { PointerAssetStorage } from '../src/pointer_asset_storage'
import { createPointerAssetPayload } from '../src/pointer_asset_validation'

function setFigma(figma: unknown) {
  ;(globalThis as any).figma = figma
}

function createGif(width: number, height: number): Uint8Array {
  return new Uint8Array([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61,
    width & 0xff, (width >> 8) & 0xff,
    height & 0xff, (height >> 8) & 0xff
  ])
}

test('saves and loads custom pointer assets from client storage', async () => {
  const stored = new Map<string, unknown>()
  setFigma({
    clientStorage: {
      getAsync: async (key: string) => stored.get(key),
      setAsync: async (key: string, value: unknown) => {
        stored.set(key, value)
      },
      deleteAsync: async (key: string) => {
        stored.delete(key)
      }
    }
  })
  const result = createPointerAssetPayload(
    { name: 'pointer.gif', type: 'image/gif', size: 10 },
    createGif(256, 128),
    123
  )

  await PointerAssetStorage.saveCustomAsset(result.payload!)
  const loaded = await PointerAssetStorage.getCustomAsset()

  assert.equal(loaded?.metadata.name, 'pointer.gif')
  assert.equal(loaded?.metadata.mimeType, 'image/gif')
  assert.equal(loaded?.metadata.width, 256)
  assert.equal(loaded?.metadata.height, 128)
  assert.deepEqual(Array.from(loaded?.bytes || []), Array.from(result.payload!.bytes))

  await PointerAssetStorage.deleteCustomAsset()

  assert.equal(await PointerAssetStorage.getCustomAsset(), undefined)
})

test('returns undefined when custom pointer asset storage fails', async () => {
  setFigma({
    clientStorage: {
      getAsync: async () => {
        throw new Error('storage failed')
      }
    }
  })
  const original = console.error
  console.error = (() => undefined) as any
  try {
    assert.equal(await PointerAssetStorage.getCustomAsset(), undefined)
  } finally {
    console.error = original
  }
})
