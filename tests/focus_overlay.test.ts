import assert from 'node:assert/strict'
import test from 'node:test'
import { FocusOverlay } from '../src/focus_overlay'
import { NavigationFocusMode } from '../src/navigation_focus'

function setFigmaForOverlay() {
  ;(globalThis as any).figma = {
    mixed: Symbol.for('figma.mixed'),
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
    topLeftRadius: undefined,
    topRightRadius: undefined,
    bottomLeftRadius: undefined,
    bottomRightRadius: undefined,
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

function createLayer(id: string, parent: any, bounds: Rect, properties = {}) {
  let layer = {
    id: id,
    name: id,
    type: 'RECTANGLE',
    parent: parent,
    x: bounds.x - (parent?.absoluteBoundingBox?.x || 0),
    y: bounds.y - (parent?.absoluteBoundingBox?.y || 0),
    width: bounds.width,
    height: bounds.height,
    absoluteBoundingBox: bounds,
    effects: [],
    fills: [],
    fillStyleId: '',
    strokes: [],
    strokeStyleId: '',
    strokeWeight: 0,
    strokeAlign: 'CENTER',
    pluginData: {},
    ...properties,
    rescale(scale: number) {
      this.width = this.width * scale
      this.height = this.height * scale
      this.absoluteBoundingBox = {
        ...this.absoluteBoundingBox,
        width: this.absoluteBoundingBox.width * scale,
        height: this.absoluteBoundingBox.height * scale
      }
    },
    setPluginData(key: string, value: string) {
      this.pluginData[key] = value
    },
    getPluginData(key: string) {
      return this.pluginData[key] || ''
    },
    remove() {
      if (!this.parent) return
      let index = this.parent.children.indexOf(this)
      if (index >= 0) this.parent.children.splice(index, 1)
    },
    clone() {
      return createLayerNode(`${this.id}-clone`, bounds, properties)
    }
  } as any
  parent.children.push(layer)
  return layer
}

function createLayerNode(id: string, bounds: Rect, properties = {}) {
  return {
    id: id,
    name: id,
    type: 'RECTANGLE',
    parent: undefined,
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    absoluteBoundingBox: { ...bounds },
    effects: [],
    fills: [],
    fillStyleId: '',
    strokes: [],
    strokeStyleId: '',
    strokeWeight: 0,
    strokeAlign: 'CENTER',
    pluginData: {},
    ...properties,
    rescale(scale: number) {
      this.width = this.width * scale
      this.height = this.height * scale
      this.absoluteBoundingBox = {
        ...this.absoluteBoundingBox,
        width: this.absoluteBoundingBox.width * scale,
        height: this.absoluteBoundingBox.height * scale
      }
    },
    setPluginData(key: string, value: string) {
      this.pluginData[key] = value
    },
    getPluginData(key: string) {
      return this.pluginData[key] || ''
    },
    remove() {
      if (!this.parent) return
      let index = this.parent.children.indexOf(this)
      if (index >= 0) this.parent.children.splice(index, 1)
    },
    clone() {
      return createLayerNode(`${this.id}-clone`, this.absoluteBoundingBox, properties)
    }
  } as any
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
      align: 'OUTSIDE'
    },
    fill: {
      color: '#00AAFF',
      opacity: 35
    },
    shadow: {
      color: '#00AAFF',
      blur: 16,
      spread: 2,
      padding: 7,
      cornerRadius: 4
    },
    scaleShadow: {
      scale: 1.08,
      showShadow: true,
      padding: 6,
      useAutoCornerRadius: true,
      cornerRadius: 12
    }
  }
}

test('applies stroke focus directly to the target layer', () => {
  setFigmaForOverlay()
  let frame = createFrame('Frame', { x: 100, y: 200, width: 500, height: 400 })
  let target = createLayer('Target', frame, { x: 150, y: 260, width: 80, height: 40 })

  let result = FocusOverlay.create(frame, target, createFocus(NavigationFocusMode.STROKE) as any) as any

  assert.equal(result, target)
  assert.deepEqual(frame.children, [target])
  assert.equal(target.strokes[0].color.r, 1)
  assert.equal(target.strokes[0].color.g, 0)
  assert.equal(target.strokes[0].color.b, 170 / 255)
  assert.equal(target.strokeWeight, 6)
  assert.equal(target.strokeAlign, 'OUTSIDE')
})

test('applies fill focus above existing fills', () => {
  setFigmaForOverlay()
  let frame = createFrame('Frame', { x: 100, y: 200, width: 500, height: 400 })
  let originalFill = { type: 'SOLID', color: { r: 1, g: 0, b: 0 }, opacity: 1 }
  let target = createLayer('Target', frame, { x: 150, y: 260, width: 80, height: 40 }, {
    fills: [originalFill]
  })

  let result = FocusOverlay.create(frame, target, createFocus(NavigationFocusMode.FILL) as any) as any

  assert.equal(result, target)
  assert.deepEqual(frame.children, [target])
  assert.equal(target.fills.length, 2)
  assert.deepEqual(target.fills[0], originalFill)
  assert.equal(target.fills[1].color.r, 0)
  assert.equal(target.fills[1].color.g, 170 / 255)
  assert.equal(target.fills[1].color.b, 1)
  assert.equal(target.fills[1].opacity, 0.35)
})

