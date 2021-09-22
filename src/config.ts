import { Animation, AnimationType } from "./animation";
import { Platform, InputScheme, Keycode } from "./controller";

export class Config {

  static CONFIG_VERSION_KEY = 'config_version';
  static CONFIG_VERSION = 2;
  
  static CONFIG_KEY = 'config';
  static GAP = 100;

  readonly platform: Platform

  readonly inputScheme: InputScheme

  readonly leftInput: number
  readonly upInput: number
  readonly rightInput: number
  readonly downInput: number

  readonly variantProperty: string;
  readonly variantFromValue: string;
  readonly variantToValue: string;

  readonly animation: Animation
  
  constructor(
    platform,
    inputScheme,
    leftInput,
    upInput,
    rightInput,
    downInput,
    variantProperty,
    variantFromValue,
    variantToValue,
    animation
  ) {
    this.platform = platform;
    this.inputScheme = inputScheme;
    this.leftInput = leftInput;
    this.upInput = upInput;
    this.rightInput = rightInput;
    this.downInput = downInput;
    this.variantProperty = variantProperty;
    this.variantFromValue = variantFromValue,
    this.variantToValue = variantToValue;
    this.animation = animation;
  }

  static assignInputs(config: Config, leftInput, upInput, rightInput, downInput) {
    return new Config(
      config.platform,
      config.inputScheme,
      leftInput,
      upInput,
      rightInput,
      downInput,
      config.variantProperty,
      config.variantFromValue,
      config.variantToValue,
      config.animation,
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
    let configVersion = JSON.parse(figma.root.getPluginData(Config.CONFIG_VERSION_KEY));
    return configVersion && configVersion > 0 ? configVersion : 0;
  }

  private static saveConfigVersion(version: number) {
    figma.root.setPluginData(Config.CONFIG_VERSION_KEY, JSON.stringify(version));
  }

  static getDefaultConfig() {
    return new Config(
      Platform.XBOX,
      InputScheme.DPAD,
      Keycode.XBX_DPAD_LEFT,
      Keycode.XBX_DPAD_UP,
      Keycode.XBX_DPAD_RIGHT,
      Keycode.XBX_DPAD_DOWN,
      '',
      '',
      '',
      {
        animType: AnimationType.EASE_IN,
        duration: 200
      }
    );
  }

  static migrateConfig() {
    let prevConfigVersion = this.getConfigVersion();
    if (this.CONFIG_VERSION > prevConfigVersion) {
      this.clear(); // Clear configuration
      this.save(this.getDefaultConfig()); // Save default configuration with updated config version
      this.saveConfigVersion(this.CONFIG_VERSION);
      console.log('Migrated config: ');
      console.log(this.getSavedConfig());
    }
  }

}