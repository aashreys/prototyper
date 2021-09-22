import { Animation, AnimationType } from "./animation";
import { Platform, InputScheme, Keycode } from "./controller";

export class Config {

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
  }
  
  static save(config) {
    figma.root.setPluginData(Config.CONFIG_KEY, JSON.stringify(config));
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
}