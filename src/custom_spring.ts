import { Animation, AnimationCustomSpring, AnimationEasing } from './animation'

const MIN_DURATION = 50
const MAX_DURATION = 5000
const MIN_SPRING_VALUE = 0.001
const MAX_SPRING_VALUE = 1000000
const MIN_INITIAL_VELOCITY = -10000
const MAX_INITIAL_VELOCITY = 10000

export const DEFAULT_CUSTOM_SPRING: AnimationCustomSpring = {
  duration: 300,
  mass: 1,
  stiffness: 170,
  damping: 26,
  initialVelocity: 0
}

const SPRING_PRESETS: Partial<Record<AnimationEasing, {
  readonly stiffnessConstant: number
  readonly dampingConstant: number
}>> = {
  [AnimationEasing.GENTLE]: {
    stiffnessConstant: 64000000,
    dampingConstant: 12000
  },
  [AnimationEasing.QUICK]: {
    stiffnessConstant: 108000000,
    dampingConstant: 12000
  },
  [AnimationEasing.BOUNCY]: {
    stiffnessConstant: 384000000,
    dampingConstant: 12000
  },
  [AnimationEasing.SLOW]: {
    stiffnessConstant: 28800000,
    dampingConstant: 12000
  }
}

export function isSpringEasing(easing: AnimationEasing): boolean {
  return easing === AnimationEasing.GENTLE ||
    easing === AnimationEasing.QUICK ||
    easing === AnimationEasing.BOUNCY ||
    easing === AnimationEasing.SLOW ||
    easing === AnimationEasing.CUSTOM_SPRING
}

export function normalizeCustomSpring(spring?: Partial<AnimationCustomSpring>): AnimationCustomSpring {
  return {
    duration: clampFinite(spring?.duration, MIN_DURATION, MAX_DURATION, DEFAULT_CUSTOM_SPRING.duration),
    mass: clampFinite(spring?.mass, MIN_SPRING_VALUE, MAX_SPRING_VALUE, DEFAULT_CUSTOM_SPRING.mass),
    stiffness: clampFinite(spring?.stiffness, MIN_SPRING_VALUE, MAX_SPRING_VALUE, DEFAULT_CUSTOM_SPRING.stiffness),
    damping: clampFinite(spring?.damping, MIN_SPRING_VALUE, MAX_SPRING_VALUE, DEFAULT_CUSTOM_SPRING.damping),
    initialVelocity: clampFinite(
      spring?.initialVelocity,
      MIN_INITIAL_VELOCITY,
      MAX_INITIAL_VELOCITY,
      DEFAULT_CUSTOM_SPRING.initialVelocity
    )
  }
}

export function rescaleCustomSpringDuration(
  spring: AnimationCustomSpring,
  duration: number
): AnimationCustomSpring {
  const currentSpring = normalizeCustomSpring(spring)
  const nextDuration = clampFinite(duration, MIN_DURATION, MAX_DURATION, currentSpring.duration)
  const durationScale = currentSpring.duration / nextDuration
  return normalizeCustomSpring({
    duration: nextDuration,
    mass: currentSpring.mass,
    stiffness: roundSpringValue(currentSpring.stiffness * durationScale * durationScale),
    damping: roundSpringValue(currentSpring.damping * durationScale),
    initialVelocity: currentSpring.initialVelocity
  })
}

export function getCustomSpringForAnimation(animation: Animation): AnimationCustomSpring {
  if (animation.easing === AnimationEasing.CUSTOM_SPRING) {
    return normalizeCustomSpring(animation.customSpring)
  }

  const preset = SPRING_PRESETS[animation.easing]
  if (!preset) return normalizeCustomSpring(animation.customSpring)
  return getSpringPresetForDuration(preset, animation.duration)
}

function getSpringPresetForDuration(
  preset: {
    readonly stiffnessConstant: number
    readonly dampingConstant: number
  },
  duration: number
): AnimationCustomSpring {
  const nextDuration = clampFinite(duration, MIN_DURATION, MAX_DURATION, DEFAULT_CUSTOM_SPRING.duration)
  return {
    duration: nextDuration,
    mass: 1,
    stiffness: roundSpringValue(preset.stiffnessConstant / (nextDuration * nextDuration)),
    damping: roundSpringValue(preset.dampingConstant / nextDuration),
    initialVelocity: 0
  }
}

export function getTransitionEasing(animation: Animation): Easing {
  if (!isSpringEasing(animation.easing)) return { type: animation.easing }

  const spring = getCustomSpringForAnimation(animation)
  return {
    type: AnimationEasing.CUSTOM_SPRING,
    // Figma's runtime rejects initialVelocity for prototype transition springs.
    easingFunctionSpring: {
      mass: spring.mass,
      stiffness: spring.stiffness,
      damping: spring.damping
    }
  } as unknown as Easing
}

export function getTransitionDuration(animation: Animation): number {
  if (!isSpringEasing(animation.easing)) return animation.duration
  return getCustomSpringForAnimation(animation).duration
}

function clampFinite(value: unknown, min: number, max: number, fallback: number): number {
  const numericValue = typeof value === 'string' && value.trim().length > 0 ? Number(value) : value
  if (typeof numericValue !== 'number' || !Number.isFinite(numericValue)) return fallback
  return Math.min(max, Math.max(min, numericValue))
}

function roundSpringValue(value: number): number {
  return Math.round(value * 1000) / 1000
}
