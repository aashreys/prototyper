import { ComponentFocusMapping, ComponentFocusMappingType, SwapVariant } from "./swap_variant";
export type { ComponentFocusMapping, ComponentFocusMappingType } from "./swap_variant";

export enum NavigationFocusMode {
  VARIANT = 'variant',
  STROKE = 'stroke',
  FILL = 'fill',
  SHADOW = 'shadow',
  SCALE_SHADOW = 'scale-shadow'
}

export type ComponentFocusPropertyType = ComponentFocusMappingType

export type StrokeAlign = 'INSIDE' | 'CENTER' | 'OUTSIDE'

export interface StrokeFocusConfig {
  readonly color: string
  readonly opacity: number
  readonly weight: number
  readonly align: StrokeAlign
  readonly gap: number
}

export interface FillFocusConfig {
  readonly color: string
  readonly opacity: number
}

export interface ShadowFocusConfig {
  readonly color: string
  readonly blur: number
  readonly spread: number
  readonly padding: number
  readonly cornerRadius: number
}

export interface ScaleShadowFocusConfig {
  readonly scale: number
  readonly showShadow: boolean
  readonly padding: number
  readonly useAutoCornerRadius: boolean
  readonly cornerRadius: number
}

export interface NavigationFocusConfig {
  readonly mode: NavigationFocusMode
  readonly variant: SwapVariant
  readonly components: Array<ComponentFocusMapping>
  readonly stroke: StrokeFocusConfig
  readonly fill: FillFocusConfig
  readonly shadow: ShadowFocusConfig
  readonly scaleShadow: ScaleShadowFocusConfig
}

export const DEFAULT_VARIANT_FOCUS: SwapVariant = {
  property: '',
  from: '',
  to: ''
}

export const DEFAULT_COMPONENT_FOCUS_MAPPING: ComponentFocusMapping = {
  type: 'variant',
  property: '',
  from: '',
  to: ''
}

export const DEFAULT_STROKE_FOCUS: StrokeFocusConfig = {
  color: '#0C8CE9',
  opacity: 100,
  weight: 8,
  align: 'OUTSIDE',
  gap: 0
}

export const DEFAULT_FILL_FOCUS: FillFocusConfig = {
  color: '#FFFFFF',
  opacity: 50
}

export const DEFAULT_SHADOW_FOCUS: ShadowFocusConfig = {
  color: '#0C8CE9',
  blur: 24,
  spread: 0,
  padding: 4,
  cornerRadius: 8
}

export const DEFAULT_SCALE_SHADOW_FOCUS: ScaleShadowFocusConfig = {
  scale: 1.2,
  showShadow: true,
  padding: 6,
  useAutoCornerRadius: true,
  cornerRadius: 12
}

export function getDefaultNavigationFocusConfig(variant: SwapVariant = DEFAULT_VARIANT_FOCUS): NavigationFocusConfig {
  const normalizedVariant = normalizeVariantFocus(variant)
  const components = normalizeComponentFocusMappings(undefined, normalizedVariant)
  return {
    mode: isComponentFocusConfigured(components) ? NavigationFocusMode.VARIANT : NavigationFocusMode.STROKE,
    variant: getVariantCompatibilityMapping(components, normalizedVariant),
    components: components,
    stroke: { ...DEFAULT_STROKE_FOCUS },
    fill: { ...DEFAULT_FILL_FOCUS },
    shadow: { ...DEFAULT_SHADOW_FOCUS },
    scaleShadow: { ...DEFAULT_SCALE_SHADOW_FOCUS }
  }
}

export function normalizeNavigationFocusConfig(value, legacyVariant: SwapVariant = DEFAULT_VARIANT_FOCUS): NavigationFocusConfig {
  const defaultFocus = getDefaultNavigationFocusConfig(legacyVariant)
  if (!value || typeof value !== 'object') return defaultFocus

  const hasComponentSource = Array.isArray(value.components)
  const variant = normalizeVariantFocus(value.variant || legacyVariant)
  const components = normalizeComponentFocusMappings(
    hasComponentSource ? value.components : undefined,
    variant
  )
  return {
    mode: normalizeFocusMode(value.mode, isComponentFocusConfigured(components) ? NavigationFocusMode.VARIANT : NavigationFocusMode.STROKE),
    variant: getVariantCompatibilityMapping(components, hasComponentSource ? DEFAULT_VARIANT_FOCUS : variant),
    components: components,
    stroke: {
      color: normalizeColor(value.stroke?.color, DEFAULT_STROKE_FOCUS.color),
      opacity: normalizeNumber(value.stroke?.opacity, DEFAULT_STROKE_FOCUS.opacity, 100),
      weight: normalizeNumber(value.stroke?.weight, DEFAULT_STROKE_FOCUS.weight),
      align: normalizeStrokeAlign(value.stroke?.align, DEFAULT_STROKE_FOCUS.align),
      gap: normalizeNumber(value.stroke?.gap, DEFAULT_STROKE_FOCUS.gap)
    },
    fill: {
      color: normalizeColor(value.fill?.color, DEFAULT_FILL_FOCUS.color),
      opacity: normalizeNumber(value.fill?.opacity, DEFAULT_FILL_FOCUS.opacity, 100)
    },
    shadow: {
      color: normalizeColor(value.shadow?.color, DEFAULT_SHADOW_FOCUS.color),
      blur: normalizeNumber(value.shadow?.blur, DEFAULT_SHADOW_FOCUS.blur),
      spread: normalizeNumber(value.shadow?.spread, DEFAULT_SHADOW_FOCUS.spread),
      padding: normalizeNumber(value.shadow?.padding, DEFAULT_SHADOW_FOCUS.padding),
      cornerRadius: normalizeNumber(value.shadow?.cornerRadius, DEFAULT_SHADOW_FOCUS.cornerRadius)
    },
    scaleShadow: {
      scale: normalizeScale(value.scaleShadow, DEFAULT_SCALE_SHADOW_FOCUS.scale),
      showShadow: normalizeBoolean(value.scaleShadow?.showShadow, DEFAULT_SCALE_SHADOW_FOCUS.showShadow),
      padding: normalizeNumber(value.scaleShadow?.padding, DEFAULT_SCALE_SHADOW_FOCUS.padding),
      useAutoCornerRadius: normalizeBoolean(value.scaleShadow?.useAutoCornerRadius, DEFAULT_SCALE_SHADOW_FOCUS.useAutoCornerRadius),
      cornerRadius: normalizeNumber(value.scaleShadow?.cornerRadius, DEFAULT_SCALE_SHADOW_FOCUS.cornerRadius)
    }
  }
}

