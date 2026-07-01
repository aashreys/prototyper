import assert from 'node:assert/strict'
import test from 'node:test'
import { Config } from '../src/config'
import { Device } from '../src/device'
import { normalizeErrorMessage } from '../src/errors'
import { NavScheme, NavigationKeycodes } from '../src/navigation'
import { NavigationFocusMode } from '../src/navigation_focus'
import { Stats } from '../src/stats'

function setFigma(figma: unknown) {
  (globalThis as any).figma = figma
}

function emptyStats() {
  return {
    secondsSaved: 0,
    prototypesCreated: 0,
    framesDuped: 0,
    statesChanged: 0,
    interactionsCreated: 0
  }
}

function withMutedConsole<T>(method: 'error' | 'log', callback: () => T): T {
  let original = console[method]
  console[method] = (() => undefined) as any
  try {
    let result = callback()
    if (result && typeof (result as any).finally === 'function') {
      return (result as Promise<unknown>).finally(() => {
        console[method] = original
      }) as T
    }
    console[method] = original
    return result
  } catch (error) {
    console[method] = original
    throw error
  }
}

function createRoot(data: Map<string, string>) {
  return {
    getPluginData: (key: string) => data.get(key) ?? '',
    setPluginData: (key: string, value: string) => {
      data.set(key, value)
    }
  }
}

test('defaults new configs to stroke focus', () => {
  let config = Config.getDefaultConfig()

  assert.equal(config.focus.mode, NavigationFocusMode.STROKE)
  assert.equal(config.focus.stroke.align, 'OUTSIDE')
  assert.equal(config.focus.stroke.opacity, 100)
  assert.equal(config.focus.stroke.weight, 6)
  assert.equal(config.focus.stroke.gap, 4)
  assert.equal(config.focus.stroke.addGlow, true)
  assert.equal(config.focus.fill.color, '#FFFFFF')
  assert.equal(config.focus.fill.opacity, 50)
  assert.equal(config.focus.scaleShadow.scale, 1.2)
  assert.equal(config.focus.scaleShadow.showShadow, true)
  assert.deepEqual(config.focus.pointer, {
    enabled: false,
    assetSource: 'preset',
    presetId: 'arrow',
    sizeMode: '96',
    customSize: 96,
    positionPreset: 'bottom-right',
    position: {
      x: 1,
      y: 1
    }
  })
  assert.deepEqual(config.swapVariant, {
    property: '',
    from: '',
    to: ''
  })
  assert.deepEqual(config.focus.components, [])
})

test('migrates stale config by merging saved settings with defaults', () => {
  let savedConfig = {
    activeNavigation: {
      device: Device.KEYBOARD,
      scheme: NavScheme.TAB,
      customKeycodes: new NavigationKeycodes([1], [2], [], [])
    },
    swapVariant: {
      property: 'State',
      from: 'Default',
      to: 'Focus'
    }
  }
  let data = new Map<string, string>([
    [Config.CONFIG_VERSION_KEY, JSON.stringify(1)],
    [Config.CONFIG_KEY, JSON.stringify(savedConfig)]
  ])
  setFigma({ root: createRoot(data) })

  withMutedConsole('log', () => Config.migrateConfig())

  assert.equal(JSON.parse(data.get(Config.CONFIG_VERSION_KEY) as string), Config.CONFIG_VERSION)
  let migratedConfig = JSON.parse(data.get(Config.CONFIG_KEY) as string)
  assert.equal(migratedConfig.activeNavigation.device, Device.KEYBOARD)
  assert.equal(migratedConfig.activeNavigation.scheme, NavScheme.TAB)
  assert.equal(migratedConfig.swapVariant.property, 'State')
  assert.equal(migratedConfig.focus.mode, NavigationFocusMode.VARIANT)
  assert.deepEqual(migratedConfig.focus.variant, {
    property: 'State',
    from: 'Default',
    to: 'Focus'
  })
  assert.deepEqual(migratedConfig.focus.components, [
    {
      type: 'variant',
      property: 'State',
      from: 'Default',
      to: 'Focus'
    }
  ])
  assert.equal(migratedConfig.focus.pointer.enabled, false)
  assert.equal(migratedConfig.focus.pointer.presetId, 'arrow')
  assert.deepEqual(migratedConfig.focus.pointer.position, { x: 1, y: 1 })
  assert.equal(migratedConfig.storedNavigation.keyboard.device, Device.KEYBOARD)
  assert.equal(migratedConfig.storedNavigation.controller.device, Device.PS4)
})

