import assert from 'node:assert/strict'
import test from 'node:test'

function setFigmaForUtilities(selection: any[] = []) {
  (globalThis as any).figma = {
    ui: {},
    currentPage: {
      selection: selection
    }
  }
}

function withMutedConsole<T>(method: 'error', callback: () => T): T {
  let original = console[method]
  console[method] = (() => undefined) as any
  try {
    return callback()
  } finally {
    console[method] = original
  }
}

async function loadGenerateValidation() {
  setFigmaForUtilities()
  return import('../src/core/generate_prototype')
}

async function loadLinkValidation() {
  setFigmaForUtilities()
  return import('../src/core/link_frames')
}

function createInstance(options: {
  name?: string,
  parent?: any,
  componentProperties?: Record<string, { type: string }>,
  definitions?: Record<string, { type: string, variantOptions?: string[] }>
} = {}) {
  let componentProperties = options.componentProperties ?? {
    'State#1': { type: 'VARIANT' }
  }
  let definitions = options.definitions ?? {
    'State#1': { type: 'VARIANT', variantOptions: ['Default', 'Focus'] }
  }

  return {
    id: options.name ?? 'Button',
    name: options.name ?? 'Button',
    type: 'INSTANCE',
    parent: options.parent,
    componentProperties: componentProperties,
    getMainComponentAsync: async () => ({
      parent: {
        type: 'COMPONENT_SET',
        componentPropertyDefinitions: definitions
      }
    })
  } as any
}

function createTopLevelFrame(id: string, parent = { type: 'PAGE' }) {
  return {
    id: id,
    name: id,
    type: 'FRAME',
    parent: parent,
    children: []
  } as any
}

function createInstanceInFrame(name: string, frame: any) {
  let instance = createInstance({ name: name, parent: frame })
  frame.children.push(instance)
  return instance
}

function createLayerInFrame(name: string, frame: any) {
  let layer = {
    id: name,
    name: name,
    type: 'RECTANGLE',
    parent: frame
  } as any
  frame.children.push(layer)
  return layer
}

function createStrokeFocus() {
  return {
    mode: 'stroke',
    variant: { property: '', from: '', to: '' },
    stroke: { color: '#0C8CE9', weight: 4, padding: 4, cornerRadius: 8 },
    shadow: { color: '#0C8CE9', blur: 24, spread: 0, padding: 4, cornerRadius: 8 }
  } as any
}

test('rejects selections with fewer than two generated instances', async () => {
  let { validateInstancesLength } = await loadGenerateValidation()
  let selection = [createInstance()]
  setFigmaForUtilities(selection)

  withMutedConsole('error', () => {
    assert.throws(
      () => validateInstancesLength(selection),
      /Please select 2 or more component instances/
    )
  })
})

test('requires generated instances to share one top-level frame', async () => {
  let { validateInstancesInSameTopLevelFrame } = await loadGenerateValidation()
  let firstFrame = createTopLevelFrame('Frame 1')
  let secondFrame = createTopLevelFrame('Frame 2')
  let firstInstance = createInstanceInFrame('First', firstFrame)
  let secondInstance = createInstanceInFrame('Second', secondFrame)
  setFigmaForUtilities([firstInstance, secondInstance])

  withMutedConsole('error', () => {
    assert.throws(
      () => validateInstancesInSameTopLevelFrame([firstInstance, secondInstance]),
      /Please select component instances from one top-level frame/
    )
  })
})

test('accepts generated instances in one top-level frame', async () => {
  let { validateInstancesInSameTopLevelFrame } = await loadGenerateValidation()
  let frame = createTopLevelFrame('Frame')
  let firstInstance = createInstanceInFrame('First', frame)
  let secondInstance = createInstanceInFrame('Second', frame)
  setFigmaForUtilities([firstInstance, secondInstance])

  assert.doesNotThrow(
    () => validateInstancesInSameTopLevelFrame([firstInstance, secondInstance])
  )
})

test('overlay focus accepts non-instance layers in one top-level frame', async () => {
  let {
    filterFocusTargetsFromSelection,
    validateFocusTargetsAreNotTopLevelFrames,
    validateFocusTargetsLength,
    validateFocusTargetsInSameTopLevelFrame
  } = await loadGenerateValidation()
  let frame = createTopLevelFrame('Frame')
  let firstLayer = createLayerInFrame('First', frame)
  let secondLayer = createLayerInFrame('Second', frame)

  let focusTargets = filterFocusTargetsFromSelection([firstLayer, secondLayer], createStrokeFocus())

  assert.deepEqual(focusTargets, [firstLayer, secondLayer])
  assert.doesNotThrow(() => validateFocusTargetsAreNotTopLevelFrames(focusTargets))
  assert.doesNotThrow(() => validateFocusTargetsLength(focusTargets))
  assert.doesNotThrow(() => validateFocusTargetsInSameTopLevelFrame(focusTargets))
})