test('applies shadow focus directly to the target layer', () => {
  setFigmaForOverlay()
  let frame = createFrame('Frame', { x: 10, y: 20, width: 300, height: 200 })
  let target = createLayer('Target', frame, { x: 30, y: 50, width: 40, height: 60 })

  let result = FocusOverlay.create(frame, target, createFocus(NavigationFocusMode.SHADOW) as any) as any

  assert.equal(result, target)
  assert.deepEqual(frame.children, [target])
  assert.equal(target.effects[0].type, 'DROP_SHADOW')
  assert.equal(target.effects[0].radius, 16)
  assert.equal(target.effects[0].spread, 2)
  assert.equal(target.effects[0].offset.y, 0)
  assert.equal(target.effects[0].color.r, 0)
  assert.equal(target.effects[0].color.g, 170 / 255)
  assert.equal(target.effects[0].color.b, 1)
})

test('applies Scale up directly with Apple TV shadows when enabled', () => {
  setFigmaForOverlay()
  let frame = createFrame('Frame', { x: 0, y: 0, width: 300, height: 200 })
  let target = createLayer('Target', frame, { x: 30, y: 50, width: 100, height: 50 }, { cornerRadius: 10 })

  let result = FocusOverlay.create(frame, target, createFocus(NavigationFocusMode.SCALE_SHADOW) as any) as any

  assert.equal(result, target)
  assert.deepEqual(frame.children, [target])
  assert.equal(target.x, 26)
  assert.equal(target.y, 48)
  assert.equal(target.width, 108)
  assert.equal(target.height, 54)
  assert.equal(target.effects.length, 3)
  assert.equal(target.effects[0].type, 'DROP_SHADOW')
  assert.equal(target.effects[0].radius, 10)
  assert.equal(target.effects[0].offset.y, 4)
  assert.equal(target.effects[0].color.a, 0.24)
  assert.equal(target.effects[1].radius, 24)
  assert.equal(target.effects[1].offset.y, 14)
  assert.equal(target.effects[1].color.a, 0.22)
  assert.equal(target.effects[2].radius, 48)
  assert.equal(target.effects[2].offset.y, 30)
  assert.equal(target.effects[2].color.a, 0.16)
})

test('applies Scale up without shadows when disabled', () => {
  setFigmaForOverlay()
  let frame = createFrame('Frame', { x: 0, y: 0, width: 300, height: 200 })
  let target = createLayer('Target', frame, { x: 30, y: 50, width: 100, height: 50 }, { cornerRadius: 10 })
  let focus = createFocus(NavigationFocusMode.SCALE_SHADOW)
  focus.scaleShadow.showShadow = false

  FocusOverlay.create(frame, target, focus as any)

  assert.equal(target.x, 26)
  assert.equal(target.y, 48)
  assert.equal(target.width, 108)
  assert.equal(target.height, 54)
  assert.equal(target.effects.length, 0)
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

test('restores managed direct focus state', () => {
  setFigmaForOverlay()
  let frame = createFrame('Frame', { x: 0, y: 0, width: 300, height: 200 })
  let originalEffect = {
    type: 'DROP_SHADOW',
    color: { r: 1, g: 0, b: 0, a: 0.5 },
    offset: { x: 1, y: 2 },
    radius: 3,
    spread: 4,
    visible: true,
    blendMode: 'NORMAL',
    showShadowBehindNode: true
  }
  let target = createLayer('Target', frame, { x: 30, y: 50, width: 100, height: 50 }, { effects: [originalEffect] })

  FocusOverlay.create(frame, target, createFocus(NavigationFocusMode.SCALE_SHADOW) as any)
  FocusOverlay.resetManagedFocus(frame)

  assert.equal(target.x, 30)
  assert.equal(target.y, 50)
  assert.equal(target.width, 100)
  assert.equal(target.height, 50)
  assert.deepEqual(target.effects, [originalEffect])
  assert.equal(target.getPluginData('prototyper_focus_direct_state'), '')
})

test('restores direct fill focus state', () => {
  setFigmaForOverlay()
  let frame = createFrame('Frame', { x: 0, y: 0, width: 300, height: 200 })
  let originalFill = { type: 'SOLID', color: { r: 0, g: 1, b: 0 }, opacity: 0.5 }
  let target = createLayer('Target', frame, { x: 30, y: 50, width: 100, height: 50 }, {
    fills: [originalFill]
  })

  FocusOverlay.create(frame, target, createFocus(NavigationFocusMode.FILL) as any)
  FocusOverlay.resetManagedFocus(frame)

  assert.deepEqual(target.fills, [originalFill])
  assert.equal(target.getPluginData('prototyper_focus_direct_state'), '')
})

test('restores direct stroke focus state', () => {
  setFigmaForOverlay()
  let frame = createFrame('Frame', { x: 0, y: 0, width: 300, height: 200 })
  let originalStroke = { type: 'SOLID', color: { r: 0, g: 1, b: 0 }, opacity: 1 }
  let target = createLayer('Target', frame, { x: 30, y: 50, width: 100, height: 50 }, {
    strokes: [originalStroke],
    strokeWeight: 2,
    strokeAlign: 'CENTER'
  })

  FocusOverlay.create(frame, target, createFocus(NavigationFocusMode.STROKE) as any)
  FocusOverlay.resetManagedFocus(frame)

  assert.deepEqual(target.strokes, [originalStroke])
  assert.equal(target.strokeWeight, 2)
  assert.equal(target.strokeAlign, 'CENTER')
})
