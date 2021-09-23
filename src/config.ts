import { Animation, AnimationType } from "./animation";
import { Navigation, NavScheme } from "./navigation";
import { Device } from "./device";

export class Config {

  static CONFIG_VERSION_KEY = 'config_version';
  static CONFIG_VERSION = 3;

  static CONFIG_KEY = 'config';
  static GAP = 100;

  readonly device: Device

  readonly navigation: Navigation

  readonly variantProperty: string;
  readonly variantFromValue: string;
  readonly variantToValue: string;

  readonly animation: Animation

  constructor(
    device,
    navigation,
    variantProperty,
    variantFromValue,
    variantToValue,
    animation
  ) {
    this.device = device;
    this.navigation = navigation;
    this.variantProperty = variantProperty;
    this.variantFromValue = variantFromValue,
    this.variantToValue = variantToValue;
    this.animation = animation;
  }

  updateNavigation(navigation: Navigation) {
    return new Config(
      this.device,
      navigation,
      this.variantProperty,
      this.variantFromValue,
      this.variantToValue,
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
      Device.XBOX,
      Navigation.createNavigation(Device.XBOX, NavScheme.DPAD),
      '',
      '',
      '',
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
      this.clear(); // Clear configuration
      this.save(this.getDefaultConfig()); // Save default configuration with updated config version
      this.saveConfigVersion(this.CONFIG_VERSION);
    }
  }

}