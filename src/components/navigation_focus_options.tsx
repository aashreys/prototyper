import {
  Bold,
  Checkbox,
  Dropdown,
  DropdownOption,
  IconExpand24,
  IconButton,
  IconMinusSmall24,
  IconPlus24,
  IconPlusSmall24,
  IconScaleSmall24,
  IconAutoLayoutSpacingHorizontal24,
  IconStrokeWeight24,
  Text,
  Textbox,
  TextboxColor,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { Component, h, JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Constants } from "../constants";
import {
  ComponentFocusMapping,
  ComponentFocusPropertyType,
  DEFAULT_COMPONENT_FOCUS_MAPPING,
  DEFAULT_POINTER_FOCUS,
  DEFAULT_VARIANT_FOCUS,
  FillFocusConfig,
  getComponentFocusMappings,
  getPointerPosition,
  getPointerSize,
  NavigationFocusConfig,
  NavigationFocusMode,
  POINTER_POSITION_PRESETS,
  PointerFocusConfig,
  PointerPositionPreset,
  PointerSizeMode,
  ScaleShadowFocusConfig,
  StrokeAlign,
  StrokeFocusConfig,
} from "../navigation_focus";
import {
  getPointerPresetDataUrl,
  POINTER_PRESETS,
} from "../pointer_assets";
import {
  createPointerAssetPayload,
  normalizePointerAssetPayload,
  PointerAssetPayload,
} from "../pointer_asset_validation";
import { SwapVariant } from "../swap_variant";
import { ArrowRightIcon } from "../icons/arrow_right";
import styles from "../styles.css";

type StrokeNumberKey = "weight" | "gap";
type ScaleShadowNumberKey = "scale";

const DECIMAL_INPUT_PATTERN = /^\d*(?:\.\d*)?$/;
const DECIMAL_PRECISION = 6;

const MODE_OPTIONS: Array<DropdownOption> = [
  { value: NavigationFocusMode.STROKE, text: "Stroke" },
  { value: NavigationFocusMode.FILL, text: "Fill" },
  { value: NavigationFocusMode.SCALE_SHADOW, text: "Scale" },
  { value: NavigationFocusMode.VARIANT, text: "Components" },
  { value: NavigationFocusMode.POINTER, text: "Floating pointer" },
];

const COMPONENT_MAPPING_TYPE_OPTIONS: Array<DropdownOption> = [
  { value: "variant", text: "Variant" },
  { value: "boolean", text: "Boolean" },
];

const STROKE_ALIGN_OPTIONS: Array<DropdownOption> = [
  { value: "CENTER", text: "Center" },
  { value: "INSIDE", text: "Inside" },
  { value: "OUTSIDE", text: "Outside" },
];

const POINTER_POSITION_OPTIONS: Array<{
  readonly value: Exclude<PointerPositionPreset, "custom">;
  readonly title: string;
}> = [
  { value: "top-left", title: "Top left" },
  { value: "top", title: "Top" },
  { value: "top-right", title: "Top right" },
  { value: "left", title: "Left" },
  { value: "center", title: "Center" },
  { value: "right", title: "Right" },
  { value: "bottom-left", title: "Bottom left" },
  { value: "bottom", title: "Bottom" },
  { value: "bottom-right", title: "Bottom right" },
];

const POINTER_UPLOAD_NOTE = "PNG & GIF cursors supported";
const POINTER_PAD_INSET = 12;
const POINTER_PAD_TRACK_SIZE = 76;
const POINTER_ANCHOR_HIT_RADIUS = 6.5;

const COMPONENT_HELPER_TEXT =
  "Add properties to change components to their focused state";

function FocusNumberInput(props: FocusNumberInputProps) {
  const [value, setValue] = useState(formatNumericInputValue(props));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setValue(formatNumericInputValue(props));
    }
  }, [isFocused, props.suffix, props.value]);

  function handleInput(event: JSX.TargetedEvent<HTMLInputElement>) {
    const nextValue = event.currentTarget.value;
    if (!isAllowedNumericInput(nextValue, props.suffix)) {
      event.currentTarget.value = value;
      return;
    }
    setValue(nextValue);

    const parsedValue = parseNumericInputValue(nextValue, props.suffix);
    if (parsedValue === null) return;
    if (parsedValue < props.minimum) return;
    props.onNumberInput(parsedValue);
  }

  function handleKeyDown(event: JSX.TargetedKeyboardEvent<HTMLInputElement>) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const increment = event.shiftKey ? props.incrementLarge : props.incrementSmall;
    const direction = event.key === "ArrowUp" ? 1 : -1;
    const parsedValue = parseNumericInputValue(value, props.suffix);
    const baseValue =
      parsedValue === null || parsedValue < props.minimum
        ? props.value
        : parsedValue;
    const nextValue = clampNumber(
      roundNumber(baseValue + direction * increment),
      props.minimum,
      props.maximum,
    );
    const nextDisplayValue = formatNumericInputValue({
      ...props,
      value: nextValue,
    });
    setValue(nextDisplayValue);
    event.currentTarget.value = nextDisplayValue;
    event.currentTarget.select();
    props.onNumberInput(nextValue);
  }

  function validateOnBlur(nextValue: string): string | boolean {
    const parsedValue = parseNumericInputValue(nextValue, props.suffix);
    if (parsedValue === null || parsedValue < props.minimum) return false;
    return formatNumericInputValue({
      ...props,
      value: parsedValue,
    });
  }

  return (
    <Textbox
      icon={props.icon}
      onBlur={() => setIsFocused(false)}
      onFocus={() => setIsFocused(true)}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      placeholder={props.placeholder}
      validateOnBlur={validateOnBlur}
      value={value}
    />
  );
}