test('overlay focus uses children of a single selected nested parent', async () => {
  let { filterFocusTargetsFromSelection } = await loadGenerateValidation()
  let frame = createTopLevelFrame('Frame')
  let nestedFrame = {
    id: 'Nested',
    name: 'Nested',
    type: 'FRAME',
    parent: frame,
    children: []
  } as any
  frame.children.push(nestedFrame)
  let firstLayer = createLayerInFrame('First', nestedFrame)
  let secondLayer = createLayerInFrame('Second', nestedFrame)

  let focusTargets = filterFocusTargetsFromSelection([nestedFrame], createStrokeFocus())

  assert.deepEqual(focusTargets, [firstLayer, secondLayer])
})

test('overlay focus rejects selected top-level frames', async () => {
  let { filterFocusTargetsFromSelection, validateFocusTargetsAreNotTopLevelFrames } = await loadGenerateValidation()
  let frame = createTopLevelFrame('Frame')
  setFigmaForUtilities([frame])

  let focusTargets = filterFocusTargetsFromSelection([frame], createStrokeFocus())

  withMutedConsole('error', () => {
    assert.throws(
      () => validateFocusTargetsAreNotTopLevelFrames(focusTargets),
      /Please select layers inside one top-level frame/
    )
  })
})

test('overlay focus rejects layers from multiple top-level frames', async () => {
  let { validateFocusTargetsInSameTopLevelFrame } = await loadGenerateValidation()
  let firstFrame = createTopLevelFrame('Frame 1')
  let secondFrame = createTopLevelFrame('Frame 2')
  let firstLayer = createLayerInFrame('First', firstFrame)
  let secondLayer = createLayerInFrame('Second', secondFrame)
  setFigmaForUtilities([firstLayer, secondLayer])

  withMutedConsole('error', () => {
    assert.throws(
      () => validateFocusTargetsInSameTopLevelFrame([firstLayer, secondLayer]),
      /Please select layers inside one top-level frame/
    )
  })
})

test('accepts variant properties that can receive the configured values', async () => {
  let { validateInstanceProperties } = await loadGenerateValidation()

  await assert.doesNotReject(() => validateInstanceProperties(
    [createInstance()],
    { property: 'State', from: 'Default', to: 'Focus' }
  ))
})

test('rejects missing, duplicate, unsupported, and invalid variant properties', async () => {
  let { validateInstanceProperties } = await loadGenerateValidation()

  await assert.rejects(
    () => validateInstanceProperties(
      [createInstance({ componentProperties: {} })],
      { property: 'State', from: '', to: 'Focus' }
    ),
    /Cannot find component property "State"/
  )

  await assert.rejects(
    () => validateInstanceProperties(
      [createInstance({
        componentProperties: {
          'State#1': { type: 'VARIANT' },
          'State#2': { type: 'VARIANT' }
        }
      })],
      { property: 'State', from: '', to: 'Focus' }
    ),
    /Found 2 component properties/
  )

  await assert.rejects(
    () => validateInstanceProperties(
      [createInstance({
        componentProperties: {
          'Target#1': { type: 'INSTANCE_SWAP' }
        },
        definitions: {
          'Target#1': { type: 'INSTANCE_SWAP' }
        }
      })],
      { property: 'Target', from: '', to: 'Focus' }
    ),
    /Cannot set focus on an INSTANCE_SWAP property/
  )

  await assert.rejects(
    () => validateInstanceProperties(
      [createInstance({
        definitions: {
          'State#1': { type: 'VARIANT', variantOptions: ['Default'] }
        }
      })],
      { property: 'State', from: '', to: 'Focus' }
    ),
    /Cannot find value "Focus"/
  )
})

test('validates link selections as top-level frames', async () => {
  let { validateSelectionLength, validateTopLevelFrames } = await loadLinkValidation()

  assert.throws(
    () => validateSelectionLength([{ type: 'FRAME' } as any]),
    /Please select 2 or more top-level frames/
  )

  assert.doesNotThrow(() => validateTopLevelFrames([
    { name: 'Screen A', type: 'FRAME', parent: { type: 'PAGE' } },
    { name: 'Screen B', type: 'FRAME', parent: { type: 'SECTION' } }
  ] as any))

  assert.throws(
    () => validateTopLevelFrames([
      { name: 'Nested Screen', type: 'FRAME', parent: { type: 'FRAME' } }
    ] as any),
    /Layer "Nested Screen" is not a top-level frame/
  )
})
