import { Animation, AnimationDirection, AnimationEasing, AnimationType } from "./animation";
import { Navigation, NavigationKeycodes, NavScheme } from "./navigation";
import { Device } from "./device";
import { SwapVariant } from "./swap_variant";

export class Config {

  static CONFIG_VERSION_KEY = 'config_version';
  static CONFIG_VERSION = 7;

  static CONFIG_KEY = 'config';
  static GAP = 100;

  readonly activeNavigation: Navigation
  
  readonly storedNavigation: StoredNavigation

  readonly swapVariant: SwapVariant

  readonly animation: Animation

  constructor(
    activeNavigation: Navigation,
    storedNavigation: StoredNavigation,
    swapVariant: SwapVariant,
    animation: Animation
  ) {
    this.activeNavigation = activeNavigation
    this.storedNavigation = storedNavigation
    this.swapVariant = swapVariant;
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
      return this.mergeWithDefaults(this.getDefaultConfig(), JSON.parse(configString));
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
      { property: '', from: '', to: '' },
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

}

export interface StoredNavigation {

  keyboard: Navigation
  controller: Navigation

}
