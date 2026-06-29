import assert from 'node:assert/strict'
import test from 'node:test'
import { AnimationEasing } from '../src/animation'
import {
  BOUNCY,
  EASE_IN,
  EASE_IN_AND_OUT,
  EASE_IN_AND_OUT_BACK,
  EASE_IN_BACK,
  EASE_OUT,
  EASE_OUT_BACK,
  EASING_OPTIONS,
  GENTLE,
  getAnimationEasingConfigValue,
  getAnimationEasingUiValue,
  LINEAR,
  QUICK,
  SLOW
} from '../src/animation_easing'

test('lists spring preset easings after back easings', () => {
  const optionValues = EASING_OPTIONS.map(option => option === '-' ? '-' : option.value)

  assert.deepEqual(optionValues, [
    LINEAR,
    '-',
    EASE_IN,
    EASE_OUT,
    EASE_IN_AND_OUT,
    '-',
    EASE_IN_BACK,
    EASE_OUT_BACK,
    EASE_IN_AND_OUT_BACK,
    '-',
    GENTLE,
    QUICK,
    BOUNCY,
    SLOW
  ])
})

test('maps spring preset easing labels to config enum values', () => {
  const mappings = [
    [AnimationEasing.GENTLE, GENTLE],
    [AnimationEasing.QUICK, QUICK],
    [AnimationEasing.BOUNCY, BOUNCY],
    [AnimationEasing.SLOW, SLOW]
  ]

  for (const [configValue, uiValue] of mappings) {
    assert.equal(getAnimationEasingUiValue(configValue), uiValue)
    assert.equal(getAnimationEasingConfigValue(uiValue), configValue)
  }
})