export function isVariantFocusConfigured(variant?: Partial<SwapVariant>): boolean {
  return Boolean(variant?.property && variant.property.length > 0 && variant?.to && variant.to.length > 0)
}

export function isComponentFocusMappingConfigured(mapping?: Partial<ComponentFocusMapping>): boolean {
  if (!mapping || !mapping.property || mapping.property.length === 0) return false
  if (mapping.type === 'boolean') return true
  return Boolean(mapping.to && mapping.to.length > 0)
}

export function isComponentFocusConfigured(mappings?: ReadonlyArray<Partial<ComponentFocusMapping>>): boolean {
  return Array.isArray(mappings) && mappings.some(mapping => isComponentFocusMappingConfigured(mapping))
}

export function isVariantFocusMode(focus: NavigationFocusConfig): boolean {
  return focus.mode === NavigationFocusMode.VARIANT
}

export function getComponentFocusMappings(focus: NavigationFocusConfig): Array<ComponentFocusMapping> {
  if (Array.isArray(focus.components)) return focus.components
  const variant = normalizeVariantFocus(focus.variant)
  return hasAnyVariantFocusValue(variant)
    ? [componentMappingFromVariant(variant)]
    : []
}

function normalizeVariantFocus(value): SwapVariant {
  return {
    property: typeof value?.property === 'string' ? value.property : '',
    from: typeof value?.from === 'string' ? value.from : '',
    to: typeof value?.to === 'string' ? value.to : ''
  }
}

function normalizeComponentFocusMappings(value, legacyVariant: SwapVariant): Array<ComponentFocusMapping> {
  if (Array.isArray(value)) return value.map(normalizeComponentFocusMapping)
  return hasAnyVariantFocusValue(legacyVariant)
    ? [componentMappingFromVariant(legacyVariant)]
    : []
}

function normalizeComponentFocusMapping(value): ComponentFocusMapping {
  const type = normalizeComponentFocusPropertyType(value?.type)
  if (type === 'boolean') {
    return {
      type: 'boolean',
      property: typeof value?.property === 'string' ? value.property : '',
      from: 'false',
      to: 'true'
    }
  }
  return {
    type: 'variant',
    property: typeof value?.property === 'string' ? value.property : '',
    from: typeof value?.from === 'string' ? value.from : '',
    to: typeof value?.to === 'string' ? value.to : ''
  }
}

function normalizeComponentFocusPropertyType(value): ComponentFocusMappingType {
  return value === 'boolean' ? 'boolean' : 'variant'
}

function componentMappingFromVariant(variant: SwapVariant): ComponentFocusMapping {
  return {
    type: 'variant',
    property: typeof variant?.property === 'string' ? variant.property : '',
    from: typeof variant?.from === 'string' ? variant.from : '',
    to: typeof variant?.to === 'string' ? variant.to : ''
  }
}

function getVariantCompatibilityMapping(
  components: Array<ComponentFocusMapping>,
  fallback: SwapVariant
): SwapVariant {
  const mapping = components[0]
  if (!mapping) return normalizeVariantFocus(fallback)
  return {
    property: mapping.property,
    from: mapping.from,
    to: mapping.to
  }
}

function hasAnyVariantFocusValue(variant: SwapVariant): boolean {
  return variant.property.length > 0 || variant.from.length > 0 || variant.to.length > 0
}

function normalizeFocusMode(value, fallback: NavigationFocusMode): NavigationFocusMode {
  if (value === NavigationFocusMode.VARIANT) return NavigationFocusMode.VARIANT
  if (value === NavigationFocusMode.STROKE) return NavigationFocusMode.STROKE
  if (value === NavigationFocusMode.FILL) return NavigationFocusMode.FILL
  if (value === NavigationFocusMode.SCALE_SHADOW) return NavigationFocusMode.SCALE_SHADOW
  return fallback
}

function normalizeNumber(value, fallback: number, maximum?: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return fallback
  return typeof maximum === 'number' ? Math.min(value, maximum) : value
}

function normalizeColor(value, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

function normalizeStrokeAlign(value, fallback: StrokeAlign): StrokeAlign {
  if (value === 'INSIDE' || value === 'CENTER' || value === 'OUTSIDE') return value
  return fallback
}

function normalizeBoolean(value, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeScale(value, fallback: number): number {
  const hasScale = typeof value?.scale === 'number' && Number.isFinite(value.scale) && value.scale >= 0.01
  const hasScalePercent = typeof value?.scalePercent === 'number' && Number.isFinite(value.scalePercent) && value.scalePercent >= 1
  if (hasScale && value.scale !== fallback) {
    return value.scale
  }
  if (hasScalePercent) {
    return value.scalePercent / 100
  }
  if (hasScale) return value.scale
  return fallback
}