function isAllowedNumericInput(value: string, suffix?: string): boolean {
  const normalizedValue = value.trim();
  return getNumericInputPattern(suffix).test(normalizedValue);
}

function parseNumericInputValue(value: string, suffix?: string): null | number {
  let normalizedValue = removeNumericInputSuffix(value.trim(), suffix);
  if (
    normalizedValue.length === 0 ||
    normalizedValue === "." ||
    !DECIMAL_INPUT_PATTERN.test(normalizedValue)
  ) {
    return null;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function getNumericInputPattern(suffix?: string): RegExp {
  if (!suffix) return DECIMAL_INPUT_PATTERN;
  const suffixPattern = getSuffixPrefixPattern(suffix);
  return new RegExp(`^\\d*(?:\\.\\d*)?(?:${suffixPattern})?$`, "i");
}

function removeNumericInputSuffix(value: string, suffix?: string): string {
  if (!suffix) return value;
  const lowerValue = value.toLowerCase();
  const lowerSuffix = suffix.toLowerCase();
  for (let length = lowerSuffix.length; length > 0; length--) {
    const suffixPrefix = lowerSuffix.slice(0, length);
    if (lowerValue.endsWith(suffixPrefix)) {
      return value.slice(0, value.length - length);
    }
  }
  return value;
}

function getSuffixPrefixPattern(suffix: string): string {
  const prefixes: Array<string> = [];
  for (let length = 1; length <= suffix.length; length++) {
    prefixes.push(escapeRegExp(suffix.slice(0, length)));
  }
  return prefixes.join("|");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatNumericInputValue(props: {
  suffix?: string;
  value: number;
}): string {
  return `${props.value.toString()}${props.suffix || ""}`;
}

function clampNumber(value: number, minimum: number, maximum?: number): number {
  const lowerBounded = Math.max(minimum, value);
  return typeof maximum === "number"
    ? Math.min(maximum, lowerBounded)
    : lowerBounded;
}

function roundNumber(value: number): number {
  return Number(value.toFixed(DECIMAL_PRECISION));
}

export class NavigationFocusOptions extends Component<
  NavigationFocusOptionsProps,
  any
> {
  pointerUploadInput: HTMLInputElement | null = null;

  constructor(props) {
    super(props);
    this.state = {
      customPointerAsset: undefined,
      customPointerDataUrl: "",
      pointerPositionHover: undefined,
      pointerPositionIsHovering: false,
      pointerPositionHoverPreset: undefined,
      pointerUploadError: "",
    };
    this.bindMethods();
    this.registerEventListeners();
  }

  bindMethods() {
    this.onModeChange = this.onModeChange.bind(this);
    this.onStrokeColorChange = this.onStrokeColorChange.bind(this);
    this.onFillColorChange = this.onFillColorChange.bind(this);
    this.onPointerAssetSelected = this.onPointerAssetSelected.bind(this);
    this.onPointerUploadClick = this.onPointerUploadClick.bind(this);
    this.onPointerUploadInputChange = this.onPointerUploadInputChange.bind(this);
    this.onPointerPositionInput = this.onPointerPositionInput.bind(this);
    this.onPointerPositionHover = this.onPointerPositionHover.bind(this);
    this.onPointerPositionLeave = this.onPointerPositionLeave.bind(this);
    this.registerEventListeners = this.registerEventListeners.bind(this);
  }

  registerEventListeners() {
    on(Constants.EVENT_RECEIVE_POINTER_ASSET, (asset) => {
      const normalizedAsset = normalizePointerAssetPayload(asset);
      this.setState({
        customPointerAsset: normalizedAsset,
        customPointerDataUrl: normalizedAsset
          ? pointerAssetToDataUrl(normalizedAsset)
          : "",
        pointerUploadError: "",
      });
    });

    on(Constants.EVENT_POINTER_ASSET_ERROR, (message) => {
      this.setState({
        pointerUploadError:
          typeof message === "string" && message.length > 0
            ? message
            : "Could not save pointer image.",
      });
    });

    emit(Constants.EVENT_REQUEST_POINTER_ASSET);
  }

  onModeChange(mode: NavigationFocusMode) {
    this.props.onNavigationFocusChange({
      ...this.props.focus,
      mode: mode,
      pointer: {
        ...this.getPointer(),
        enabled: mode === NavigationFocusMode.POINTER,
      },
    });
  }

  onStrokeColorChange(color: string) {
    this.updateStroke({
      ...this.props.focus.stroke,
      color: this.toStoredHexColor(color),
    });
  }

  onStrokeOpacityChange(opacity: null | number) {
    if (opacity === null) return;
    this.updateStroke({
      ...this.props.focus.stroke,
      opacity: this.toFocusNumber(
        opacity * 100,
        this.props.focus.stroke.opacity,
        0,
        100,
      ),
    });
  }

  onStrokeNumberChange(key: StrokeNumberKey, value: null | number) {
    this.updateStroke({
      ...this.props.focus.stroke,
      [key]: this.toFocusNumber(value, this.props.focus.stroke[key]),
    });
  }

  onStrokeAlignChange(align: StrokeAlign) {
    this.updateStroke({
      ...this.props.focus.stroke,
      align: align,
    });
  }

  onStrokeAddGlowChange(addGlow: boolean) {
    this.updateStroke({
      ...this.props.focus.stroke,
      addGlow: addGlow,
    });
  }

  updateStroke(stroke: StrokeFocusConfig) {
    this.props.onNavigationFocusChange({
      ...this.props.focus,
      stroke: stroke,
    });
  }

  onFillColorChange(color: string) {
    this.updateFill({
      ...this.props.focus.fill,
      color: this.toStoredHexColor(color),
    });
  }

  onFillOpacityChange(opacity: null | number) {
    if (opacity === null) return;
    this.updateFill({
      ...this.props.focus.fill,
      opacity: this.toFocusNumber(
        opacity * 100,
        this.props.focus.fill.opacity,
        0,
        100,
      ),
    });
  }

  updateFill(fill: FillFocusConfig) {
    this.props.onNavigationFocusChange({
      ...this.props.focus,
      fill: fill,
    });
  }

  onScaleShadowNumberChange(key: ScaleShadowNumberKey, value: null | number) {
    this.updateScaleShadow({
      ...this.props.focus.scaleShadow,
      [key]: this.toFocusNumber(value, this.props.focus.scaleShadow[key], 0.01),
    });
  }

  onScaleShadowShowShadowChange(showShadow: boolean) {
    this.updateScaleShadow({
      ...this.props.focus.scaleShadow,
      showShadow: showShadow,
    });
  }

  updateScaleShadow(scaleShadow: ScaleShadowFocusConfig) {
    this.props.onNavigationFocusChange({
      ...this.props.focus,
      scaleShadow: scaleShadow,
    });
  }

  getPointer(props: NavigationFocusOptionsProps = this.props): PointerFocusConfig {
    return props.focus.pointer || DEFAULT_POINTER_FOCUS;
  }

  updatePointer(pointer: PointerFocusConfig) {
    this.props.onNavigationFocusChange({
      ...this.props.focus,
      pointer: pointer,
    });
  }

  onPointerPresetSelect(presetId: string) {
    this.updatePointer({
      ...this.getPointer(),
      assetSource: "preset",
      presetId: presetId,
    });
  }

  onCustomPointerSelect() {
    if (!this.state.customPointerAsset) {
      this.setState({
        pointerUploadError: "Upload a custom pointer image first.",
      });
      return;
    }
    this.updatePointer({
      ...this.getPointer(),
      assetSource: "custom",
    });
  }

  onCustomPointerRemove(event: Event) {
    event.stopPropagation();
    this.setState({
      customPointerAsset: undefined,
      customPointerDataUrl: "",
      pointerUploadError: "",
    });
    this.updatePointer({
      ...this.getPointer(),
      assetSource: "preset",
    });
    emit(Constants.EVENT_DELETE_POINTER_ASSET);
  }

  onPointerUploadClick() {
    if (this.pointerUploadInput) this.pointerUploadInput.click();
  }

  onPointerUploadInputChange(event: JSX.TargetedEvent<HTMLInputElement>) {
    const fileList = event.currentTarget.files;
    if (!fileList || fileList.length === 0) return;
    this.onPointerAssetSelected(Array.prototype.slice.call(fileList));
    event.currentTarget.value = "";
  }

  async onPointerAssetSelected(files: Array<File>) {
    const file = files[0];
    if (!file) return;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = createPointerAssetPayload(file, bytes);
    if (result.error || !result.payload) {
      this.setState({
        pointerUploadError: result.error || "Could not use pointer image.",
      });
      return;
    }

    this.setState({
      customPointerAsset: result.payload,
      customPointerDataUrl: pointerAssetToDataUrl(result.payload),
      pointerUploadError: "",
    });
    this.updatePointer({
      ...this.getPointer(),
      assetSource: "custom",
    });
    emit(Constants.EVENT_SAVE_POINTER_ASSET, result.payload);
  }

  onPointerSizeChange(value: number) {
    const size = clampNumber(Math.round(value), 1, 1024);
    const sizeMode =
      size === 48 || size === 64 || size === 96
        ? (size.toString() as PointerSizeMode)
        : "custom";
    this.updatePointer({
      ...this.getPointer(),
      sizeMode: sizeMode,
      customSize: size,
    });
  }

  onPointerPositionPresetChange(positionPreset: PointerPositionPreset) {
    this.updatePointer({
      ...this.getPointer(),
      positionPreset: positionPreset,
    });
  }

  onPointerPositionInput(event: any) {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const hoverState = this.getPointerPositionHoverState(event);
    this.setState(hoverState);
    if (hoverState.pointerPositionHoverPreset) {
      this.onPointerPositionPresetChange(hoverState.pointerPositionHoverPreset);
      return;
    }
    const x = clampNumber(
      (hoverState.pointerPositionHover.x - POINTER_PAD_INSET) /
        POINTER_PAD_TRACK_SIZE,
      0,
      1,
    );
    const y = clampNumber(
      (hoverState.pointerPositionHover.y - POINTER_PAD_INSET) /
        POINTER_PAD_TRACK_SIZE,
      0,
      1,
    );
    this.updatePointer({
      ...this.getPointer(),
      positionPreset: "custom",
      position: {
        x: roundNumber(x),
        y: roundNumber(y),
      },
    });
  }

  onPointerPositionHover(event: any) {
    this.setState(this.getPointerPositionHoverState(event));
    if (event.buttons !== 1) return;
    this.onPointerPositionInput(event);
  }

  onPointerPositionLeave() {
    this.setState({
      pointerPositionHover: undefined,
      pointerPositionIsHovering: false,
      pointerPositionHoverPreset: undefined,
    });
  }

  getPointerPositionHoverState(event: any) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerPositionHover = {
      x: roundNumber(clampNumber(event.clientX - bounds.left, 0, bounds.width)),
      y: roundNumber(clampNumber(event.clientY - bounds.top, 0, bounds.height)),
    };
    return {
      pointerPositionHover: {
        x: pointerPositionHover.x,
        y: pointerPositionHover.y,
      },
      pointerPositionIsHovering: true,
      pointerPositionHoverPreset:
        this.getPointerAnchorHit(pointerPositionHover) || undefined,
    };
  }

  getPointerAnchorHit(position: {
    readonly x: number;
    readonly y: number;
  }): Exclude<PointerPositionPreset, "custom"> | undefined {
    let closestPreset: Exclude<PointerPositionPreset, "custom"> | undefined;
    let closestDistance = Number.POSITIVE_INFINITY;
    for (const option of POINTER_POSITION_OPTIONS) {
      const anchor = this.getPointerAnchorPixelPosition(option.value);
      const distance = Math.hypot(position.x - anchor.x, position.y - anchor.y);
      if (distance > POINTER_ANCHOR_HIT_RADIUS || distance >= closestDistance) {
        continue;
      }
      closestPreset = option.value;
      closestDistance = distance;
    }
    return closestPreset;
  }

  toTextboxHexColor(color: string): string {
    return (color || "").replace(/^#/, "").toUpperCase();
  }

  toStoredHexColor(color: string): string {
    const normalized = (color || "").trim();
    if (normalized.length === 0) return normalized;
    return normalized.startsWith("#") ? normalized : `#${normalized}`;
  }

  toFocusNumber(
    value: null | number,
    fallback: number,
    minimum = 0,
    maximum?: number,
  ): number {
    if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
    const lowerBounded = Math.max(minimum, value);
    return typeof maximum === "number"
      ? Math.min(maximum, lowerBounded)
      : lowerBounded;
  }

  getComponentMappings(
    props: NavigationFocusOptionsProps,
  ): Array<ComponentFocusMapping> {
    return getComponentFocusMappings(props.focus);
  }

  addMapping() {
    const mappings = getComponentFocusMappings(this.props.focus);
    this.setComponentMappings([
      ...mappings,
      { ...DEFAULT_COMPONENT_FOCUS_MAPPING },
    ]);
    this.props.onComponentMappingAdd();
  }

  removeMapping(index: number) {
    this.setComponentMappings(
      getComponentFocusMappings(this.props.focus).filter(
        (_mapping, i) => i !== index,
      ),
    );
  }

  updateMappingType(index: number, type: ComponentFocusPropertyType) {
    const mappings = this.getComponentMappings(this.props).map((mapping, i) => {
      if (i !== index) return mapping;
      return {
        ...mapping,
        type: type,
        from: type === "boolean" ? "false" : "",
        to: type === "boolean" ? "true" : "",
      };
    });
    this.setComponentMappings(mappings);
  }

  updateMappingProperty(index: number, property: string) {
    const mappings = this.getComponentMappings(this.props).map((mapping, i) =>
      i === index ? { ...mapping, property: property } : mapping,
    );
    this.setComponentMappings(mappings);
  }

  updateMappingFrom(index: number, from: string) {
    const mappings = this.getComponentMappings(this.props).map((mapping, i) =>
      i === index ? { ...mapping, from: from } : mapping,
    );
    this.setComponentMappings(mappings);
  }

  updateMappingTo(index: number, to: string) {
    const mappings = this.getComponentMappings(this.props).map((mapping, i) =>
      i === index ? { ...mapping, to: to } : mapping,
    );
    this.setComponentMappings(mappings);
  }

  setComponentMappings(mappings: Array<ComponentFocusMapping>) {
    const normalizedMappings = mappings.map((mapping) =>
      this.normalizeComponentMapping(mapping),
    );
    this.props.onNavigationFocusChange({
      ...this.props.focus,
      components: normalizedMappings,
      variant: this.toVariantCompatibility(normalizedMappings),
    });
  }

  normalizeComponentMapping(
    mapping: ComponentFocusMapping,
  ): ComponentFocusMapping {
    if (mapping.type === "boolean") {
      return {
        type: "boolean",
        property: mapping.property,
        from: "false",
        to: "true",
      };
    }
    return {
      type: "variant",
      property: mapping.property,
      from: mapping.from,
      to: mapping.to,
    };
  }

  toVariantCompatibility(mappings: Array<ComponentFocusMapping>): SwapVariant {
    const missingProperty = mappings.find((mapping) => {
      return mapping.property.length === 0;
    });
    if (missingProperty) return this.toSwapVariant(missingProperty);

    const incompleteVariant = mappings.find((mapping) => {
      return (
        mapping.type === "variant" &&
        (mapping.from.length === 0 || mapping.to.length === 0)
      );
    });
    if (incompleteVariant) {
      return {
        ...this.toSwapVariant(incompleteVariant),
        to: "",
      };
    }

    const mapping = mappings[0];
    if (!mapping) return { ...DEFAULT_VARIANT_FOCUS };
    return this.toSwapVariant(mapping);
  }

  toSwapVariant(mapping: ComponentFocusMapping): SwapVariant {
    if (mapping.type === "boolean") {
      return {
        property: mapping.property,
        from: "false",
        to: "true",
      };
    }
    return {
      property: mapping.property,
      from: mapping.from,
      to: mapping.to,
    };
  }

  renderVariantControls(props: NavigationFocusOptionsProps) {
    const mappings = this.getComponentMappings(props);
    const showEmptyMappingsError =
      props.showPropertyError && mappings.length === 0;
    return (
      <div class={styles.variantFocusControls}>
        <div class={styles.componentMappingHeader}>
          <div class={styles.helperText}>{COMPONENT_HELPER_TEXT}</div>
          <div class={styles.componentMappingAction}>
            <IconButton onClick={() => this.addMapping()} title="Add mapping">
              <IconPlusSmall24 />
            </IconButton>
          </div>
        </div>

        {showEmptyMappingsError && (
          <div class={styles.componentMappingHeaderError}>
            <text class={styles.errorText}>Component property required</text>
          </div>
        )}

        <div class={styles.componentMappings}>
          {mappings.map((mapping, index) =>
            this.renderMappingControl(mapping, index, props),
          )}
        </div>
      </div>
    );
  }

  renderMappingControl(
    mapping: ComponentFocusMapping,
    index: number,
    props: NavigationFocusOptionsProps,
  ) {
    const showPropertyError =
      props.showPropertyError && mapping.property.length === 0;
    const showValueError =
      props.showToVariantError &&
      mapping.type === "variant" &&
      (mapping.from.length === 0 || mapping.to.length === 0);
    return (
      <div class={styles.componentMapping}>
        <div class={styles.componentMappingRow}>
          <Dropdown
            onChange={(e) =>
              this.updateMappingType(
                index,
                e.currentTarget.value as ComponentFocusPropertyType,
              )
            }
            options={COMPONENT_MAPPING_TYPE_OPTIONS}
            value={mapping.type}
          />

          <Textbox
            onInput={(e) =>
              this.updateMappingProperty(index, e.currentTarget.value)
            }
            placeholder="Property name"
            value={mapping.property}
          />

          <div class={styles.componentMappingAction}>
            <IconButton
              onClick={() => this.removeMapping(index)}
              title="Remove mapping"
            >
              <IconMinusSmall24 />
            </IconButton>
          </div>
        </div>

        {showPropertyError && (
          <div class={styles.componentMappingError}>
            <text class={styles.errorText}>Property name required</text>
          </div>
        )}

        {mapping.type === "variant" && (
          <div class={styles.componentMappingValueRow}>
            <div class={styles.componentMappingValueFields}>
              <Textbox
                onInput={(e) =>
                  this.updateMappingFrom(index, e.currentTarget.value)
                }
                placeholder="Default"
                value={mapping.from}
              />

              <div class={styles.variantValueArrow}>
                <ArrowRightIcon class={styles.greyIcon} />
              </div>

              <Textbox
                onInput={(e) =>
                  this.updateMappingTo(index, e.currentTarget.value)
                }
                placeholder="Focused"
                value={mapping.to}
              />
            </div>
          </div>
        )}

        {showValueError && (
          <div class={styles.componentMappingError}>
            <text class={styles.errorText}>Property values required</text>
          </div>
        )}
      </div>
    );
  }

  renderStrokeControls(props: NavigationFocusOptionsProps) {
    return (
      <div class={styles.strokeControls}>
        <div>
          <TextboxColor
            fullWidth
            hexColor={this.toTextboxHexColor(props.focus.stroke.color)}
            onHexColorInput={(e) =>
              this.onStrokeColorChange(e.currentTarget.value)
            }
            onOpacityNumericValueInput={(value) =>
              this.onStrokeOpacityChange(value)
            }
            opacity={props.focus.stroke.opacity.toString()}
          />
        </div>

        <div
          class={
            props.focus.stroke.align === "OUTSIDE"
              ? styles.strokeSecondaryControlsWithGap
              : styles.strokeSecondaryControls
          }
        >
          <div>
            <Dropdown
              onChange={(e) =>
                this.onStrokeAlignChange(e.currentTarget.value as StrokeAlign)
              }
              options={STROKE_ALIGN_OPTIONS}
              value={props.focus.stroke.align}
            />
          </div>

          <div class={styles.strokeWeightControl}>
            <FocusNumberInput
              icon={<IconStrokeWeight24 />}
              minimum={0}
              onNumberInput={(value) =>
                this.onStrokeNumberChange("weight", value)
              }
              incrementLarge={2}
              incrementSmall={1}
              placeholder="Thickness"
              value={props.focus.stroke.weight}
            />
          </div>

          {props.focus.stroke.align === "OUTSIDE" && (
            <div class={styles.strokeWeightControl}>
              <FocusNumberInput
                icon={
                  <IconAutoLayoutSpacingHorizontal24
                    class={styles.strokeGapIcon}
                  />
                }
                minimum={0}
                onNumberInput={(value) =>
                  this.onStrokeNumberChange("gap", value)
                }
                incrementLarge={2}
                incrementSmall={1}
                placeholder="Gap"
                value={props.focus.stroke.gap}
              />
            </div>
          )}
        </div>

        <div class={styles.strokeGlowControl}>
          <Checkbox
            onChange={(e) =>
              this.onStrokeAddGlowChange(e.currentTarget.checked)
            }
            value={props.focus.stroke.addGlow}
          >
            <Text>Add glow</Text>
          </Checkbox>
        </div>
      </div>
    );
  }

  renderFillControls(props: NavigationFocusOptionsProps) {
    return (
      <div class={styles.variantFocusControls}>
        <TextboxColor
          fullWidth
          hexColor={this.toTextboxHexColor(props.focus.fill.color)}
          onHexColorInput={(e) => this.onFillColorChange(e.currentTarget.value)}
          onOpacityNumericValueInput={(value) =>
            this.onFillOpacityChange(value)
          }
          opacity={props.focus.fill.opacity.toString()}
        />
      </div>
    );
  }

  renderScaleShadowControls(props: NavigationFocusOptionsProps) {
    return (
      <div class={styles.variantFocusControls}>
        <div class={styles.scaleControls}>
          <div class={styles.scaleControl}>
            <FocusNumberInput
              icon={<IconScaleSmall24 />}
              minimum={0.01}
              onNumberInput={(value) =>
                this.onScaleShadowNumberChange("scale", value)
              }
              incrementLarge={0.1}
              incrementSmall={0.01}
              placeholder="Scale"
              suffix="x"
              value={props.focus.scaleShadow.scale}
            />
          </div>

          <div class={styles.scaleShadowToggle}>
            <Checkbox
              onChange={(e) =>
                this.onScaleShadowShowShadowChange(e.currentTarget.checked)
              }
              value={props.focus.scaleShadow.showShadow}
            >
              <Text>Add shadow</Text>
            </Checkbox>
          </div>
        </div>
      </div>
    );
  }

  renderFocusModeControls(props: NavigationFocusOptionsProps) {
    if (props.focus.mode === NavigationFocusMode.VARIANT)
      return this.renderVariantControls(props);
    if (props.focus.mode === NavigationFocusMode.SCALE_SHADOW)
      return this.renderScaleShadowControls(props);
    if (props.focus.mode === NavigationFocusMode.FILL)
      return this.renderFillControls(props);
    if (props.focus.mode === NavigationFocusMode.POINTER)
      return this.renderPointerControls(props);
    return this.renderStrokeControls(props);
  }

  renderFocusModeRow(props: NavigationFocusOptionsProps) {
    return (
      <div class={styles.focusModeRow}>
        <div class={styles.focusModeSelect}>
          <Dropdown
            onChange={(e) =>
              this.onModeChange(e.currentTarget.value as NavigationFocusMode)
            }
            options={MODE_OPTIONS}
            value={props.focus.mode}
          />
        </div>
      </div>
    );
  }

  renderPointerControls(props: NavigationFocusOptionsProps) {
    const pointer = this.getPointer(props);
    return (
      <div class={styles.pointerControls}>
        <div class={styles.pointerPanel}>
          <div class={styles.pointerLayout}>
            <div class={styles.pointerLeftColumn}>
              {this.renderPointerAssetControls(pointer)}
            </div>
            {this.renderPointerPositionControls(pointer)}
          </div>
          <div class={styles.textTertiary}>{POINTER_UPLOAD_NOTE}</div>
          {this.state.pointerUploadError.length > 0 && (
            <text class={styles.errorText}>{this.state.pointerUploadError}</text>
          )}
        </div>
      </div>
    );
  }

  renderPointerAssetControls(pointer: PointerFocusConfig) {
    return (
      <div class={styles.pointerControlGroup}>
        <div class={styles.pointerAssetGrid}>
          {POINTER_PRESETS.map((asset) => (
            <button
              class={`${styles.pointerAssetButton} ${
                pointer.assetSource === "preset" &&
                pointer.presetId === asset.id
                  ? styles.pointerAssetButtonSelected
                  : ""
              }`}
              onClick={() => this.onPointerPresetSelect(asset.id)}
              title={asset.label}
              type="button"
            >
              <img
                alt={asset.label}
                class={styles.pointerAssetPreview}
                src={getPointerPresetDataUrl(asset.id)}
              />
            </button>
          ))}

          {this.state.customPointerAsset && (
            <button
              class={`${styles.pointerAssetButton} ${styles.pointerCustomAssetButton} ${
                pointer.assetSource === "custom"
                  ? styles.pointerAssetButtonSelected
                  : ""
              }`}
              onClick={() => this.onCustomPointerSelect()}
              title={this.state.customPointerAsset.metadata.name}
              type="button"
            >
              <img
                alt="Custom pointer"
                class={styles.pointerAssetPreview}
                src={this.state.customPointerDataUrl}
              />
              <span
                class={styles.pointerAssetRemoveButton}
                onClick={(event) => this.onCustomPointerRemove(event)}
                onPointerDown={(event) => event.stopPropagation()}
                title="Remove custom pointer"
              >
                x
              </span>
            </button>
          )}

          <div class={styles.pointerUploadButton}>
            <IconButton
              onClick={() => this.onPointerUploadClick()}
              title="Upload pointer image"
            >
              <IconPlus24 />
            </IconButton>
            <input
              accept="image/png,image/gif"
              class={styles.pointerUploadInput}
              onChange={this.onPointerUploadInputChange}
              ref={(element) => {
                this.pointerUploadInput = element;
              }}
              type="file"
            />
          </div>
        </div>

        <div class={styles.pointerSizeControl}>
          <FocusNumberInput
            icon={<IconExpand24 />}
            minimum={1}
            maximum={1024}
            onNumberInput={(value) => this.onPointerSizeChange(value)}
            incrementLarge={16}
            incrementSmall={1}
            placeholder="Size"
            suffix="px"
            value={getPointerSize(pointer)}
          />
        </div>
      </div>
    );
  }

  renderPointerPositionControls(pointer: PointerFocusConfig) {
    const position = getPointerPosition(pointer);
    const previewSrc =
      pointer.assetSource === "custom" && this.state.customPointerDataUrl
        ? this.state.customPointerDataUrl
        : getPointerPresetDataUrl(pointer.presetId);
    return (
      <div
        class={styles.pointerPositionPad}
        onMouseLeave={this.onPointerPositionLeave}
        onPointerCancel={this.onPointerPositionLeave}
        onPointerDown={this.onPointerPositionInput}
        onPointerLeave={this.onPointerPositionLeave}
        onPointerMove={this.onPointerPositionHover}
      >
        {POINTER_POSITION_OPTIONS.map((option) =>
          this.renderPointerPositionPresetButton(option, pointer),
        )}
        {this.state.pointerPositionIsHovering &&
          this.state.pointerPositionHover &&
          !this.state.pointerPositionHoverPreset && (
            <img
              alt=""
              class={styles.pointerPositionHoverPreview}
              src={previewSrc}
              style={this.getPointerPadPixelStyle(this.state.pointerPositionHover)}
            />
        )}
        {this.state.pointerPositionIsHovering &&
          this.state.pointerPositionHoverPreset &&
          this.state.pointerPositionHoverPreset !== pointer.positionPreset && (
          <img
            alt=""
            class={styles.pointerPositionHoverPreview}
            src={previewSrc}
            style={this.getPointerPadStyle(
              POINTER_POSITION_PRESETS[this.state.pointerPositionHoverPreset],
            )}
          />
          )}
        <img
          alt="Pointer position"
          class={styles.pointerPositionPreview}
          src={previewSrc}
          style={this.getPointerPadStyle(position)}
        />
      </div>
    );
  }

  renderPointerPositionPresetButton(
    option: {
      readonly value: Exclude<PointerPositionPreset, "custom">;
      readonly title: string;
    },
    pointer: PointerFocusConfig,
  ) {
    return (
      <button
        class={this.getPointerPositionPresetClass(option.value, pointer)}
        onClick={(event) => {
          event.stopPropagation();
          this.onPointerPositionPresetChange(option.value);
        }}
        onPointerDown={(event) => event.stopPropagation()}
        title={option.title}
        type="button"
      >
        <span class={styles.pointerPositionDot} />
      </button>
    );
  }

  getPointerPositionPresetClass(
    value: Exclude<PointerPositionPreset, "custom">,
    pointer: PointerFocusConfig,
  ): string {
    const isPlacedPreset =
      pointer.positionPreset !== "custom" && pointer.positionPreset === value;
    const isHoverPreset = this.state.pointerPositionHoverPreset === value;
    const positionClass =
      value === "top-left"
        ? styles.pointerPositionPresetTopLeft
        : value === "top"
          ? styles.pointerPositionPresetTop
          : value === "top-right"
            ? styles.pointerPositionPresetTopRight
            : value === "left"
              ? styles.pointerPositionPresetLeft
              : value === "center"
                ? styles.pointerPositionPresetCenter
                : value === "right"
                  ? styles.pointerPositionPresetRight
                  : value === "bottom-left"
                    ? styles.pointerPositionPresetBottomLeft
                    : value === "bottom"
                    ? styles.pointerPositionPresetBottom
                    : styles.pointerPositionPresetBottomRight;
    return `${styles.pointerPositionPreset} ${positionClass} ${
      isPlacedPreset || isHoverPreset ? styles.pointerPositionPresetHidden : ""
    }`;
  }

  getPointerPadStyle(position: { readonly x: number; readonly y: number }): string {
    const pixelPosition = this.getPointerPadPixelPosition(position);
    return this.getPointerPadPixelStyle(pixelPosition);
  }

  getPointerPadPixelStyle(position: { readonly x: number; readonly y: number }): string {
    return `left: ${position.x}px; top: ${position.y}px;`;
  }

  getPointerAnchorPixelPosition(
    positionPreset: Exclude<PointerPositionPreset, "custom">,
  ): { readonly x: number; readonly y: number } {
    return this.getPointerPadPixelPosition(POINTER_POSITION_PRESETS[positionPreset]);
  }

  getPointerPadPixelPosition(position: {
    readonly x: number;
    readonly y: number;
  }): { readonly x: number; readonly y: number } {
    return {
      x: POINTER_PAD_INSET + position.x * POINTER_PAD_TRACK_SIZE,
      y: POINTER_PAD_INSET + position.y * POINTER_PAD_TRACK_SIZE,
    };
  }

  render(props: NavigationFocusOptionsProps, _state) {
    return (
      <div style={props.style ? props.style : ""}>
        <Text class={styles.sectionHeading}>
          <Bold>Show navigation focus with</Bold>
        </Text>

        <VerticalSpace space="small" />

        {this.renderFocusModeRow(props)}

        <div
          style={
            props.focus.mode === NavigationFocusMode.VARIANT
              ? "height: 12px"
              : "height: 8px"
          }
        />

        {this.renderFocusModeControls(props)}
      </div>
    );
  }
}

interface NavigationFocusOptionsProps {
  focus: NavigationFocusConfig;
  onComponentMappingAdd: () => void;
  onNavigationFocusChange: (focus: NavigationFocusConfig) => void;
  showPropertyError: boolean;
  showToVariantError: boolean;
  style?: string;
}

interface FocusNumberInputProps {
  icon?: JSX.Element;
  incrementLarge: number;
  incrementSmall: number;
  maximum?: number;
  minimum: number;
  onNumberInput: (value: number) => void;
  placeholder: string;
  suffix?: string;
  value: number;
}

function pointerAssetToDataUrl(asset: PointerAssetPayload): string {
  return `data:${asset.metadata.mimeType};base64,${bytesToBase64(asset.bytes)}`;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}
