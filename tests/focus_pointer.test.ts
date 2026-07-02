import assert from 'node:assert/strict'
import test from 'node:test'
import { FocusPointer } from '../src/focus_pointer'
import { NavigationFocusMode } from '../src/navigation_focus'
import { createStoredCustomPointerAsset, PointerAssetStorage } from '../src/pointer_asset_storage'
import { createPointerAssetPayload } from '../src/pointer_asset_validation'

function assertApprox(actual: number, expected: number) {
  assert.equal(Math.round(actual * 100) / 100, expected)
}

function setFigmaForPointer(stored = new Map<string, unknown>()) {
  ;(globalThis as any).figma = {
    createImage: (bytes: Uint8Array) => ({
      hash: `hash-${bytes.byteLength}`
    }),
    createRectangle: () => createRectangle(),
    clientStorage: {
      getAsync: async (key: string) => stored.get(key),
      setAsync: async (key: string, value: unknown) => {
        stored.set(key, value)
      },
      deleteAsync: async (key: string) => {
        stored.delete(key)
      }
    }
  }
}

function createGif(width: number, height: number): Uint8Array {
  return new Uint8Array([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61,
    width & 0xff, (width >> 8) & 0xff,
    height & 0xff, (height >> 8) & 0xff
  ])
}

function createRectangle() {
  return {
    id: 'pointer',
    name: '',
    type: 'RECTANGLE',
    parent: undefined,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    fills: [],
    strokes: [],
    layoutPositioning: 'AUTO',
    pluginData: {},
    removed: false,
    resize(width: number, height: number) {
      this.width = width
      this.height = height
    },
    setPluginData(key: string, value: string) {
      this.pluginData[key] = value
    },
    getPluginData(key: string) {
      return this.pluginData[key] || ''
    },
    remove() {
      this.removed = true
      if (!this.parent) return
      const index = this.parent.children.indexOf(this)
      if (index >= 0) this.parent.children.splice(index, 1)
    }
  } as any
}

function createFrame(id: string, bounds: Rect) {
  return {
    id: id,
    name: id,
    type: 'FRAME',
    parent: { type: 'PAGE' },
    children: [],
    layoutMode: 'NONE',
    absoluteBoundingBox: bounds,
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    appendChild(child) {
      child.parent = this
      this.children.push(child)
    }
  } as any
}

function createLayer(id: string, parent: any, bounds: Rect) {
  const layer = {
    id: id,
    name: id,
    type: 'RECTANGLE',
    parent: parent,
    absoluteBoundingBox: bounds,
    x: bounds.x - parent.absoluteBoundingBox.x,
    y: bounds.y - parent.absoluteBoundingBox.y,
    width: bounds.width,
    height: bounds.height
  } as any
  parent.children.push(layer)
  return layer
}

function createFocus(pointerOverrides = {}) {
  return {
    mode: NavigationFocusMode.POINTER,
    variant: { property: '', from: '', to: '' },
    components: [],
    stroke: {},
    fill: {},
    shadow: {},
    scaleShadow: {},
    pointer: {
      enabled: true,
      assetSource: 'preset',
      presetId: 'arrow',
      customAssetId: '',
      sizeMode: '48',
      customSize: 48,
      hotspot: { x: 0.204, y: 0.1 },
      positionPreset: 'bottom-right',
      position: { x: 1, y: 1 },
      ...pointerOverrides
    }
  } as any
}

test('creates one fitted pointer per prototype frame', async () => {
  setFigmaForPointer()
  const frameA = createFrame('Frame A', { x: 100, y: 200, width: 500, height: 400 })
  const targetA = createLayer('Target A', frameA, { x: 150, y: 260, width: 80, height: 40 })
  const frameB = createFrame('Frame B', { x: 700, y: 200, width: 500, height: 400 })
  const targetB = createLayer('Target B', frameB, { x: 790, y: 300, width: 40, height: 20 })

  const count = await FocusPointer.createPointers(
    [
      { topLevelFrame: frameA, instance: targetA },
      { topLevelFrame: frameB, instance: targetB }
    ] as any,
    createFocus()
  )

  const pointerA = frameA.children[1]
  const pointerB = frameB.children[1]
  assert.equal(count, 2)
  assert.equal(pointerA.name, '__Prototyper Focus Pointer')
  assert.equal(pointerB.name, '__Prototyper Focus Pointer')
  assert.equal(pointerA.width, 48)
  assert.equal(pointerA.height, 48)
  assertApprox(pointerA.x, 120.21)
  assertApprox(pointerA.y, 95.2)
  assert.equal(pointerA.fills[0].type, 'IMAGE')
  assert.equal(pointerA.fills[0].scaleMode, 'FIT')
  assert.equal(pointerA.getPluginData('prototyper_focus_pointer'), 'true')
  assertApprox(pointerB.x, 120.21)
  assertApprox(pointerB.y, 115.2)
})

