import assert from 'node:assert/strict'
import test from 'node:test'
import {
  Onboarding,
  shouldShowFocusOptionsTooltip
} from '../src/onboarding'

function setFigma(figma: unknown) {
  ;(globalThis as any).figma = figma
}

function createClientStorage(stored: Map<string, unknown>) {
  return {
    getAsync: async (key: string) => stored.get(key),
    setAsync: async (key: string, value: unknown) => {
      stored.set(key, value)
    },
    deleteAsync: async (key: string) => {
      stored.delete(key)
    }
  }
}

test('loads focus options tooltip status separately from original onboarding', async () => {
  const stored = new Map<string, unknown>([
    [Onboarding.ONBOARDING_KEY, true]
  ])
  setFigma({ clientStorage: createClientStorage(stored) })

  assert.deepEqual(await Onboarding.getStatusAsync(), {
    isComplete: true,
    isFocusOptionsTooltipDismissed: false
  })
})

test('saves focus options tooltip dismissal without changing original onboarding', async () => {
  const stored = new Map<string, unknown>([
    [Onboarding.ONBOARDING_KEY, true]
  ])
  setFigma({ clientStorage: createClientStorage(stored) })

  await Onboarding.focusOptionsTooltipDismissed()

  assert.equal(stored.get(Onboarding.ONBOARDING_KEY), true)
  assert.equal(stored.get(Onboarding.FOCUS_OPTIONS_TOOLTIP_KEY), true)
})

test('shows focus options tooltip only for completed original onboarding', () => {
  assert.equal(
    shouldShowFocusOptionsTooltip({
      isComplete: true,
      isFocusOptionsTooltipDismissed: false
    }),
    true
  )
  assert.equal(
    shouldShowFocusOptionsTooltip({
      isComplete: false,
      isFocusOptionsTooltipDismissed: false
    }),
    false
  )
  assert.equal(
    shouldShowFocusOptionsTooltip({
      isComplete: true,
      isFocusOptionsTooltipDismissed: true
    }),
    false
  )
})
