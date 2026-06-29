import type { DropdownOption } from '@create-figma-plugin/ui'
import { AnimationEasing } from './animation'

export const LINEAR = 'Linear'
export const EASE_IN = 'Ease in'
export const EASE_OUT = 'Ease out'
export const EASE_IN_AND_OUT = 'Ease in and out'
export const EASE_IN_BACK = 'Ease in back'
export const EASE_OUT_BACK = 'Ease out back'
export const EASE_IN_AND_OUT_BACK = 'Ease in and out back'
export const GENTLE = 'Gentle'
export const QUICK = 'Quick'
export const BOUNCY = 'Bouncy'
export const SLOW = 'Slow'
export const CUSTOM_SPRING = 'Custom Spring'

export const EASING_OPTIONS: Array<DropdownOption> = [
  { value: LINEAR },
  "-",
  { value: EASE_IN },
  { value: EASE_OUT },
  { value: EASE_IN_AND_OUT },
  "-",
  { value: EASE_IN_BACK },
  { value: EASE_OUT_BACK },
  { value: EASE_IN_AND_OUT_BACK },
  "-",
  { value: GENTLE },
  { value: QUICK },
  { value: BOUNCY },
  { value: SLOW },
  { value: CUSTOM_SPRING },
]

export function getAnimationEasingUiValue(configValue: string) {
  switch (configValue) {
    case AnimationEasing.LINEAR: return LINEAR
    case AnimationEasing.EASE_IN: return EASE_IN
    case AnimationEasing.EASE_OUT: return EASE_OUT
    case AnimationEasing.EASE_IN_AND_OUT: return EASE_IN_AND_OUT
    case AnimationEasing.EASE_IN_BACK: return EASE_IN_BACK
    case AnimationEasing.EASE_OUT_BACK: return EASE_OUT_BACK
    case AnimationEasing.EASE_IN_AND_OUT_BACK: return EASE_IN_AND_OUT_BACK
    case AnimationEasing.GENTLE: return GENTLE
    case AnimationEasing.QUICK: return QUICK
    case AnimationEasing.BOUNCY: return BOUNCY
    case AnimationEasing.SLOW: return SLOW
    case AnimationEasing.CUSTOM_SPRING: return CUSTOM_SPRING
  }
}

export function getAnimationEasingConfigValue(uiValue: string) {
  switch (uiValue) {
    case LINEAR: return AnimationEasing.LINEAR
    case EASE_IN: return AnimationEasing.EASE_IN
    case EASE_OUT: return AnimationEasing.EASE_OUT
    case EASE_IN_AND_OUT: return AnimationEasing.EASE_IN_AND_OUT
    case EASE_IN_BACK: return AnimationEasing.EASE_IN_BACK
    case EASE_OUT_BACK: return AnimationEasing.EASE_OUT_BACK
    case EASE_IN_AND_OUT_BACK: return AnimationEasing.EASE_IN_AND_OUT_BACK
    case GENTLE: return AnimationEasing.GENTLE
    case QUICK: return AnimationEasing.QUICK
    case BOUNCY: return AnimationEasing.BOUNCY
    case SLOW: return AnimationEasing.SLOW
    case CUSTOM_SPRING: return AnimationEasing.CUSTOM_SPRING
  }
}