test('uses custom proportional position and custom size', async () => {
  setFigmaForPointer()
  const frame = createFrame('Frame', { x: 100, y: 200, width: 500, height: 400 })
  const target = createLayer('Target', frame, { x: 150, y: 260, width: 80, height: 40 })

  await FocusPointer.createPointers(
    [{ topLevelFrame: frame, instance: target }] as any,
    createFocus({
      sizeMode: 'custom',
      customSize: 40,
      positionPreset: 'custom',
      position: { x: 0.25, y: 0.75 }
    })
  )

  const pointer = frame.children[1]
  assert.equal(pointer.width, 40)
  assert.equal(pointer.height, 40)
  assertApprox(pointer.x, 61.84)
  assertApprox(pointer.y, 86)
})

test('uses custom proportional position outside the focused layer', async () => {
  setFigmaForPointer()
  const frame = createFrame('Frame', { x: 100, y: 200, width: 500, height: 400 })
  const target = createLayer('Target', frame, { x: 150, y: 260, width: 80, height: 40 })

  await FocusPointer.createPointers(
    [{ topLevelFrame: frame, instance: target }] as any,
    createFocus({
      sizeMode: 'custom',
      customSize: 40,
      positionPreset: 'custom',
      position: { x: 1.1, y: -0.1 }
    })
  )

  const pointer = frame.children[1]
  assertApprox(pointer.x, 129.84)
  assertApprox(pointer.y, 52)
})

test('uses selected custom pointer asset hotspot', async () => {
  const stored = new Map<string, unknown>()
  const result = createPointerAssetPayload(
    { name: 'pointer.gif', type: 'image/gif', size: 10 },
    createGif(40, 40),
    123
  )
  stored.set(PointerAssetStorage.POINTER_ASSETS_KEY, [
    createStoredCustomPointerAsset(result.payload!, { x: 0.5, y: 0.5 }, 'cursor-1')
  ])
  setFigmaForPointer(stored)
  const frame = createFrame('Frame', { x: 100, y: 200, width: 500, height: 400 })
  const target = createLayer('Target', frame, { x: 150, y: 260, width: 80, height: 40 })

  await FocusPointer.createPointers(
    [{ topLevelFrame: frame, instance: target }] as any,
    createFocus({
      assetSource: 'custom',
      customAssetId: 'cursor-1'
    })
  )

  const pointer = frame.children[1]
  assertApprox(pointer.x, 106)
  assertApprox(pointer.y, 76)
  assert.equal(pointer.fills[0].imageHash, `hash-${result.payload!.bytes.byteLength}`)
})

test('falls back to built-in pointer when selected custom pointer is missing', async () => {
  setFigmaForPointer()
  const frame = createFrame('Frame', { x: 100, y: 200, width: 500, height: 400 })
  const target = createLayer('Target', frame, { x: 150, y: 260, width: 80, height: 40 })

  await FocusPointer.createPointers(
    [{ topLevelFrame: frame, instance: target }] as any,
    createFocus({
      assetSource: 'custom',
      customAssetId: 'missing'
    })
  )

  const pointer = frame.children[1]
  assertApprox(pointer.x, 120.21)
  assertApprox(pointer.y, 95.2)
})

test('removes old managed pointers before creating new pointers', async () => {
  setFigmaForPointer()
  const frame = createFrame('Frame', { x: 0, y: 0, width: 200, height: 200 })
  const target = createLayer('Target', frame, { x: 20, y: 20, width: 40, height: 40 })
  const oldPointer = createRectangle()
  oldPointer.setPluginData('prototyper_focus_pointer', 'true')
  frame.appendChild(oldPointer)

  await FocusPointer.createPointers(
    [{ topLevelFrame: frame, instance: target }] as any,
    createFocus()
  )

  assert.equal(oldPointer.removed, true)
  assert.equal(frame.children.length, 2)
  assert.equal(frame.children[1].getPluginData('prototyper_focus_pointer'), 'true')
})

test('removes old managed pointers when pointer mode is disabled', async () => {
  setFigmaForPointer()
  const frame = createFrame('Frame', { x: 0, y: 0, width: 200, height: 200 })
  const target = createLayer('Target', frame, { x: 20, y: 20, width: 40, height: 40 })
  const oldPointer = createRectangle()
  oldPointer.setPluginData('prototyper_focus_pointer', 'true')
  frame.appendChild(oldPointer)

  const count = await FocusPointer.createPointers(
    [{ topLevelFrame: frame, instance: target }] as any,
    {
      ...createFocus(),
      mode: NavigationFocusMode.STROKE
    }
  )

  assert.equal(count, 0)
  assert.equal(oldPointer.removed, true)
  assert.deepEqual(frame.children, [target])
})
