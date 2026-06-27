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
  assert.equal(config.focus.stroke.useAutoCornerRadius, false)
  assert.equal(config.focus.scaleShadow.scalePercent, 108)
  assert.equal(config.focus.scaleShadow.opacity, 35)
  assert.deepEqual(config.swapVariant, {
    property: '',
    from: '',
    to: ''
  })
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
})

test('normalizes saved swapVariant into focus variant for transition compatibility', () => {
  let savedConfig = {
    ...Config.getDefaultConfig(),
    swapVariant: {
      property: 'State',
      from: 'Rest',
      to: 'Focused'
    }
  }
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
})

test('preserves saved auto stroke corner radius setting', () => {
  let savedConfig = {
    ...Config.getDefaultConfig(),
    focus: {
      ...Config.getDefaultConfig().focus,
      stroke: {
        ...Config.getDefaultConfig().focus.stroke,
        useAutoCornerRadius: true
      }
    }
  }
  let data = new Map<string, string>([
    [Config.CONFIG_KEY, JSON.stringify(savedConfig)]
  ])
  setFigma({ root: createRoot(data) })

  let config = Config.getSavedConfig()

  assert.equal(config.focus.stroke.useAutoCornerRadius, true)
})

test('preserves saved scale shadow settings', () => {
  let savedConfig = {
    ...Config.getDefaultConfig(),
    focus: {
      ...Config.getDefaultConfig().focus,
      mode: NavigationFocusMode.SCALE_SHADOW,
      scaleShadow: {
        ...Config.getDefaultConfig().focus.scaleShadow,
        scalePercent: 112,
        opacity: 42,
        offsetY: 10
      }
    }
  }
  let data = new Map<string, string>([
    [Config.CONFIG_KEY, JSON.stringify(savedConfig)]
  ])
  setFigma({ root: createRoot(data) })

  let config = Config.getSavedConfig()

  assert.equal(config.focus.mode, NavigationFocusMode.SCALE_SHADOW)
  assert.equal(config.focus.scaleShadow.scalePercent, 112)
  assert.equal(config.focus.scaleShadow.opacity, 42)
  assert.equal(config.focus.scaleShadow.offsetY, 10)
})

test('preserves saved focus variant when compatibility swapVariant is empty', () => {
  let savedConfig = {
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
