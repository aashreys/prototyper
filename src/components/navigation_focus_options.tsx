import {
  Bold,
  Button,
  Checkbox,
  Dropdown,
  DropdownOption,
  IconClose24,
  IconExpand24,
  IconButton,
  IconMinusSmall24,
  IconPlus24,
  IconPlusSmall24,
  IconScaleSmall24,
  IconSettings24,
  IconAutoLayoutSpacingHorizontal24,
  IconStrokeWeight24,
  IconTrash24,
  Modal,
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
  DEFAULT_POINTER_HOTSPOT,
  DEFAULT_COMPONENT_FOCUS_MAPPING,
  DEFAULT_POINTER_FOCUS,
  DEFAULT_VARIANT_FOCUS,
  FillFocusConfig,
  getComponentFocusMappings,
  getPointerHotspot,
  getPointerPosition,
  getPointerSize,
  NavigationFocusConfig,
  NavigationFocusMode,
  POINTER_POSITION_PRESETS,
  PointerAdditionalFocusMode,
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
  PointerAssetPayload,
} from "../pointer_asset_validation";
import {
  createStoredCustomPointerAsset,
  CustomPointerAsset,
  MAX_CUSTOM_POINTER_ASSETS,
  normalizeCustomPointerAssets,
} from "../pointer_asset_storage";
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
  { value: NavigationFocusMode.POINTER, text: "Pointer" },
  { value: NavigationFocusMode.VARIANT, text: "Components" },
];