test('migrates stale config without legacy variant settings to stroke focus', () => {
  let savedConfig = {
    activeNavigation: {
      device: Device.KEYBOARD,
      scheme: NavScheme.TAB,
      customKeycodes: new NavigationKeycodes([1], [2], [], [])
    }
  }
  let data = new Map<string, string>([
    [Config.CONFIG_VERSION_KEY, JSON.stringify(1)],
    [Config.CONFIG_KEY, JSON.stringify(savedConfig)]
  ])
  setFigma({ root: createRoot(data) })

  withMutedConsole('log', () => Config.migrateConfig())

  let migratedConfig = JSON.parse(data.get(Config.CONFIG_KEY) as string)
  assert.equal(migratedConfig.focus.mode, NavigationFocusMode.STROKE)
  assert.deepEqual(migratedConfig.swapVariant, {
    property: '',
    from: '',
    to: ''
  })
  assert.deepEqual(migratedConfig.focus.components, [])
})

test('normalizes saved shadow focus mode to stroke focus', () => {
  let savedConfig = {
    ...Config.getDefaultConfig(),
    focus: {
      ...Config.getDefaultConfig().focus,
      mode: NavigationFocusMode.SHADOW
    }
  }
  let data = new Map<string, string>([
    [Config.CONFIG_KEY, JSON.stringify(savedConfig)]
  ])
  setFigma({ root: createRoot(data) })

  let config = Config.getSavedConfig()

  assert.equal(config.focus.mode, NavigationFocusMode.STROKE)
})

test('normalizes saved swapVariant into focus variant for transition compatibility', () => {
  let savedConfig: any = {
    ...Config.getDefaultConfig(),
    swapVariant: {
      property: 'State',
      from: 'Rest',
      to: 'Focused'
    }
  }
  delete savedConfig.focus.components
  let data = new Map<string, string>([
    [Config.CONFIG_KEY, JSON.stringify(savedConfig)]
  ])
  setFigma({ root: createRoot(data) })

  let config = Config.getSavedConfig()

  assert.deepEqual(config.swapVariant, {
    property: 'State',
    from: 'Rest',
    to: 'Focused'
  })
  assert.deepEqual(config.focus.variant, config.swapVariant)
  assert.deepEqual(config.focus.components, [
    {
      type: 'variant',
      property: 'State',
      from: 'Rest',
      to: 'Focused'
    }
  ])
})

test('uses saved component focus mappings as source of truth', () => {
  let savedConfig = {
    ...Config.getDefaultConfig(),
    focus: {
      ...Config.getDefaultConfig().focus,
      mode: 'unknown',
      variant: {
        property: 'Stale',
        from: 'Off',
        to: 'On'
      },
      components: [
        {
          type: 'variant',
          property: 'State',
          from: 'Rest',
          to: 'Focused'
        },
        {
          type: 'boolean',
          property: 'Selected',
          from: 'ignored',
          to: 'ignored'
        }
      ]
    },
    swapVariant: {
      property: 'Stale',
      from: 'Off',
      to: 'On'
    }
  }
  let data = new Map<string, string>([
    [Config.CONFIG_KEY, JSON.stringify(savedConfig)]
  ])
  setFigma({ root: createRoot(data) })

  let config = Config.getSavedConfig()

  assert.equal(config.focus.mode, NavigationFocusMode.VARIANT)
  assert.deepEqual(config.focus.components, [
    {
      type: 'variant',
      property: 'State',
      from: 'Rest',
      to: 'Focused'
    },
    {
      type: 'boolean',
      property: 'Selected',
      from: 'false',
      to: 'true'
    }
  ])
  assert.deepEqual(config.focus.variant, {
    property: 'State',
    from: 'Rest',
    to: 'Focused'
  })
  assert.deepEqual(config.swapVariant, config.focus.variant)
})

test('falls back from Components mode when saved mappings are not configured', () => {
  let savedConfig = {
    ...Config.getDefaultConfig(),
    focus: {
      ...Config.getDefaultConfig().focus,
      mode: 'unknown',
      variant: {
        property: 'Stale',
        from: 'Off',
        to: 'On'
      },
      components: [
        {
          type: 'variant',
          property: '',
          from: 'Rest',
          to: ''
        }
      ]
    },
    swapVariant: {
      property: 'Stale',
      from: 'Off',
      to: 'On'
    }
  }
  let data = new Map<string, string>([
    [Config.CONFIG_KEY, JSON.stringify(savedConfig)]
  ])
  setFigma({ root: createRoot(data) })

  let config = Config.getSavedConfig()

  assert.equal(config.focus.mode, NavigationFocusMode.STROKE)
  assert.deepEqual(config.focus.variant, {
    property: '',
    from: 'Rest',
    to: ''
  })
  assert.deepEqual(config.swapVariant, config.focus.variant)
})

