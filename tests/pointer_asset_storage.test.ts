import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createStoredCustomPointerAsset,
  MAX_CUSTOM_POINTER_ASSETS,
  PointerAssetStorage
} from '../src/pointer_asset_storage'
import { createPointerAssetPayload } from '../src/pointer_asset_validation'

function setFigma(figma: unknown) {
  ;(globalThis as any).figma = figma
}

function createGif(width: number, height: number): Uint8Array {
  return new Uint8Array([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61,
    width & 0xff, (width >> 8) & 0xff,
    height & 0xff, (height >> 8) & 0xff,
    0x00, 0x00, 0x00
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
  const asset = createStoredCustomPointerAsset(result.payload!, { x: 0.4, y: 0.6 }, 'cursor-1')

  await PointerAssetStorage.saveCustomAsset(asset)
  const loadedAssets = await PointerAssetStorage.getCustomAssets()
  const loaded = await PointerAssetStorage.getCustomAsset('cursor-1')

  assert.equal(loadedAssets.length, 1)
  assert.equal(loaded?.id, 'cursor-1')
  assert.deepEqual(loaded?.hotspot, { x: 0.4, y: 0.6 })
  assert.equal(loaded?.metadata.name, 'pointer.gif')
  assert.equal(loaded?.metadata.mimeType, 'image/gif')
  assert.equal(loaded?.metadata.width, 256)
  assert.equal(loaded?.metadata.height, 128)
  assert.deepEqual(Array.from(loaded?.bytes || []), Array.from(result.payload!.bytes))

  await PointerAssetStorage.updateCustomAssetHotspot('cursor-1', { x: 0.2, y: 0.8 })
  assert.deepEqual((await PointerAssetStorage.getCustomAsset('cursor-1'))?.hotspot, { x: 0.2, y: 0.8 })

  await PointerAssetStorage.deleteCustomAsset('cursor-1')

  assert.equal(await PointerAssetStorage.getCustomAsset(), undefined)
})

test('migrates legacy custom pointer asset into list storage', async () => {
  const stored = new Map<string, unknown>()
  const result = createPointerAssetPayload(
    { name: 'legacy.gif', type: 'image/gif', size: 10 },
    createGif(64, 64),
    456
  )
  stored.set(PointerAssetStorage.LEGACY_POINTER_ASSET_KEY, result.payload!)
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

  const assets = await PointerAssetStorage.getCustomAssets()

  assert.equal(assets.length, 1)
  assert.equal(assets[0].id, 'legacy-custom-pointer')
  assert.equal(assets[0].metadata.name, 'legacy.gif')
  assert.equal(stored.has(PointerAssetStorage.LEGACY_POINTER_ASSET_KEY), false)
  assert.ok(Array.isArray(stored.get(PointerAssetStorage.POINTER_ASSETS_KEY)))
})

test('enforces custom pointer asset limit', async () => {
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

  for (let index = 0; index < MAX_CUSTOM_POINTER_ASSETS; index++) {
    const result = createPointerAssetPayload(
      { name: `pointer-${index}.gif`, type: 'image/gif', size: 10 },
      createGif(32, 32),
      index
    )
    await PointerAssetStorage.saveCustomAsset(
      createStoredCustomPointerAsset(result.payload!, { x: 0.1, y: 0.2 }, `cursor-${index}`)
    )
  }

  const result = createPointerAssetPayload(
    { name: 'extra.gif', type: 'image/gif', size: 10 },
    createGif(32, 32),
    999
  )
  await assert.rejects(
    PointerAssetStorage.saveCustomAsset(
      createStoredCustomPointerAsset(result.payload!, { x: 0.1, y: 0.2 }, 'cursor-extra')
    ),
    /Delete a custom pointer/
  )
})

test('returns empty values when custom pointer asset storage fails', async () => {
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
    assert.deepEqual(await PointerAssetStorage.getCustomAssets(), [])
    assert.equal(await PointerAssetStorage.getCustomAsset(), undefined)
  } finally {
    console.error = original
  }
})
