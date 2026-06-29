import { Animation, AnimationEasing } from './animation'

const MIN_DURATION = 50
const MAX_DURATION = 5000
const DEFAULT_DURATION = 300

type SpringTransition = {
  readonly duration: number
  readonly mass: number
  readonly stiffness: number
  readonly damping: number
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
    easing === AnimationEasing.SLOW
}

export function getCustomSpringForAnimation(animation: Animation): SpringTransition {
  const preset = SPRING_PRESETS[animation.easing]
  if (!preset) return getSpringPresetForDuration({
    stiffnessConstant: 28800000,
    dampingConstant: 12000
  }, DEFAULT_DURATION)
  return getSpringPresetForDuration(preset, animation.duration)
}

function getSpringPresetForDuration(
  preset: {
    readonly stiffnessConstant: number
    readonly dampingConstant: number
  },
  duration: number
): SpringTransition {
  const nextDuration = clampFinite(duration, MIN_DURATION, MAX_DURATION, DEFAULT_DURATION)
  return {
    duration: nextDuration,
    mass: 1,
    stiffness: roundSpringValue(preset.stiffnessConstant / (nextDuration * nextDuration)),
    damping: roundSpringValue(preset.dampingConstant / nextDuration)
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
