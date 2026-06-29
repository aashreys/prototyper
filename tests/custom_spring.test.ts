import assert from 'node:assert/strict'
import test from 'node:test'
import { AnimationEasing, AnimationType, AnimationDirection } from '../src/animation'
import { getCustomSpringForAnimation } from '../src/custom_spring'

test('creates custom spring parameters for a spring preset at requested duration', () => {
  const spring = getCustomSpringForAnimation({
    type: AnimationType.SMART_ANIMATE,
    isAutoDirection: false,
    direction: AnimationDirection.LEFT,
    isMatchLayers: false,
    easing: AnimationEasing.BOUNCY,
    duration: 250
  })

  assert.deepEqual(spring, {
    duration: 250,
    mass: 1,
    stiffness: 5536.209,
    damping: 48
  })
})

test('creates custom spring parameters for numeric string durations', () => {
  const spring = getCustomSpringForAnimation({
    type: AnimationType.SMART_ANIMATE,
    isAutoDirection: false,
    direction: AnimationDirection.LEFT,
    isMatchLayers: false,
    easing: AnimationEasing.GENTLE,
    duration: '500' as any
  })

  assert.deepEqual(spring, {
    duration: 500,
    mass: 1,
    stiffness: 266.67,
    damping: 24
  })
})

test('calibrates gentle preset spring parameters from duration', () => {
  const expectedValues = [
    [100, 6666.749, 120],
    [500, 266.67, 24],
    [800, 104.168, 15],
    [1200, 46.297, 10]
  ]

  for (const [duration, stiffness, damping] of expectedValues) {
    const spring = getCustomSpringForAnimation({
      type: AnimationType.SMART_ANIMATE,
      isAutoDirection: false,
      direction: AnimationDirection.LEFT,
      isMatchLayers: false,
      easing: AnimationEasing.GENTLE,
      duration: duration
    })

    assert.equal(spring.stiffness, stiffness)
    assert.equal(spring.damping, damping)
  }
})

test('calibrates quick preset spring parameters from duration', () => {
  const expectedValues = [
    [100, 10774.59, 120],
    [500, 430.984, 24],
    [600, 299.294, 20],
    [1200, 74.824, 10]
  ]

  for (const [duration, stiffness, damping] of expectedValues) {
    const spring = getCustomSpringForAnimation({
      type: AnimationType.SMART_ANIMATE,
      isAutoDirection: false,
      direction: AnimationDirection.LEFT,
      isMatchLayers: false,
      easing: AnimationEasing.QUICK,
      duration: duration
    })

    assert.equal(spring.stiffness, stiffness)
    assert.equal(spring.damping, damping)
  }
})

test('calibrates bouncy preset spring parameters from duration', () => {
  const expectedValues = [
    [100, 34601.307, 120],
    [500, 1384.052, 24],
    [800, 540.645, 15],
    [1200, 240.287, 10]
  ]

  for (const [duration, stiffness, damping] of expectedValues) {
    const spring = getCustomSpringForAnimation({
      type: AnimationType.SMART_ANIMATE,
      isAutoDirection: false,
      direction: AnimationDirection.LEFT,
      isMatchLayers: false,
      easing: AnimationEasing.BOUNCY,
      duration: duration
    })

    assert.equal(spring.stiffness, stiffness)
    assert.equal(spring.damping, damping)
  }
})

test('calibrates slow preset spring parameters from duration', () => {
  const expectedValues = [
    [100, 4337.915, 120],
    [200, 1084.479, 60],
    [300, 481.991, 40],
    [400, 271.12, 30],
    [500, 173.517, 24],
    [600, 120.498, 20],
    [800, 67.78, 15],
    [1200, 30.124, 10],
    [2000, 10.845, 6]
  ]

  for (const [duration, stiffness, damping] of expectedValues) {
    const spring = getCustomSpringForAnimation({
      type: AnimationType.SMART_ANIMATE,
      isAutoDirection: false,
      direction: AnimationDirection.LEFT,
      isMatchLayers: false,
      easing: AnimationEasing.SLOW,
      duration: duration
    })

    assert.equal(spring.stiffness, stiffness)
    assert.equal(spring.damping, damping)
  }
})
