import { Config } from "./config";
import { Device, Keycode } from "./device";

export enum NavScheme {

  DPAD = 0,
  LEFT_STICK, // 1
  RIGHT_STICK, // 2
  SHOULDER_BUTTONS, // 3
  TRIGGER_BUTTONS, // 4
  CUSTOM // 5

}

export class NavigationKeycodes {
  

  readonly left: Array<number> = [];
  readonly right: Array<number> = [];
  readonly up: Array<number> = [];
  readonly down: Array<number> = [];

  constructor(left?: Array<number>, right?: Array<number>, up?: Array<number>, down?: Array<number>) {
    this.left = left ? left : []
    this.right = right ? right : []
    this.up = up ? up : []
    this.down = down ? down : []
  }

  static fromConfig(config: Config) {
    if (config.navigation.scheme !== NavScheme.CUSTOM) {
      return NavigationKeycodes.fromDeviceScheme(config.navigation.device, config.navigation.scheme)
    }
    else {
      return config.navigation.customKeycodes
    }
  }

  private static fromDeviceScheme(device: Device, scheme: NavScheme) {
    let left = this.getLeftKeycode(device, scheme)
    let right = this.getRightKeycode(device, scheme)
    let up = this.getUpKeycode(device, scheme)
    let down = this.getDownKeycode(device, scheme)
    return new NavigationKeycodes(
      left ? [left] : [],
      right ? [right] : [],
      up ? [up] : [],
      down ? [down] : [],
    )
  }

  static getLeftKeycode(device: Device, scheme: NavScheme) {
    switch (device) {
      case Device.XBOX:
        switch (scheme) {
          case NavScheme.DPAD: return Keycode.XBX_DPAD_LEFT;
          case NavScheme.LEFT_STICK: return Keycode.XBX_LS_LEFT;
          case NavScheme.RIGHT_STICK: return Keycode.XBX_RS_LEFT;
          case NavScheme.SHOULDER_BUTTONS: return Keycode.XBX_LB;
          case NavScheme.TRIGGER_BUTTONS: return Keycode.XBX_LT;
        }

      case Device.PS4:
        switch (scheme) {
          case NavScheme.DPAD: return Keycode.PS4_DPAD_LEFT;
          case NavScheme.LEFT_STICK: return Keycode.PS4_LS_LEFT;
          case NavScheme.RIGHT_STICK: return Keycode.PS4_RS_LEFT;
          case NavScheme.SHOULDER_BUTTONS: return Keycode.PS4_L1;
          case NavScheme.TRIGGER_BUTTONS: return Keycode.PS4_L2;
        }

      case Device.SWITCH_PRO:
        switch (scheme) {
          case NavScheme.DPAD: return Keycode.SWITCH_DPAD_LEFT;
          case NavScheme.LEFT_STICK: return Keycode.SWITCH_LS_LEFT;
          case NavScheme.RIGHT_STICK: return Keycode.SWITCH_RS_LEFT;
          case NavScheme.SHOULDER_BUTTONS: return Keycode.SWITCH_L;
          case NavScheme.TRIGGER_BUTTONS: return Keycode.SWITCH_ZL;
        }
    }
  }

  static getRightKeycode(device: Device, scheme: NavScheme) {
    switch (device) {
      case Device.XBOX:
        switch (scheme) {
          case NavScheme.DPAD: return Keycode.XBX_DPAD_RIGHT;
          case NavScheme.LEFT_STICK: return Keycode.XBX_LS_RIGHT;
          case NavScheme.RIGHT_STICK: return Keycode.XBX_RS_RIGHT;
          case NavScheme.SHOULDER_BUTTONS: return Keycode.XBX_RB;
          case NavScheme.TRIGGER_BUTTONS: return Keycode.XBX_RT;
        }

      case Device.PS4:
        switch (scheme) {
          case NavScheme.DPAD: return Keycode.PS4_DPAD_RIGHT;
          case NavScheme.LEFT_STICK: return Keycode.PS4_LS_RIGHT;
          case NavScheme.RIGHT_STICK: return Keycode.PS4_RS_RIGHT;
          case NavScheme.SHOULDER_BUTTONS: return Keycode.PS4_R1;
          case NavScheme.TRIGGER_BUTTONS: return Keycode.PS4_R2;
        }

      case Device.SWITCH_PRO:
        switch (scheme) {
          case NavScheme.DPAD: return Keycode.SWITCH_DPAD_RIGHT;
          case NavScheme.LEFT_STICK: return Keycode.SWITCH_LS_RIGHT;
          case NavScheme.RIGHT_STICK: return Keycode.SWITCH_RS_RIGHT;
          case NavScheme.SHOULDER_BUTTONS: return Keycode.SWITCH_R;
          case NavScheme.TRIGGER_BUTTONS: return Keycode.SWITCH_ZR;
        }
    }
  }

