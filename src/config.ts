import { Animation, AnimationDirection, AnimationEasing, AnimationType } from "./animation";
import { Navigation, NavigationKeycodes, NavScheme } from "./navigation";
import { Device } from "./device";
import { SwapVariant } from "./swap_variant";
import { getDefaultNavigationFocusConfig, isVariantFocusConfigured, NavigationFocusConfig, normalizeNavigationFocusConfig } from "./navigation_focus";

export class Config {

  static CONFIG_VERSION_KEY = 'config_version';
  static CONFIG_VERSION = 12;

  static CONFIG_KEY = 'config';
  static GAP = 100;

  readonly activeNavigation: Navigation
  
  readonly storedNavigation: StoredNavigation

  readonly swapVariant: SwapVariant

  readonly focus: NavigationFocusConfig

  readonly animation: Animation

  constructor(
    activeNavigation: Navigation,
    storedNavigation: StoredNavigation,
    focus: NavigationFocusConfig,
    animation: Animation
  ) {
    this.activeNavigation = activeNavigation
    this.storedNavigation = storedNavigation
    this.focus = normalizeNavigationFocusConfig(focus)
    this.swapVariant = this.focus.variant;
    this.animation = animation;
  }

  static isConfigSaved() {
    const configString = figma.root.getPluginData(Config.CONFIG_KEY);
    return configString && configString.length > 0;
  }

  static getSavedConfig() {
    try {
      const configString = figma.root.getPluginData(Config.CONFIG_KEY);
      if (!configString || configString.length === 0) return this.getDefaultConfig()
      const savedConfig = JSON.parse(configString)
      return this.normalizeConfig(this.mergeWithDefaults(this.getDefaultConfig(), savedConfig), savedConfig);
    }
    catch (e) {
      console.error('Unable to retrieve saved config with error: ' + e)
      console.log('Loading default config to recover...')
      return this.getDefaultConfig()
    }
  }

  static clear() {
    figma.root.setPluginData(Config.CONFIG_KEY, '');
    figma.root.setPluginData(Config.CONFIG_VERSION_KEY, JSON.stringify(''));
  }

  static save(config) {
    figma.root.setPluginData(Config.CONFIG_KEY, JSON.stringify(config));
  }

  private static getConfigVersion() {
    const versionString = figma.root.getPluginData(Config.CONFIG_VERSION_KEY);
    try {
      const version = versionString && versionString.length > 0 ? JSON.parse(versionString) : 0;
      return typeof version === 'number' ? version : 0;
    }
    catch (e) {
      console.error('Unable to retrieve saved config version with error: ' + e)
      return 0;
    }
  }

  private static saveConfigVersion(version: number) {
    figma.root.setPluginData(Config.CONFIG_VERSION_KEY, JSON.stringify(version));
  }
  

  static getDefaultConfig() {
    const controllerNavigation: Navigation = {
      device: Device.PS4,
      scheme: NavScheme.DPAD_AND_LEFT_STICK,
      customKeycodes: new NavigationKeycodes()
    }

    const keyboardNavigation: Navigation = {
      device: Device.KEYBOARD,
      scheme: NavScheme.ARROW_KEYS,
      customKeycodes: new NavigationKeycodes()
    }

    const activeNavigation = controllerNavigation

    const animation: Animation = {
      type: AnimationType.SMART_ANIMATE,
      isAutoDirection: true,
      direction: AnimationDirection.LEFT,
      isMatchLayers: false,
      easing: AnimationEasing.EASE_OUT,
      duration: 300
    }

    return new Config(
      activeNavigation,
      {
        keyboard: keyboardNavigation,
        controller: controllerNavigation
      },
      getDefaultNavigationFocusConfig(),
      animation
    )
  }

  static migrateConfig() {
    const prevConfigVersion = this.getConfigVersion();
    if (this.CONFIG_VERSION > prevConfigVersion) {
      console.log(`Migrating config from version ${prevConfigVersion} to ${this.CONFIG_VERSION}`);
      const config = this.isConfigSaved() ? this.getSavedConfig() : this.getDefaultConfig();
      this.save(config); // Save known settings with missing defaults filled
      this.saveConfigVersion(this.CONFIG_VERSION); // Update current config version
    }
  }

  private static mergeWithDefaults(defaultValue, savedValue) {
    if (Array.isArray(defaultValue)) {
      return Array.isArray(savedValue) ? savedValue : defaultValue;
    }

    if (defaultValue && typeof defaultValue === 'object') {
      if (!savedValue || typeof savedValue !== 'object' || Array.isArray(savedValue)) return defaultValue;

      const merged = {
        ...savedValue
      };

      for (const key of Object.keys(defaultValue)) {
        merged[key] = this.mergeWithDefaults(defaultValue[key], savedValue[key]);
      }

      return merged;
    }

    return savedValue !== undefined && savedValue !== null ? savedValue : defaultValue;
  }

  private static normalizeConfig(config, savedConfig?) {
    const savedSwapVariant = savedConfig?.swapVariant
    const focusVariant = config.focus?.variant
    const hasSavedComponentFocus = Array.isArray(savedConfig?.focus?.components)
    const legacyVariant = isVariantFocusConfigured(savedSwapVariant)
      ? savedSwapVariant
      : isVariantFocusConfigured(focusVariant)
        ? focusVariant
        : savedSwapVariant || config.swapVariant || focusVariant || { property: '', from: '', to: '' }
    let focusSource = savedConfig && !savedConfig.focus
      ? undefined
      : {
          ...config.focus,
          variant: legacyVariant
        }
    if (focusSource && !hasSavedComponentFocus) {
      delete focusSource.components
    }
    const focus = normalizeNavigationFocusConfig(focusSource, legacyVariant)
    return {
      ...config,
      focus: focus,
      swapVariant: focus.variant
    }
  }

}

export interface StoredNavigation {

  keyboard: Navigation
  controller: Navigation

}
