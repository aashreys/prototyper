import { SwapVariant } from "./swap_variant";

export enum NavigationFocusMode {
  VARIANT = 'variant',
  STROKE = 'stroke',
  SHADOW = 'shadow'
}

export interface StrokeFocusConfig {
  readonly color: string
  readonly weight: number
  readonly padding: number
  readonly cornerRadius: number
}

export interface ShadowFocusConfig {
  readonly color: string
  readonly blur: number
  readonly spread: number
  readonly padding: number
  readonly cornerRadius: number
}

export interface NavigationFocusConfig {
  readonly mode: NavigationFocusMode
  readonly variant: SwapVariant
  readonly stroke: StrokeFocusConfig
  readonly shadow: ShadowFocusConfig
}

export const DEFAULT_VARIANT_FOCUS: SwapVariant = {
  property: '',
  from: '',
  to: ''
}

export const DEFAULT_STROKE_FOCUS: StrokeFocusConfig = {
  color: '#0C8CE9',
  weight: 4,
  padding: 4,
  cornerRadius: 8
}

export const DEFAULT_SHADOW_FOCUS: ShadowFocusConfig = {
  color: '#0C8CE9',
  blur: 24,
  spread: 0,
  padding: 4,
  cornerRadius: 8
}

export function getDefaultNavigationFocusConfig(variant: SwapVariant = DEFAULT_VARIANT_FOCUS): NavigationFocusConfig {
  return {
    mode: isVariantFocusConfigured(variant) ? NavigationFocusMode.VARIANT : NavigationFocusMode.STROKE,
    variant: normalizeVariantFocus(variant),
    stroke: { ...DEFAULT_STROKE_FOCUS },
    shadow: { ...DEFAULT_SHADOW_FOCUS }
  }
}

export function normalizeNavigationFocusConfig(value, legacyVariant: SwapVariant = DEFAULT_VARIANT_FOCUS): NavigationFocusConfig {
  const defaultFocus = getDefaultNavigationFocusConfig(legacyVariant)
  if (!value || typeof value !== 'object') return defaultFocus

  const variant = normalizeVariantFocus(value.variant || legacyVariant)
  return {
    mode: normalizeFocusMode(value.mode, isVariantFocusConfigured(variant) ? NavigationFocusMode.VARIANT : NavigationFocusMode.STROKE),
    variant: variant,
    stroke: {
      color: normalizeColor(value.stroke?.color, DEFAULT_STROKE_FOCUS.color),
      weight: normalizeNumber(value.stroke?.weight, DEFAULT_STROKE_FOCUS.weight),
      padding: normalizeNumber(value.stroke?.padding, DEFAULT_STROKE_FOCUS.padding),
      cornerRadius: normalizeNumber(value.stroke?.cornerRadius, DEFAULT_STROKE_FOCUS.cornerRadius)
    },
    shadow: {
      color: normalizeColor(value.shadow?.color, DEFAULT_SHADOW_FOCUS.color),
      blur: normalizeNumber(value.shadow?.blur, DEFAULT_SHADOW_FOCUS.blur),
      spread: normalizeNumber(value.shadow?.spread, DEFAULT_SHADOW_FOCUS.spread),
      padding: normalizeNumber(value.shadow?.padding, DEFAULT_SHADOW_FOCUS.padding),
      cornerRadius: normalizeNumber(value.shadow?.cornerRadius, DEFAULT_SHADOW_FOCUS.cornerRadius)
    }
  }
}

export function isVariantFocusConfigured(variant?: Partial<SwapVariant>): boolean {
  return Boolean(variant?.property && variant.property.length > 0 && variant?.to && variant.to.length > 0)
}

export function isVariantFocusMode(focus: NavigationFocusConfig): boolean {
  return focus.mode === NavigationFocusMode.VARIANT
}

function normalizeVariantFocus(value): SwapVariant {
  return {
    property: typeof value?.property === 'string' ? value.property : '',
    from: typeof value?.from === 'string' ? value.from : '',
    to: typeof value?.to === 'string' ? value.to : ''
  }
}

function normalizeFocusMode(value, fallback: NavigationFocusMode): NavigationFocusMode {
  if (value === NavigationFocusMode.VARIANT) return NavigationFocusMode.VARIANT
  if (value === NavigationFocusMode.STROKE) return NavigationFocusMode.STROKE
  if (value === NavigationFocusMode.SHADOW) return NavigationFocusMode.SHADOW
  return fallback
}

function normalizeNumber(value, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback
}

function normalizeColor(value, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}