  static getUpKeycode(device: Device, scheme: NavScheme) {
    switch (device) {
      case Device.XBOX:
        switch (scheme) {
          case NavScheme.DPAD: return Keycode.XBX_DPAD_UP;
          case NavScheme.LEFT_STICK: return Keycode.XBX_LS_UP;
          case NavScheme.RIGHT_STICK: return Keycode.XBX_RS_UP;
          case NavScheme.SHOULDER_BUTTONS: return undefined;
          case NavScheme.TRIGGER_BUTTONS: return undefined;
        }

      case Device.PS4:
        switch (scheme) {
          case NavScheme.DPAD: return Keycode.PS4_DPAD_UP;
          case NavScheme.LEFT_STICK: return Keycode.PS4_LS_UP;
          case NavScheme.RIGHT_STICK: return Keycode.PS4_RS_UP;
          case NavScheme.SHOULDER_BUTTONS: return undefined;
          case NavScheme.TRIGGER_BUTTONS: return undefined;
        }

      case Device.SWITCH_PRO:
        switch (scheme) {
          case NavScheme.DPAD: return Keycode.SWITCH_DPAD_UP;
          case NavScheme.LEFT_STICK: return Keycode.SWITCH_LS_UP;
          case NavScheme.RIGHT_STICK: return Keycode.SWITCH_RS_UP;
          case NavScheme.SHOULDER_BUTTONS: return undefined;
          case NavScheme.TRIGGER_BUTTONS: return undefined;
        }
    }
  }

  static getDownKeycode(device: Device, scheme: NavScheme) {
    switch (device) {
      case Device.XBOX:
        switch (scheme) {
          case NavScheme.DPAD: return Keycode.XBX_DPAD_DOWN;
          case NavScheme.LEFT_STICK: return Keycode.XBX_LS_DOWN;
          case NavScheme.RIGHT_STICK: return Keycode.XBX_RS_DOWN;
          case NavScheme.SHOULDER_BUTTONS: return undefined;
          case NavScheme.TRIGGER_BUTTONS: return undefined;
        }

      case Device.PS4:
        switch (scheme) {
          case NavScheme.DPAD: return Keycode.PS4_DPAD_DOWN;
          case NavScheme.LEFT_STICK: return Keycode.PS4_LS_DOWN;
          case NavScheme.RIGHT_STICK: return Keycode.PS4_RS_DOWN;
          case NavScheme.SHOULDER_BUTTONS: return undefined;
          case NavScheme.TRIGGER_BUTTONS: return undefined;
        }

      case Device.SWITCH_PRO:
        switch (scheme) {
          case NavScheme.DPAD: return Keycode.SWITCH_DPAD_DOWN;
          case NavScheme.LEFT_STICK: return Keycode.SWITCH_LS_DOWN;
          case NavScheme.RIGHT_STICK: return Keycode.SWITCH_RS_DOWN;
          case NavScheme.SHOULDER_BUTTONS: return undefined;
          case NavScheme.TRIGGER_BUTTONS: return undefined;
        }
    }
  }

}

export class Navigation {

  readonly device: Device
  readonly scheme: NavScheme
  readonly customKeycodes: NavigationKeycodes

  constructor(device: Device, scheme: NavScheme, customKeycodes: NavigationKeycodes) {
    this.device = device
    this.scheme = scheme
    this.customKeycodes = customKeycodes
  }
}