test('preserves saved stroke align setting', () => {
  let savedConfig = {
    ...Config.getDefaultConfig(),
    focus: {
      ...Config.getDefaultConfig().focus,
      stroke: {
        ...Config.getDefaultConfig().focus.stroke,
        align: 'INSIDE',
        opacity: 72,
        gap: 5,
        addGlow: false
      }
    }
  }
  let data = new Map<string, string>([
    [Config.CONFIG_KEY, JSON.stringify(savedConfig)]
  ])
  setFigma({ root: createRoot(data) })

  let config = Config.getSavedConfig()

  assert.equal(config.focus.stroke.align, 'INSIDE')
  assert.equal(config.focus.stroke.opacity, 72)
  assert.equal(config.focus.stroke.gap, 5)
  assert.equal(config.focus.stroke.addGlow, false)
})

test('preserves saved fill settings', () => {
  let savedConfig = {
    ...Config.getDefaultConfig(),
    focus: {
      ...Config.getDefaultConfig().focus,
      mode: NavigationFocusMode.FILL,
      fill: {
        color: '#FF00AA',
        opacity: 42
      }
    }
  }
  let data = new Map<string, string>([
    [Config.CONFIG_KEY, JSON.stringify(savedConfig)]
  ])
  setFigma({ root: createRoot(data) })

  let config = Config.getSavedConfig()

  assert.equal(config.focus.mode, NavigationFocusMode.FILL)
  assert.equal(config.focus.fill.color, '#FF00AA')
  assert.equal(config.focus.fill.opacity, 42)
})

test('preserves saved scale shadow settings', () => {
  let savedConfig = {
    ...Config.getDefaultConfig(),
    focus: {
      ...Config.getDefaultConfig().focus,
      mode: NavigationFocusMode.SCALE_SHADOW,
      scaleShadow: {
        ...Config.getDefaultConfig().focus.scaleShadow,
        scale: 1.12,
        showShadow: false
      }
    }
  }
  let data = new Map<string, string>([
    [Config.CONFIG_KEY, JSON.stringify(savedConfig)]
  ])
  setFigma({ root: createRoot(data) })

  let config = Config.getSavedConfig()

  assert.equal(config.focus.mode, NavigationFocusMode.SCALE_SHADOW)
  assert.equal(config.focus.scaleShadow.scale, 1.12)
  assert.equal(config.focus.scaleShadow.showShadow, false)
})

test('preserves and normalizes saved pointer settings', () => {
  let savedConfig = {
    ...Config.getDefaultConfig(),
    focus: {
      ...Config.getDefaultConfig().focus,
      pointer: {
        enabled: true,
        assetSource: 'custom',
        presetId: 'hand',
        sizeMode: 'custom',
        customSize: 1200,
        positionPreset: 'custom',
        position: {
          x: 2,
          y: -1
        }
      }
    }
  }
  let data = new Map<string, string>([
    [Config.CONFIG_KEY, JSON.stringify(savedConfig)]
  ])
  setFigma({ root: createRoot(data) })

  let config = Config.getSavedConfig()

  assert.equal(config.focus.pointer.enabled, true)
  assert.equal(config.focus.pointer.assetSource, 'custom')
  assert.equal(config.focus.pointer.presetId, 'arrow')
  assert.equal(config.focus.pointer.sizeMode, 'custom')
  assert.equal(config.focus.pointer.customSize, 1024)
  assert.equal(config.focus.pointer.positionPreset, 'custom')
  assert.deepEqual(config.focus.pointer.position, { x: 1, y: 1 })
})

test('preserves saved floating pointer mode', () => {
  let savedConfig = {
    ...Config.getDefaultConfig(),
    focus: {
      ...Config.getDefaultConfig().focus,
      mode: NavigationFocusMode.POINTER
    }
  }
  let data = new Map<string, string>([
    [Config.CONFIG_KEY, JSON.stringify(savedConfig)]
  ])
  setFigma({ root: createRoot(data) })

  let config = Config.getSavedConfig()

  assert.equal(config.focus.mode, NavigationFocusMode.POINTER)
})

