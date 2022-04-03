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
    let configString = figma.root.getPluginData(Config.CONFIG_KEY);
    return configString && configString.length > 0;
  }

  static getSavedConfig() {
    try {
      return JSON.parse(figma.root.getPluginData(Config.CONFIG_KEY));
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
    let versionString = figma.root.getPluginData(Config.CONFIG_VERSION_KEY);
    return versionString && versionString.length > 0 ? JSON.parse(versionString) : 0;
  }

  private static saveConfigVersion(version: number) {
    figma.root.setPluginData(Config.CONFIG_VERSION_KEY, JSON.stringify(version));
  }
  

  static getDefaultConfig() {
    let controllerNavigation: Navigation = {
      device: Device.XBOX,
      scheme: NavScheme.DPAD,
      customKeycodes: new NavigationKeycodes()
    }

    let keyboardNavigation: Navigation = {
      device: Device.KEYBOARD,
      scheme: NavScheme.ARROW_KEYS,
      customKeycodes: new NavigationKeycodes()
    }

    let activeNavigation = controllerNavigation

    let animation: Animation = {
      type: AnimationType.SMART_ANIMATE,
      isAutoDirection: true,
      direction: AnimationDirection.LEFT,
      isMatchLayers: false,
      easing: AnimationEasing.EASE_IN,
      duration: 200
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
    let prevConfigVersion = this.getConfigVersion();
    if (this.CONFIG_VERSION > prevConfigVersion) {
      console.log(`Migrating config from version ${prevConfigVersion} to ${this.CONFIG_VERSION}`);
      this.clear(); // Clear old configuration
      this.save(this.getDefaultConfig()); // Save default configuration as latest
      this.saveConfigVersion(this.CONFIG_VERSION); // Update current config version
    }
  }

}

export interface StoredNavigation {

  keyboard: Navigation
  controller: Navigation

}