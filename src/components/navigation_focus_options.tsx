import {
  Bold,
  Dropdown,
  DropdownOption,
  Text,
  Textbox,
  TextboxColor,
  TextboxNumeric,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { Component, h } from "preact";
import {
  NavigationFocusConfig,
  NavigationFocusMode,
  ShadowFocusConfig,
  StrokeFocusConfig,
} from "../navigation_focus";
import { SwapVariant } from "../swap_variant";
import { ArrowRightIcon } from "../icons/arrow_right";
import styles from "../styles.css";

type StrokeNumberKey = "weight" | "padding" | "cornerRadius";
type ShadowNumberKey = "blur" | "spread" | "padding" | "cornerRadius";

const MODE_OPTIONS: Array<DropdownOption> = [
  { value: NavigationFocusMode.STROKE, text: "Stroke" },
  { value: NavigationFocusMode.SHADOW, text: "Shadow" },
  { value: NavigationFocusMode.VARIANT, text: "Swap variant" },
];

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
    this.onVariantPropertyChange = this.onVariantPropertyChange.bind(this);
    this.onVariantFromChange = this.onVariantFromChange.bind(this);
    this.onVariantToChange = this.onVariantToChange.bind(this);
    this.onStrokeColorChange = this.onStrokeColorChange.bind(this);
    this.onShadowColorChange = this.onShadowColorChange.bind(this);
  }

  onModeChange(mode: NavigationFocusMode) {
    this.props.onNavigationFocusChange({
      ...this.props.focus,
      mode: mode,
    });
  }

  onVariantPropertyChange(property: string) {
    this.updateVariant({
      ...this.props.focus.variant,
      property: property,
    });
  }

  onVariantFromChange(from: string) {
    this.updateVariant({
      ...this.props.focus.variant,
      from: from,
    });
  }

  onVariantToChange(to: string) {
    this.updateVariant({
      ...this.props.focus.variant,
      to: to,
    });
  }

  updateVariant(variant: SwapVariant) {
    this.props.onNavigationFocusChange({
      ...this.props.focus,
      variant: variant,
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

  updateStroke(stroke: StrokeFocusConfig) {
    this.props.onNavigationFocusChange({
      ...this.props.focus,
      stroke: stroke,
    });
  }

  onShadowColorChange(color: string) {
    this.updateShadow({
      ...this.props.focus.shadow,
      color: this.toStoredHexColor(color),
    });
  }

  onShadowNumberChange(key: ShadowNumberKey, value: null | number) {
    this.updateShadow({
      ...this.props.focus.shadow,
      [key]: this.toFocusNumber(value, this.props.focus.shadow[key]),
    });
  }

  updateShadow(shadow: ShadowFocusConfig) {
    this.props.onNavigationFocusChange({
      ...this.props.focus,
      shadow: shadow,
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

  toFocusNumber(value: null | number, fallback: number): number {
    if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
    return Math.max(0, value);
  }

  renderVariantControls(props: NavigationFocusOptionsProps) {
    return (
      <div>
        <Textbox
          onInput={(e) => this.onVariantPropertyChange(e.currentTarget.value)}
          placeholder="Focus component property name"
          value={props.focus.variant.property}
        />

        {props.showPropertyError && (
          <div style="margin-top: 2px; margin-bottom: 8px; margin-left: 8px">
            <text class={styles.errorText}>Property name required</text>
          </div>
        )}

        <div style="height: 4px" />

        <div style="display: flex; align-items:center">
          <Textbox
            style={"flex-grow: 1;"}
            onInput={(e) => this.onVariantFromChange(e.currentTarget.value)}
            placeholder="Unfocused value"
            value={props.focus.variant.from}
          />

          <div style="padding-left: 2px; padding-right: 2px;">
            <ArrowRightIcon class={styles.greyIcon} />
          </div>

          <Textbox
            style={"flex-grow: 1;"}
            onInput={(e) => this.onVariantToChange(e.currentTarget.value)}
            placeholder="Focused value"
            value={props.focus.variant.to}
          />
        </div>

        {props.showToVariantError && (
          <div style="margin-top: 2px; margin-bottom: 8px; margin-left: 8px">
            <text class={styles.errorText}>Property values required</text>
          </div>
        )}
      </div>
    );
  }

  renderStrokeControls(props: NavigationFocusOptionsProps) {
    return (
      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px;">
        <div style="grid-column: 1 / -1;">
          <Text>Color</Text>
          <TextboxColor
            fullWidth
            hexColor={this.toTextboxHexColor(props.focus.stroke.color)}
            onHexColorInput={(e) =>
              this.onStrokeColorChange(e.currentTarget.value)
            }
            opacity="100"
          />
        </div>

        {this.renderNumericControl(
          "Weight",
          props.focus.stroke.weight,
          (value) => this.onStrokeNumberChange("weight", value),
        )}
        {this.renderNumericControl(
          "Padding",
          props.focus.stroke.padding,
          (value) => this.onStrokeNumberChange("padding", value),
        )}
        {this.renderNumericControl(
          "Corner radius",
          props.focus.stroke.cornerRadius,
          (value) => this.onStrokeNumberChange("cornerRadius", value),
        )}
      </div>
    );
  }

  renderShadowControls(props: NavigationFocusOptionsProps) {
    return (
      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px;">
        <div style="grid-column: 1 / -1;">
          <Text>Color</Text>
          <TextboxColor
            fullWidth
            hexColor={this.toTextboxHexColor(props.focus.shadow.color)}
            onHexColorInput={(e) =>
              this.onShadowColorChange(e.currentTarget.value)
            }
            opacity="100"
          />
        </div>

        {this.renderNumericControl("Blur", props.focus.shadow.blur, (value) =>
          this.onShadowNumberChange("blur", value),
        )}
        {this.renderNumericControl(
          "Spread",
          props.focus.shadow.spread,
          (value) => this.onShadowNumberChange("spread", value),
        )}
        {this.renderNumericControl(
          "Padding",
          props.focus.shadow.padding,
          (value) => this.onShadowNumberChange("padding", value),
        )}
        {this.renderNumericControl(
          "Corner radius",
          props.focus.shadow.cornerRadius,
          (value) => this.onShadowNumberChange("cornerRadius", value),
        )}
      </div>
    );
  }

  renderNumericControl(
    label: string,
    value: number,
    onChange: (value: null | number) => void,
  ) {
    return (
      <div>
        <Text>{label}</Text>
        <TextboxNumeric
          integer
          minimum={0}
          onNumericValueInput={onChange}
          value={value.toString()}
        />
      </div>
    );
  }

  renderFocusModeControls(props: NavigationFocusOptionsProps) {
    if (props.focus.mode === NavigationFocusMode.VARIANT)
      return this.renderVariantControls(props);
    if (props.focus.mode === NavigationFocusMode.SHADOW)
      return this.renderShadowControls(props);
    return this.renderStrokeControls(props);
  }

  render(props: NavigationFocusOptionsProps, _state) {
    return (
      <div style={props.style ? props.style : ""}>
        <Text style={"margin-left: 8px"}>
          <Bold>Navigation Focus</Bold>
        </Text>

        <VerticalSpace space="small" />

        <Dropdown
          onChange={(e) =>
            this.onModeChange(e.currentTarget.value as NavigationFocusMode)
          }
          options={MODE_OPTIONS}
          value={props.focus.mode}
        />

        <div style="height: 8px" />

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
