import { Animation, AnimationType } from "./animation";
import { Navigation, NavigationKeycodes, NavScheme } from "./navigation";
import { Device } from "./device";
import { SwapVariant } from "./swap_variant";

export class Config {

  static CONFIG_VERSION_KEY = 'config_version';
  static CONFIG_VERSION = 5;

  static CONFIG_KEY = 'config';
  static GAP = 100;

  readonly navigation: Navigation

  readonly swapVariant: SwapVariant

  readonly animation: Animation

  constructor(
    navigation: Navigation,
    swapVariant: SwapVariant,
    animation: Animation
  ) {
    this.navigation = navigation;
    this.swapVariant = swapVariant;
    this.animation = animation;
  }

  updateNavigation(navigation: Navigation) {
    return new Config(
      navigation,
      this.swapVariant,
      this.animation
    );
  }

  static isConfigSaved() {
    let configString = figma.root.getPluginData(Config.CONFIG_KEY);
    return configString && configString.length > 0;
  }

  static getSavedConfig() {
    return JSON.parse(figma.root.getPluginData(Config.CONFIG_KEY));
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
    return new Config(
      {
        device: Device.XBOX,
        scheme: NavScheme.DPAD,
        customKeycodes: new NavigationKeycodes()
      },
      { property: '', from: '', to: '' },
      {
        animType: AnimationType.EASE_IN,
        duration: 200
      }
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