import {
  Bold,
  Checkbox,
  Dropdown,
  DropdownOption,
  IconScaleSmall24,
  IconStrokeWeight24,
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
  ScaleShadowFocusConfig,
  StrokeAlign,
  StrokeFocusConfig,
} from "../navigation_focus";
import { SwapVariant } from "../swap_variant";
import { ArrowRightIcon } from "../icons/arrow_right";
import styles from "../styles.css";

type StrokeNumberKey = "weight";
type ScaleShadowNumberKey = "scale";

const MODE_OPTIONS: Array<DropdownOption> = [
  { value: NavigationFocusMode.STROKE, text: "Stroke" },
  { value: NavigationFocusMode.SCALE_SHADOW, text: "Scale" },
  { value: NavigationFocusMode.VARIANT, text: "Custom" },
];

const STROKE_ALIGN_OPTIONS: Array<DropdownOption> = [
  { value: "CENTER", text: "Center" },
  { value: "INSIDE", text: "Inside" },
  { value: "OUTSIDE", text: "Outside" },
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

  renderVariantControls(props: NavigationFocusOptionsProps) {
    return (
      <div class={styles.variantFocusControls}>
        <Text>
          Enter the variant property and the values to use for the default and
          focused states of your UI components.
        </Text>

        <Textbox
          onInput={(e) => this.onVariantPropertyChange(e.currentTarget.value)}
          placeholder="Component property e.g. Focus"
          value={props.focus.variant.property}
        />

        {props.showPropertyError && (
          <div style="margin-top: 2px; margin-bottom: 8px; margin-left: 8px">
            <text class={styles.errorText}>Property name required</text>
          </div>
        )}

        <div class={styles.variantValueRow}>
          <Textbox
            style={"flex-grow: 1; min-width: 0;"}
            onInput={(e) => this.onVariantFromChange(e.currentTarget.value)}
            placeholder="Default value"
            value={props.focus.variant.from}
          />

          <div class={styles.variantValueArrow}>
            <ArrowRightIcon class={styles.greyIcon} />
          </div>

          <Textbox
            style={"flex-grow: 1; min-width: 0;"}
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
      <div class={styles.strokeControls}>
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
          <TextboxNumeric
            icon={<IconStrokeWeight24 />}
            minimum={0}
            onNumericValueInput={(value) =>
              this.onStrokeNumberChange("weight", value)
            }
            value={props.focus.stroke.weight.toString()}
          />
        </div>
      </div>
    );
  }

  renderScaleShadowControls(props: NavigationFocusOptionsProps) {
    return (
      <div>
        <div>
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
    );
  }

  renderFocusModeControls(props: NavigationFocusOptionsProps) {
    if (props.focus.mode === NavigationFocusMode.VARIANT)
      return this.renderVariantControls(props);
    if (props.focus.mode === NavigationFocusMode.SCALE_SHADOW)
      return this.renderScaleShadowControls(props);
    return this.renderStrokeControls(props);
  }

  renderFocusModeInlineControl(props: NavigationFocusOptionsProps) {
    if (props.focus.mode === NavigationFocusMode.STROKE) {
      return (
        <div class={styles.focusModeInlineControl}>
          <TextboxColor
            fullWidth
            hexColor={this.toTextboxHexColor(props.focus.stroke.color)}
            onHexColorInput={(e) =>
              this.onStrokeColorChange(e.currentTarget.value)
            }
            opacity="100"
          />
        </div>
      );
    }
    if (props.focus.mode === NavigationFocusMode.SCALE_SHADOW) {
      return (
        <div class={styles.focusModeInlineControl}>
          <TextboxNumeric
            icon={<IconScaleSmall24 />}
            integer={false}
            minimum={0.01}
            onNumericValueInput={(value) =>
              this.onScaleShadowNumberChange("scale", value)
            }
            suffix="x"
            value={props.focus.scaleShadow.scale.toString()}
          />
        </div>
      );
    }
    return null;
  }

  renderFocusModeRow(props: NavigationFocusOptionsProps) {
    const inlineControl = this.renderFocusModeInlineControl(props);
    return (
      <div class={inlineControl ? styles.focusModeRow : ""}>
        <div class={inlineControl ? styles.focusModeSelect : ""}>
          <Dropdown
            onChange={(e) =>
              this.onModeChange(e.currentTarget.value as NavigationFocusMode)
            }
            options={MODE_OPTIONS}
            value={props.focus.mode}
          />
        </div>
        {inlineControl}
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
