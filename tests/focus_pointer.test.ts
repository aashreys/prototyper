import assert from 'node:assert/strict'
import test from 'node:test'
import { FocusPointer } from '../src/focus_pointer'
import { NavigationFocusMode } from '../src/navigation_focus'

function setFigmaForPointer() {
  ;(globalThis as any).figma = {
    createImage: (bytes: Uint8Array) => ({
      hash: `hash-${bytes.byteLength}`
    }),
    createRectangle: () => createRectangle()
  }
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
    mode: NavigationFocusMode.STROKE,
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
      sizeMode: '96',
      customSize: 96,
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
  assert.equal(pointerA.width, 96)
  assert.equal(pointerA.height, 96)
  assert.equal(pointerA.x, 82)
  assert.equal(pointerA.y, 52)
  assert.equal(pointerA.fills[0].type, 'IMAGE')
  assert.equal(pointerA.fills[0].scaleMode, 'FIT')
  assert.equal(pointerA.getPluginData('prototyper_focus_pointer'), 'true')
  assert.equal(pointerB.x, 82)
  assert.equal(pointerB.y, 72)
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
  assert.equal(pointer.x, 50)
  assert.equal(pointer.y, 70)
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

test('removes old managed pointers when pointer is disabled', async () => {
  setFigmaForPointer()
  const frame = createFrame('Frame', { x: 0, y: 0, width: 200, height: 200 })
  const target = createLayer('Target', frame, { x: 20, y: 20, width: 40, height: 40 })
  const oldPointer = createRectangle()
  oldPointer.setPluginData('prototyper_focus_pointer', 'true')
  frame.appendChild(oldPointer)

  const count = await FocusPointer.createPointers(
    [{ topLevelFrame: frame, instance: target }] as any,
    createFocus({ enabled: false })
  )

  assert.equal(count, 0)
  assert.equal(oldPointer.removed, true)
  assert.deepEqual(frame.children, [target])
})
