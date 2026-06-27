export type ComponentFocusMappingType = 'variant' | 'boolean'

export interface ComponentFocusMapping {

  readonly type: ComponentFocusMappingType
  readonly property: string
  readonly from: string
  readonly to: string

}

export interface SwapVariant {

  readonly property: string
  readonly from: string
  readonly to: string

}