test('migrates legacy scale shadow percent to multiplier scale', () => {
  let savedConfig = {
    ...Config.getDefaultConfig(),
    focus: {
      ...Config.getDefaultConfig().focus,
      mode: NavigationFocusMode.SCALE_SHADOW,
      scaleShadow: {
        ...Config.getDefaultConfig().focus.scaleShadow,
        scale: undefined,
        scalePercent: 116
      }
    }
  }
  let data = new Map<string, string>([
    [Config.CONFIG_KEY, JSON.stringify(savedConfig)]
  ])
  setFigma({ root: createRoot(data) })

  let config = Config.getSavedConfig()

  assert.equal(config.focus.scaleShadow.scale, 1.16)
})

test('preserves saved focus variant when compatibility swapVariant is empty', () => {
  let savedConfig: any = {
    ...Config.getDefaultConfig(),
    focus: {
      ...Config.getDefaultConfig().focus,
      mode: NavigationFocusMode.VARIANT,
      variant: {
        property: 'State',
        from: 'Rest',
        to: 'Focused'
      }
    },
    swapVariant: {
      property: '',
      from: '',
      to: ''
    }
  }
  delete savedConfig.focus.components
  let data = new Map<string, string>([
    [Config.CONFIG_KEY, JSON.stringify(savedConfig)]
  ])
  setFigma({ root: createRoot(data) })

  let config = Config.getSavedConfig()

  assert.equal(config.focus.mode, NavigationFocusMode.VARIANT)
  assert.deepEqual(config.focus.variant, {
    property: 'State',
    from: 'Rest',
    to: 'Focused'
  })
  assert.deepEqual(config.swapVariant, config.focus.variant)
  assert.deepEqual(config.focus.components, [
    {
      type: 'variant',
      property: 'State',
      from: 'Rest',
      to: 'Focused'
    }
  ])
})

test('keeps current config when the stored version matches', () => {
  let saved = { keep: true }
  let data = new Map<string, string>([
    [Config.CONFIG_VERSION_KEY, JSON.stringify(Config.CONFIG_VERSION)],
    [Config.CONFIG_KEY, JSON.stringify(saved)]
  ])
  setFigma({ root: createRoot(data) })

  Config.migrateConfig()

  assert.deepEqual(JSON.parse(data.get(Config.CONFIG_KEY) as string), saved)
})

test('falls back to empty stats when client storage is empty', async () => {
  setFigma({
    clientStorage: {
      getAsync: async () => undefined
    }
  })

  assert.deepEqual(await Stats.getStats(), emptyStats())
})

test('falls back to empty stats when client storage fails', async () => {
  setFigma({
    clientStorage: {
      getAsync: async () => {
        throw new Error('storage failed')
      }
    }
  })

  await withMutedConsole('error', async () => {
    assert.deepEqual(await Stats.getStats(), emptyStats())
  })
})

test('falls back to empty stats when client storage is unavailable', async () => {
  setFigma({})

  await withMutedConsole('error', async () => {
    assert.deepEqual(await Stats.getStats(), emptyStats())
  })
})

test('normalizes partial stats from client storage', async () => {
  setFigma({
    clientStorage: {
      getAsync: async () => ({ secondsSaved: 12, framesDuped: 'bad' })
    }
  })

  assert.deepEqual(await Stats.getStats(), {
    secondsSaved: 12,
    prototypesCreated: 0,
    framesDuped: 0,
    statesChanged: 0,
    interactionsCreated: 0
  })
})

test('returns new stats when client storage write fails', async () => {
  setFigma({
    clientStorage: {
      getAsync: async () => emptyStats()
    }
  })

  await withMutedConsole('error', async () => {
    let stats = await Stats.addStats(1, 0, 0, 0)
    assert.equal(stats.prototypesCreated, 1)
  })
})

test('normalizes thrown values into UI-safe error messages', () => {
  assert.equal(normalizeErrorMessage(new Error('bad selection')), 'bad selection')
  assert.equal(normalizeErrorMessage('plain failure'), 'plain failure')
  assert.equal(normalizeErrorMessage({ message: 'object failure' }), 'object failure')
  assert.equal(normalizeErrorMessage({ message: '' }), 'An unexpected error occurred.')
  assert.equal(normalizeErrorMessage(null), 'An unexpected error occurred.')
})
