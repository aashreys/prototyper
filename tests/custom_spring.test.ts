import assert from 'node:assert/strict'
import test from 'node:test'
import { AnimationEasing, AnimationType, AnimationDirection } from '../src/animation'
import { getCustomSpringForAnimation, rescaleCustomSpringDuration } from '../src/custom_spring'

test('rescales custom spring stiffness and damping when duration changes', () => {
  const spring = rescaleCustomSpringDuration({
    duration: 1000,
    mass: 2,
    stiffness: 100,
    damping: 20,
    initialVelocity: 3
  }, 500)

  assert.deepEqual(spring, {
    duration: 500,
    mass: 2,
    stiffness: 400,
    damping: 40,
    initialVelocity: 3
  })
})

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
    stiffness: 6144,
    damping: 48,
    initialVelocity: 0
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
    stiffness: 256,
    damping: 24,
    initialVelocity: 0
  })
})

test('calibrates gentle preset spring parameters from duration', () => {
  const expectedValues = [
    [100, 6400, 120],
    [500, 256, 24],
    [800, 100, 15],
    [1200, 44.444, 10]
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
    [100, 10800, 120],
    [500, 432, 24],
    [600, 300, 20],
    [1200, 75, 10]
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
    [100, 38400, 120],
    [500, 1536, 24],
    [800, 600, 15],
    [1200, 266.667, 10]
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
    [100, 2880, 120],
    [200, 720, 60],
    [300, 320, 40],
    [400, 180, 30],
    [500, 115.2, 24],
    [600, 80, 20],
    [800, 45, 15],
    [1200, 20, 10],
    [2000, 7.2, 6]
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