const POINTER_ADDITIONAL_FOCUS_MODE_OPTIONS: Array<DropdownOption> = [
  { value: NavigationFocusMode.STROKE, text: "Stroke" },
  { value: NavigationFocusMode.FILL, text: "Fill" },
  { value: NavigationFocusMode.SCALE_SHADOW, text: "Scale" },
  { value: NavigationFocusMode.VARIANT, text: "Components" },
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
const POINTER_LAYER_INSET_X = 18;
const POINTER_LAYER_INSET_Y = 24;
const POINTER_LAYER_WIDTH = 64;
const POINTER_LAYER_HEIGHT = 52;
const POINTER_ANCHOR_INSET = 12;
const POINTER_ANCHOR_LEFT = POINTER_ANCHOR_INSET;
const POINTER_ANCHOR_CENTER_X = POINTER_LAYER_WIDTH / 2;
const POINTER_ANCHOR_RIGHT = POINTER_LAYER_WIDTH - POINTER_ANCHOR_INSET;
const POINTER_ANCHOR_TOP = POINTER_ANCHOR_INSET;
const POINTER_ANCHOR_CENTER_Y = POINTER_LAYER_HEIGHT / 2;
const POINTER_ANCHOR_BOTTOM = POINTER_LAYER_HEIGHT - POINTER_ANCHOR_INSET;
const POINTER_ANCHOR_HIT_RADIUS = 6.5;
const POINTER_PREVIEW_REFERENCE_SIZE = 100;
const POINTER_PREVIEW_MIN_SIZE = 12;
const POINTER_PREVIEW_MAX_SIZE = 72;
const POINTER_UPLOAD_RULES = "PNG or GIF, max 1024 x 1024 px, max 5 MB";

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

function getPointerAnchorCoordinate(
  position: number,
  start: number,
  center: number,
  end: number,
): number {
  if (position === 0) return start;
  if (position === 1) return end;
  return center;
}

export class NavigationFocusOptions extends Component<
  NavigationFocusOptionsProps,
  any
> {
  pointerDialogUploadInput: HTMLInputElement | null = null;

  constructor(props) {
    super(props);
    this.state = {
      customPointerAssets: [],
      customPointerDataUrls: {},
      pointerDialogAsset: undefined,
      pointerDialogDragActive: false,
      pointerDialogError: "",
      pointerDialogHotspot: { ...DEFAULT_POINTER_HOTSPOT },
      pointerDialogMode: "closed",
      pointerDialogPendingAction: undefined,
      pointerDialogPendingAssetId: undefined,
      pointerDialogSaving: false,
      pointerPositionHover: undefined,
      pointerPositionIsHovering: false,
      pointerPositionHoverPreset: undefined,
    };
    this.bindMethods();
    this.registerEventListeners();
  }

  bindMethods() {
    this.onModeChange = this.onModeChange.bind(this);
    this.onStrokeColorChange = this.onStrokeColorChange.bind(this);
    this.onFillColorChange = this.onFillColorChange.bind(this);
    this.onPointerAssetSelected = this.onPointerAssetSelected.bind(this);
    this.onPointerDialogClose = this.onPointerDialogClose.bind(this);
    this.onPointerDialogDelete = this.onPointerDialogDelete.bind(this);
    this.onPointerDialogDrop = this.onPointerDialogDrop.bind(this);
    this.onPointerDialogDragOver = this.onPointerDialogDragOver.bind(this);
    this.onPointerDialogDragLeave = this.onPointerDialogDragLeave.bind(this);
    this.onPointerDialogHotspotInput = this.onPointerDialogHotspotInput.bind(this);
    this.onPointerDialogSave = this.onPointerDialogSave.bind(this);
    this.onPointerAdditionalFocusEnabledChange =
      this.onPointerAdditionalFocusEnabledChange.bind(this);
    this.onPointerAdditionalFocusModeChange =
      this.onPointerAdditionalFocusModeChange.bind(this);
    this.onPointerUploadClick = this.onPointerUploadClick.bind(this);
    this.onPointerUploadInputChange = this.onPointerUploadInputChange.bind(this);
    this.onPointerPositionInput = this.onPointerPositionInput.bind(this);
    this.onPointerPositionHover = this.onPointerPositionHover.bind(this);
    this.onPointerPositionLeave = this.onPointerPositionLeave.bind(this);
    this.registerEventListeners = this.registerEventListeners.bind(this);
  }

  registerEventListeners() {
    on(Constants.EVENT_RECEIVE_POINTER_ASSET, (assets) => {
      const normalizedAssets = normalizeCustomPointerAssets(assets);
      const pendingAction = this.state.pointerDialogPendingAction;
      const pendingAssetId = this.state.pointerDialogPendingAssetId;
      this.setState({
        customPointerAssets: normalizedAssets,
        customPointerDataUrls: pointerAssetsToDataUrls(normalizedAssets),
        pointerDialogError: "",
      });
      this.syncSelectedCustomPointer(normalizedAssets);
      if (pendingAction === "save") {
        const savedAsset = normalizedAssets.find(asset => asset.id === pendingAssetId);
        if (savedAsset) {
          this.selectCustomPointer(savedAsset);
          this.closePointerDialog();
        }
      }
      if (pendingAction === "delete") {
        const deletedAssetExists = normalizedAssets.some(asset => asset.id === pendingAssetId);
        if (!deletedAssetExists) {
          if (this.getPointer().assetSource === "custom" && this.getPointer().customAssetId === pendingAssetId) {
            this.onPointerPresetSelect(DEFAULT_POINTER_FOCUS.presetId);
          }
          this.closePointerDialog();
        }
      }
    });

    on(Constants.EVENT_POINTER_ASSET_ERROR, (message) => {
      this.setState({
        pointerDialogError:
          typeof message === "string" && message.length > 0
            ? message
            : "Could not save pointer image.",
        pointerDialogPendingAction: undefined,
        pointerDialogPendingAssetId: undefined,
        pointerDialogSaving: false,
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

  syncSelectedCustomPointer(assets: Array<CustomPointerAsset>) {
    const pointer = this.getPointer();
    if (pointer.assetSource !== "custom") return;
    if (pointer.customAssetId && assets.some(asset => asset.id === pointer.customAssetId)) {
      return;
    }
    const fallbackAsset = assets[0];
    if (fallbackAsset) {
      this.selectCustomPointer(fallbackAsset);
      return;
    }
    this.onPointerPresetSelect(DEFAULT_POINTER_FOCUS.presetId);
  }

  selectCustomPointer(asset: CustomPointerAsset) {
    this.updatePointer({
      ...this.getPointer(),
      assetSource: "custom",
      customAssetId: asset.id,
      hotspot: asset.hotspot,
    });
  }

  onPointerAdditionalFocusEnabledChange(enabled: boolean) {
    const pointer = this.getPointer();
    this.updatePointer({
      ...pointer,
      additionalFocus: {
        ...this.getPointerAdditionalFocus(pointer),
        enabled: enabled,
      },
    });
  }

  onPointerAdditionalFocusModeChange(mode: PointerAdditionalFocusMode) {
    const pointer = this.getPointer();
    this.updatePointer({
      ...pointer,
      additionalFocus: {
        ...this.getPointerAdditionalFocus(pointer),
        mode: mode,
      },
    });
  }

  onCustomPointerSelect(asset: CustomPointerAsset) {
    this.selectCustomPointer(asset);
  }

  onCustomPointerSettings(event: Event, asset: CustomPointerAsset) {
    event.stopPropagation();
    this.setState({
      pointerDialogAsset: asset,
      pointerDialogError: "",
      pointerDialogHotspot: { ...asset.hotspot },
      pointerDialogMode: "hotspot",
      pointerDialogPendingAction: undefined,
      pointerDialogPendingAssetId: undefined,
      pointerDialogSaving: false,
    });
  }

  onPointerUploadClick() {
    if (this.state.customPointerAssets.length >= MAX_CUSTOM_POINTER_ASSETS) {
      this.setState({
        pointerDialogError: "Delete a custom pointer before adding another.",
        pointerDialogMode: "upload",
      });
      return;
    }
    this.setState({
      pointerDialogAsset: undefined,
      pointerDialogDragActive: false,
      pointerDialogError: "",
      pointerDialogHotspot: { ...DEFAULT_POINTER_HOTSPOT },
      pointerDialogMode: "upload",
      pointerDialogPendingAction: undefined,
      pointerDialogPendingAssetId: undefined,
      pointerDialogSaving: false,
    });
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
    if (this.state.customPointerAssets.length >= MAX_CUSTOM_POINTER_ASSETS) {
      this.setState({
        pointerDialogError: "Delete a custom pointer before adding another.",
      });
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = createPointerAssetPayload(file, bytes);
    if (result.error || !result.payload) {
      this.setState({
        pointerDialogError: result.error || "Could not use pointer image.",
      });
      return;
    }

    const asset = createStoredCustomPointerAsset(result.payload);
    this.setState({
      pointerDialogAsset: asset,
      pointerDialogDragActive: false,
      pointerDialogError: "",
      pointerDialogHotspot: { ...asset.hotspot },
      pointerDialogMode: "hotspot",
    });
  }

  onPointerDialogClose() {
    this.closePointerDialog();
  }

  closePointerDialog() {
    this.setState({
      pointerDialogAsset: undefined,
      pointerDialogDragActive: false,
      pointerDialogError: "",
      pointerDialogHotspot: { ...DEFAULT_POINTER_HOTSPOT },
      pointerDialogMode: "closed",
      pointerDialogPendingAction: undefined,
      pointerDialogPendingAssetId: undefined,
      pointerDialogSaving: false,
    });
  }

  onPointerDialogDragOver(event: DragEvent) {
    event.preventDefault();
    this.setState({ pointerDialogDragActive: true });
  }

  onPointerDialogDragLeave(event: DragEvent) {
    event.preventDefault();
    this.setState({ pointerDialogDragActive: false });
  }

  onPointerDialogDrop(event: DragEvent) {
    event.preventDefault();
    this.setState({ pointerDialogDragActive: false });
    const files = Array.prototype.slice.call(event.dataTransfer?.files || []);
    this.onPointerAssetSelected(files);
  }

  onPointerDialogHotspotInput(event: any) {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const bounds = event.currentTarget.getBoundingClientRect();
    this.setState({
      pointerDialogHotspot: {
        x: roundNumber(clampNumber((event.clientX - bounds.left) / bounds.width, 0, 1)),
        y: roundNumber(clampNumber((event.clientY - bounds.top) / bounds.height, 0, 1)),
      },
    });
  }

  onPointerDialogSave() {
    const asset = this.state.pointerDialogAsset as CustomPointerAsset | undefined;
    if (!asset || this.state.pointerDialogSaving) return;
    const hotspot = this.state.pointerDialogHotspot || DEFAULT_POINTER_HOTSPOT;
    const savedAsset = {
      ...asset,
      hotspot: hotspot,
    };
    this.setState({
      pointerDialogAsset: savedAsset,
      pointerDialogError: "",
      pointerDialogHotspot: hotspot,
      pointerDialogPendingAction: "save",
      pointerDialogPendingAssetId: savedAsset.id,
      pointerDialogSaving: true,
    });
    emit(Constants.EVENT_SAVE_POINTER_ASSET, savedAsset);
  }

  onPointerDialogDelete() {
    const asset = this.state.pointerDialogAsset as CustomPointerAsset | undefined;
    if (!asset || this.state.pointerDialogSaving) return;
    this.setState({
      pointerDialogError: "",
      pointerDialogPendingAction: "delete",
      pointerDialogPendingAssetId: asset.id,
      pointerDialogSaving: true,
    });
    emit(Constants.EVENT_DELETE_POINTER_ASSET, asset.id);
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
    const position = this.getPointerPositionFromPadPixel(
      hoverState.pointerPositionHover,
    );
    this.updatePointer({
      ...this.getPointer(),
      positionPreset: "custom",
      position: {
        x: roundNumber(position.x),
        y: roundNumber(position.y),
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
    if (props.focus.mode === NavigationFocusMode.POINTER) {
      return this.renderPointerControls(props);
    }
    return this.renderFocusModeControlsForMode(props, props.focus.mode);
  }

  renderFocusModeControlsForMode(
    props: NavigationFocusOptionsProps,
    mode: NavigationFocusMode,
  ) {
    if (mode === NavigationFocusMode.VARIANT) return this.renderVariantControls(props);
    if (mode === NavigationFocusMode.SCALE_SHADOW)
      return this.renderScaleShadowControls(props);
    if (mode === NavigationFocusMode.FILL) return this.renderFillControls(props);
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
        </div>
        {this.renderPointerAdditionalFocusControls(props, pointer)}
        {this.renderPointerDialog(pointer)}
      </div>
    );
  }

  renderPointerAdditionalFocusControls(
    props: NavigationFocusOptionsProps,
    pointer: PointerFocusConfig,
  ) {
    const additionalFocus = this.getPointerAdditionalFocus(pointer);
    const propsForAdditionalFocus = {
      ...props,
      focus: {
        ...props.focus,
        mode: additionalFocus.mode,
      },
    };
    return (
      <div class={styles.pointerAdditionalFocusControls}>
        <Checkbox
          onChange={(e) =>
            this.onPointerAdditionalFocusEnabledChange(e.currentTarget.checked)
          }
          value={additionalFocus.enabled}
        >
          <Text>Show additional focus over layer</Text>
        </Checkbox>
        {additionalFocus.enabled && (
          <div class={styles.pointerAdditionalFocusContent}>
            <Dropdown
              onChange={(e) =>
                this.onPointerAdditionalFocusModeChange(
                  e.currentTarget.value as PointerAdditionalFocusMode,
                )
              }
              options={POINTER_ADDITIONAL_FOCUS_MODE_OPTIONS}
              value={additionalFocus.mode}
            />
            {this.renderFocusModeControlsForMode(
              propsForAdditionalFocus,
              additionalFocus.mode,
            )}
          </div>
        )}
      </div>
    );
  }

  getPointerAdditionalFocus(pointer: PointerFocusConfig) {
    return pointer.additionalFocus || DEFAULT_POINTER_FOCUS.additionalFocus;
  }

  renderPointerDialog(pointer: PointerFocusConfig) {
    const mode = this.state.pointerDialogMode;
    const isOpen = mode !== "closed";
    return (
      <Modal
        closeButtonIcon={<IconClose24 />}
        closeButtonPosition="right"
        onCloseButtonClick={this.onPointerDialogClose}
        onEscapeKeyDown={this.onPointerDialogClose}
        open={isOpen}
        position="center"
        title={mode === "hotspot" ? "Set cursor hotspot" : "Add cursor"}
      >
        <div class={styles.pointerDialog}>
          {mode === "upload" && this.renderPointerUploadDialog()}
          {mode === "hotspot" && this.renderPointerHotspotDialog(pointer)}
        </div>
      </Modal>
    );
  }

  renderPointerUploadDialog() {
    const isDisabled =
      this.state.customPointerAssets.length >= MAX_CUSTOM_POINTER_ASSETS ||
      this.state.pointerDialogSaving;
    return (
      <div class={styles.pointerDialogContent}>
        <button
          class={`${styles.pointerDropzone} ${
            this.state.pointerDialogDragActive ? styles.pointerDropzoneActive : ""
          }`}
          disabled={isDisabled}
          onClick={() => this.pointerDialogUploadInput?.click()}
          onDragLeave={this.onPointerDialogDragLeave}
          onDragOver={this.onPointerDialogDragOver}
          onDrop={this.onPointerDialogDrop}
          type="button"
        >
          <span class={styles.pointerDropzoneTitle}>Drop cursor file here</span>
          <span class={styles.pointerDropzoneText}>{POINTER_UPLOAD_RULES}</span>
        </button>
        <input
          accept="image/png,image/gif"
          class={styles.pointerUploadInput}
          disabled={isDisabled}
          onChange={this.onPointerUploadInputChange}
          ref={(element) => {
            this.pointerDialogUploadInput = element;
          }}
          type="file"
        />
        {this.state.pointerDialogError.length > 0 && (
          <Text class={styles.errorText}>{this.state.pointerDialogError}</Text>
        )}
        <Button
          disabled={isDisabled}
          fullWidth
          onClick={() => this.pointerDialogUploadInput?.click()}
        >
          Upload
        </Button>
      </div>
    );
  }

  renderPointerHotspotDialog(pointer: PointerFocusConfig) {
    const asset = this.state.pointerDialogAsset as CustomPointerAsset | undefined;
    const hotspot = this.state.pointerDialogHotspot || DEFAULT_POINTER_HOTSPOT;
    const isExisting = Boolean(
      asset &&
      (this.state.customPointerAssets as Array<CustomPointerAsset>).some(
        customAsset => customAsset.id === asset.id,
      ),
    );
    const imageSrc = asset ? this.getCustomPointerDataUrl(asset) : this.getPointerPreviewSource(pointer);
    return (
      <div class={styles.pointerDialogContent}>
        <div
          class={styles.pointerHotspotEditor}
          onPointerDown={this.onPointerDialogHotspotInput}
          onPointerMove={(event) => {
            if (event.buttons === 1) this.onPointerDialogHotspotInput(event);
          }}
        >
          <img
            alt="Custom pointer"
            class={styles.pointerHotspotImage}
            src={imageSrc}
          />
          <span
            class={styles.pointerHotspotMarker}
            style={`left: ${hotspot.x * 100}%; top: ${hotspot.y * 100}%;`}
          />
        </div>
        {this.state.pointerDialogError.length > 0 && (
          <Text class={styles.errorText}>{this.state.pointerDialogError}</Text>
        )}
        <div class={styles.pointerDialogActions}>
          {isExisting && (
            <Button
              danger
              disabled={this.state.pointerDialogSaving}
              onClick={this.onPointerDialogDelete}
              secondary
            >
              <IconTrash24 />
            </Button>
          )}
          <Button
            disabled={!asset || this.state.pointerDialogSaving}
            fullWidth
            loading={this.state.pointerDialogSaving}
            onClick={this.onPointerDialogSave}
          >
            Save
          </Button>
        </div>
      </div>
    );
  }

  renderPointerAssetControls(pointer: PointerFocusConfig) {
    const customAssets = this.state.customPointerAssets as Array<CustomPointerAsset>;
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

          {customAssets.map((asset) => (
            <button
              class={`${styles.pointerAssetButton} ${styles.pointerCustomAssetButton} ${
                pointer.assetSource === "custom" &&
                pointer.customAssetId === asset.id
                  ? styles.pointerAssetButtonSelected
                  : ""
              }`}
              onClick={() => this.onCustomPointerSelect(asset)}
              title={asset.metadata.name}
              type="button"
            >
              <img
                alt="Custom pointer"
                class={styles.pointerAssetPreview}
                src={this.getCustomPointerDataUrl(asset)}
              />
              <span
                class={styles.pointerAssetSettingsButton}
                onClick={(event) => this.onCustomPointerSettings(event, asset)}
                onPointerDown={(event) => event.stopPropagation()}
                title="Edit custom pointer"
              >
                <IconSettings24 />
              </span>
            </button>
          ))}

          {customAssets.length < MAX_CUSTOM_POINTER_ASSETS && (
            <div class={styles.pointerUploadButton}>
            <IconButton
              onClick={() => this.onPointerUploadClick()}
              title="Upload pointer image"
            >
              <IconPlus24 />
            </IconButton>
            </div>
          )}
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
    const previewSrc = this.getPointerPreviewSource(pointer);
    return (
      <div
        class={styles.pointerPositionPad}
        onMouseLeave={this.onPointerPositionLeave}
        onPointerCancel={this.onPointerPositionLeave}
        onPointerDown={this.onPointerPositionInput}
        onPointerLeave={this.onPointerPositionLeave}
        onPointerMove={this.onPointerPositionHover}
      >
        <div class={styles.pointerPositionCenterLineHorizontal} />
        <div class={styles.pointerPositionCenterLineVertical} />
        <div class={styles.pointerPositionLayer} />
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
              style={this.getPointerPreviewImageStyle(
                pointer,
                this.state.pointerPositionHover,
              )}
            />
        )}
        <img
          alt="Pointer position"
          class={styles.pointerPositionPreview}
          src={previewSrc}
          style={this.getPointerPositionPreviewStyle(pointer, position)}
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
        style={this.getPointerPositionPresetStyle(option.value)}
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
    return `${styles.pointerPositionPreset} ${
      isPlacedPreset ? styles.pointerPositionPresetHidden : ""
    } ${isHoverPreset ? styles.pointerPositionPresetHover : ""}`;
  }

  getPointerPositionPresetStyle(
    positionPreset: Exclude<PointerPositionPreset, "custom">,
  ): string {
    const position = this.getPointerAnchorPixelPosition(positionPreset);
    return `left: ${position.x}px; top: ${position.y}px;`;
  }

  getPointerPadPixelStyle(position: { readonly x: number; readonly y: number }): string {
    return `left: ${position.x}px; top: ${position.y}px;`;
  }

  getPointerPositionPreviewStyle(
    pointer: PointerFocusConfig,
    position: { readonly x: number; readonly y: number },
  ): string {
    if (pointer.positionPreset !== "custom") {
      return this.getPointerPreviewImageStyle(
        pointer,
        this.getPointerAnchorPixelPosition(pointer.positionPreset),
      );
    }
    return this.getPointerPreviewImageStyle(
      pointer,
      this.getPointerPadPixelPosition(position),
    );
  }

  getPointerPreviewImageStyle(
    pointer: PointerFocusConfig,
    position: { readonly x: number; readonly y: number },
  ): string {
    const hotspot = this.getPointerPreviewHotspot(pointer);
    const previewSize = this.getPointerPreviewSize(pointer);
    return [
      this.getPointerPadPixelStyle(position),
      `height: ${previewSize}px`,
      `transform: translate(${-hotspot.x * 100}%, ${-hotspot.y * 100}%)`,
      `width: ${previewSize}px`,
    ].join("; ");
  }

  getPointerPreviewSize(pointer: PointerFocusConfig): number {
    return clampNumber(
      (getPointerSize(pointer) / POINTER_PREVIEW_REFERENCE_SIZE) *
        Math.min(POINTER_LAYER_WIDTH, POINTER_LAYER_HEIGHT),
      POINTER_PREVIEW_MIN_SIZE,
      POINTER_PREVIEW_MAX_SIZE,
    );
  }

  getSelectedCustomPointer(pointer: PointerFocusConfig): CustomPointerAsset | undefined {
    const customAssets = this.state.customPointerAssets as Array<CustomPointerAsset>;
    if (pointer.customAssetId) {
      return customAssets.find(asset => asset.id === pointer.customAssetId);
    }
    return customAssets[0];
  }

  getCustomPointerDataUrl(asset: CustomPointerAsset): string {
    const dataUrl = this.state.customPointerDataUrls[asset.id];
    return typeof dataUrl === "string" && dataUrl.length > 0
      ? dataUrl
      : pointerAssetToDataUrl(asset);
  }

  getPointerPreviewSource(pointer: PointerFocusConfig): string {
    if (pointer.assetSource === "custom") {
      const asset = this.getSelectedCustomPointer(pointer);
      if (asset) return this.getCustomPointerDataUrl(asset);
    }
    return getPointerPresetDataUrl(pointer.presetId);
  }

  getPointerPreviewHotspot(pointer: PointerFocusConfig) {
    if (pointer.assetSource === "custom") {
      const asset = this.getSelectedCustomPointer(pointer);
      if (asset) return asset.hotspot;
    }
    return getPointerHotspot(pointer);
  }

  getPointerAnchorPixelPosition(
    positionPreset: Exclude<PointerPositionPreset, "custom">,
  ): { readonly x: number; readonly y: number } {
    const position = this.getPointerAnchorLayerPosition(positionPreset);
    return {
      x: POINTER_LAYER_INSET_X + position.x,
      y: POINTER_LAYER_INSET_Y + position.y,
    };
  }

  getPointerAnchorLayerPosition(
    positionPreset: Exclude<PointerPositionPreset, "custom">,
  ): { readonly x: number; readonly y: number } {
    const position = POINTER_POSITION_PRESETS[positionPreset];
    return {
      x: getPointerAnchorCoordinate(
        position.x,
        POINTER_ANCHOR_LEFT,
        POINTER_ANCHOR_CENTER_X,
        POINTER_ANCHOR_RIGHT,
      ),
      y: getPointerAnchorCoordinate(
        position.y,
        POINTER_ANCHOR_TOP,
        POINTER_ANCHOR_CENTER_Y,
        POINTER_ANCHOR_BOTTOM,
      ),
    };
  }

  getPointerPadPixelPosition(position: {
    readonly x: number;
    readonly y: number;
  }): { readonly x: number; readonly y: number } {
    return {
      x: POINTER_LAYER_INSET_X + position.x * POINTER_LAYER_WIDTH,
      y: POINTER_LAYER_INSET_Y + position.y * POINTER_LAYER_HEIGHT,
    };
  }

  getPointerPositionFromPadPixel(position: {
    readonly x: number;
    readonly y: number;
  }): { readonly x: number; readonly y: number } {
    return {
      x: (position.x - POINTER_LAYER_INSET_X) / POINTER_LAYER_WIDTH,
      y: (position.y - POINTER_LAYER_INSET_Y) / POINTER_LAYER_HEIGHT,
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

function pointerAssetsToDataUrls(assets: Array<CustomPointerAsset>): Record<string, string> {
  const dataUrls: Record<string, string> = {};
  for (const asset of assets) {
    dataUrls[asset.id] = pointerAssetToDataUrl(asset);
  }
  return dataUrls;
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
