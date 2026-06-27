import assert from 'node:assert/strict'
import test from 'node:test'
import { FocusOverlay } from '../src/focus_overlay'
import { NavigationFocusMode } from '../src/navigation_focus'

function setFigmaForOverlay() {
  ;(globalThis as any).figma = {
    createRectangle: () => createRectangle()
  }
}

function createRectangle() {
  return {
    id: 'overlay',
    name: '',
    type: 'RECTANGLE',
    parent: undefined,
    children: undefined,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    fills: undefined,
    strokes: undefined,
    effects: undefined,
    strokeWeight: undefined,
    strokeAlign: undefined,
    cornerRadius: undefined,
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
      let index = this.parent.children.indexOf(this)
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
    },
    insertChild(index: number, child) {
      child.parent = this
      this.children.splice(index, 0, child)
    }
  } as any
}

function createLayer(id: string, parent: any, bounds: Rect) {
  let layer = {
    id: id,
    name: id,
    type: 'RECTANGLE',
    parent: parent,
    absoluteBoundingBox: bounds
  } as any
  parent.children.push(layer)
  return layer
}

function createNestedFrame(id: string, parent: any, bounds: Rect) {
  let frame = createFrame(id, bounds)
  frame.parent = parent
  parent.children.push(frame)
  return frame
}

function createFocus(mode: NavigationFocusMode) {
  return {
    mode: mode,
    variant: { property: '', from: '', to: '' },
    stroke: {
      color: '#FF00AA',
      weight: 6,
      padding: 5,
      cornerRadius: 3
    },
    shadow: {
      color: '#00AAFF',
      blur: 16,
      spread: 2,
      padding: 7,
      cornerRadius: 4
    }
  }
}

test('creates stroke overlay from target bounds relative to top-level frame', () => {
  setFigmaForOverlay()
  let frame = createFrame('Frame', { x: 100, y: 200, width: 500, height: 400 })
  let target = createLayer('Target', frame, { x: 150, y: 260, width: 80, height: 40 })

  let overlay = FocusOverlay.create(frame, target, createFocus(NavigationFocusMode.STROKE) as any) as any

  assert.equal(frame.children.includes(overlay), true)
  assert.equal(overlay.name, '__Prototyper Focus Overlay')
  assert.equal(overlay.getPluginData('prototyper_focus_overlay'), 'true')
  assert.equal(overlay.layoutPositioning, 'AUTO')
  assert.equal(overlay.x, 45)
  assert.equal(overlay.y, 55)
  assert.equal(overlay.width, 90)
  assert.equal(overlay.height, 50)
  assert.deepEqual(overlay.fills, [])
  assert.equal(overlay.strokes[0].color.r, 1)
  assert.equal(overlay.strokes[0].color.g, 0)
  assert.equal(overlay.strokes[0].color.b, 170 / 255)
  assert.equal(overlay.strokeWeight, 6)
  assert.equal(overlay.strokeAlign, 'OUTSIDE')
  assert.equal(overlay.cornerRadius, 3)
})

test('uses absolute positioning only inside auto-layout frames', () => {
  setFigmaForOverlay()
  let frame = createFrame('Frame', { x: 100, y: 200, width: 500, height: 400 })
  frame.layoutMode = 'VERTICAL'
  let target = createLayer('Target', frame, { x: 150, y: 260, width: 80, height: 40 })

  let overlay = FocusOverlay.create(frame, target, createFocus(NavigationFocusMode.STROKE) as any) as any

  assert.equal(overlay.layoutPositioning, 'ABSOLUTE')
})

test('creates shadow overlay with configured glow effect', () => {
  setFigmaForOverlay()
  let frame = createFrame('Frame', { x: 10, y: 20, width: 300, height: 200 })
  let target = createLayer('Target', frame, { x: 30, y: 50, width: 40, height: 60 })

  let overlay = FocusOverlay.create(frame, target, createFocus(NavigationFocusMode.SHADOW) as any) as any

  assert.equal(overlay.x, 13)
  assert.equal(overlay.y, 23)
  assert.equal(overlay.width, 54)
  assert.equal(overlay.height, 74)
  assert.deepEqual(overlay.strokes, [])
  assert.equal(overlay.fills[0].opacity, 0.01)
  assert.equal(overlay.effects[0].type, 'DROP_SHADOW')
  assert.equal(overlay.effects[0].radius, 16)
  assert.equal(overlay.effects[0].spread, 2)
  assert.equal(overlay.effects[0].color.r, 0)
  assert.equal(overlay.effects[0].color.g, 170 / 255)
  assert.equal(overlay.effects[0].color.b, 1)
  assert.equal(overlay.cornerRadius, 4)
})

test('creates shadow overlay below a direct target layer', () => {
  setFigmaForOverlay()
  let frame = createFrame('Frame', { x: 0, y: 0, width: 300, height: 200 })
  let target = createLayer('Target', frame, { x: 30, y: 50, width: 40, height: 60 })

  let overlay = FocusOverlay.create(frame, target, createFocus(NavigationFocusMode.SHADOW) as any) as any

  assert.deepEqual(frame.children, [overlay, target])
})

test('creates shadow overlay below the top-level ancestor for nested target layers', () => {
  setFigmaForOverlay()
  let frame = createFrame('Frame', { x: 0, y: 0, width: 300, height: 200 })
  let background = createLayer('Background', frame, { x: 0, y: 0, width: 300, height: 200 })
  let container = createNestedFrame('Container', frame, { x: 20, y: 20, width: 100, height: 100 })
  let target = createLayer('Target', container, { x: 30, y: 50, width: 40, height: 60 })

  let overlay = FocusOverlay.create(frame, target, createFocus(NavigationFocusMode.SHADOW) as any) as any

  assert.deepEqual(frame.children, [background, overlay, container])
})

test('removes only plugin-managed overlays', () => {
  let frame = createFrame('Frame', { x: 0, y: 0, width: 300, height: 200 })
  let unrelated = createLayer('Unrelated', frame, { x: 10, y: 10, width: 20, height: 20 })
  let managed = createRectangle()
  managed.setPluginData('prototyper_focus_overlay', 'true')
  frame.appendChild(managed)

  FocusOverlay.removeManagedOverlays(frame)

  assert.equal(frame.children.includes(unrelated), true)
  assert.equal(frame.children.includes(managed), false)
  assert.equal(managed.removed, true)
})
