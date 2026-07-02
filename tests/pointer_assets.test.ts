import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getPointerPresetBytes,
  getPointerPresetDataUrl,
  getPointerPresetHotspot,
  POINTER_PRESETS
} from '../src/pointer_assets'
import { MAX_CUSTOM_POINTER_ASSETS } from '../src/pointer_asset_storage'

test('includes animated hand cursor as the second pointer preset', () => {
  assert.deepEqual(POINTER_PRESETS.map(asset => asset.id), ['arrow', 'hand'])
  assert.equal(POINTER_PRESETS[1].mimeType, 'image/gif')
  assert.deepEqual(getPointerPresetHotspot('hand'), { x: 0.221, y: 0.071 })
  const dataUrl = getPointerPresetDataUrl('hand')
  assert.equal(dataUrl.startsWith('data:image/gif;base64,'), true)
  const bytes = Buffer.from(dataUrl.split(',')[1], 'base64')
  assert.equal(bytes.subarray(0, 6).toString('ascii'), 'GIF89a')
  assert.equal(bytes.includes(Buffer.from('NETSCAPE2.0')), true)
  assert.equal(Buffer.from(getPointerPresetBytes('hand')).includes(Buffer.from('NETSCAPE2.0')), true)
})

test('limits presets and custom cursors to six cursor slots', () => {
  assert.equal(POINTER_PRESETS.length + MAX_CUSTOM_POINTER_ASSETS, 6)
  assert.equal(MAX_CUSTOM_POINTER_ASSETS, 4)
})
