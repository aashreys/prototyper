import {
  Bold,
  Checkbox,
  Dropdown,
  DropdownOption,
  IconButton,
  IconMinusSmall24,
  IconPlusSmall24,
  IconScaleSmall24,
  IconAutoLayoutSpacingHorizontal24,
  IconStrokeWeight24,
  Text,
  Textbox,
  TextboxColor,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { Component, h, JSX } from "preact";
import { useEffect, useState } from "preact/hooks";
import {
  ComponentFocusMapping,
  ComponentFocusPropertyType,
  DEFAULT_COMPONENT_FOCUS_MAPPING,
  DEFAULT_VARIANT_FOCUS,
  FillFocusConfig,
  getComponentFocusMappings,
  NavigationFocusConfig,
  NavigationFocusMode,
  ScaleShadowFocusConfig,
  StrokeAlign,
  StrokeFocusConfig,
} from "../navigation_focus";
import { SwapVariant } from "../swap_variant";
import { ArrowRightIcon } from "../icons/arrow_right";
import styles from "../styles.css";

type StrokeNumberKey = "weight" | "gap";
type ScaleShadowNumberKey = "scale";

const DECIMAL_INPUT_PATTERN = /^\d*(?:\.\d*)?$/;
const DECIMAL_WITH_X_PATTERN = /^(?:\d+|\d+\.\d+|\.\d+)x$/i;

const MODE_OPTIONS: Array<DropdownOption> = [
  { value: NavigationFocusMode.STROKE, text: "Stroke" },
  { value: NavigationFocusMode.FILL, text: "Fill" },
  { value: NavigationFocusMode.SCALE_SHADOW, text: "Scale" },
  { value: NavigationFocusMode.VARIANT, text: "Existing components" },
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

const HELPER_TEXT = {
  stroke: "Add a stroke to show focus. Works with any layer.",
  fill: "Add a fill to show focus. Best for layers with no or unobscured fills.",
  scale: "Change scale to show focus e.g. tvOS. Works with any layer.",
  component: "Modify component properties to show focus.",
};

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
      placeholder={props.placeholder}
      validateOnBlur={validateOnBlur}
      value={value}
    />
  );
}

function isAllowedNumericInput(value: string, suffix?: string): boolean {
  const normalizedValue = value.trim();
  if (suffix === "x") {
    if (normalizedValue.endsWith("x") || normalizedValue.endsWith("X")) {
      return DECIMAL_WITH_X_PATTERN.test(normalizedValue);
    }
    return DECIMAL_INPUT_PATTERN.test(normalizedValue);
  }
  return DECIMAL_INPUT_PATTERN.test(normalizedValue);
}

function parseNumericInputValue(value: string, suffix?: string): null | number {
  let normalizedValue = value.trim();
  if (suffix === "x") normalizedValue = normalizedValue.replace(/x$/i, "");
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

function formatNumericInputValue(props: {
  suffix?: string;
  value: number;
}): string {
  return `${props.value.toString()}${props.suffix || ""}`;
}

export class NavigationFocusOptions extends Component<
  NavigationFocusOptionsProps,
  any
> {
  constructor(props) {
    super(props);
    this.bindMethods();
  }

  bindMethods() {
    this.onModeChange = this.onModeChange.bind(this);
    this.onStrokeColorChange = this.onStrokeColorChange.bind(this);
    this.onFillColorChange = this.onFillColorChange.bind(this);
  }

  onModeChange(mode: NavigationFocusMode) {
    this.props.onNavigationFocusChange({
      ...this.props.focus,
      mode: mode,
    });
  }

  onStrokeColorChange(color: string) {
    this.updateStroke({
      ...this.props.focus.stroke,
      color: this.toStoredHexColor(color),
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
    return (
      <div class={styles.variantFocusControls}>
        <div class={styles.componentMappingHeader}>
          <div class={styles.helperText}>{HELPER_TEXT.component}</div>
          <IconButton onClick={() => this.addMapping()} title="Add mapping">
            <IconPlusSmall24 />
          </IconButton>
        </div>

        <div class={styles.componentMappings}>
          {this.getComponentMappings(props).map((mapping, index) =>
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

          <IconButton
            onClick={() => this.removeMapping(index)}
            title="Remove mapping"
          >
            <IconMinusSmall24 />
          </IconButton>
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
        <div class={styles.helperText}>{HELPER_TEXT.stroke}</div>

        <div>
          <TextboxColor
            fullWidth
            hexColor={this.toTextboxHexColor(props.focus.stroke.color)}
            onHexColorInput={(e) =>
              this.onStrokeColorChange(e.currentTarget.value)
            }
            opacity="100"
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
                placeholder="Gap"
                value={props.focus.stroke.gap}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  renderFillControls(props: NavigationFocusOptionsProps) {
    return (
      <div class={styles.variantFocusControls}>
        <div class={styles.helperText}>{HELPER_TEXT.fill}</div>

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
        <div class={styles.helperText}>{HELPER_TEXT.scale}</div>

        <div class={styles.scaleControls}>
          <div class={styles.scaleControl}>
            <FocusNumberInput
              icon={<IconScaleSmall24 />}
              minimum={0.01}
              onNumberInput={(value) =>
                this.onScaleShadowNumberChange("scale", value)
              }
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
    return this.renderStrokeControls(props);
  }

  renderFocusModeRow(props: NavigationFocusOptionsProps) {
    return (
      <div class={styles.focusModeRow}>
        <div class={styles.focusModeLabel}>
          <Text>Display focus with:</Text>
        </div>
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

  render(props: NavigationFocusOptionsProps, _state) {
    return (
      <div style={props.style ? props.style : ""}>
        <Text class={styles.sectionHeading}>
          <Bold>Navigation Focus</Bold>
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
  onNavigationFocusChange: (focus: NavigationFocusConfig) => void;
  showPropertyError: boolean;
  showToVariantError: boolean;
  style?: string;
}

interface FocusNumberInputProps {
  icon?: JSX.Element;
  minimum: number;
  onNumberInput: (value: number) => void;
  placeholder: string;
  suffix?: string;
  value: number;
}
