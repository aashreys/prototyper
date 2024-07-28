import { Config } from "./config";
import { Device, Keycode } from "./device";

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

export enum NavScheme {

  DPAD = 0,
  LEFT_STICK, 
  RIGHT_STICK, 
  SHOULDER_BUTTONS, 
  TRIGGER_BUTTONS, 
  CUSTOM,
  WASD,
  ARROW_KEYS,
  QE,
  TAB,
  DPAD_AND_LEFT_STICK

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
    if (config.activeNavigation.scheme !== NavScheme.CUSTOM) {
      return NavigationKeycodes.fromDeviceScheme(
        config.activeNavigation.device, 
        config.activeNavigation.scheme
      )
    }
    else {
      return config.activeNavigation.customKeycodes
    }
  }

  private static fromDeviceScheme(device: Device, scheme: NavScheme) {
    let left = this.getLeftKeycode(device, scheme)
    let right = this.getRightKeycode(device, scheme)
    let up = this.getUpKeycode(device, scheme)
    let down = this.getDownKeycode(device, scheme)
    return new NavigationKeycodes(left, right, up, down)
  }

  private static getLeftKeycode(device: Device, scheme: NavScheme): number[] {
    switch (device) {
      case Device.XBOX:
        switch (scheme) {
          case NavScheme.DPAD: return [Keycode.XBX_DPAD_LEFT]
          case NavScheme.LEFT_STICK: return [Keycode.XBX_LS_LEFT]
          case NavScheme.RIGHT_STICK: return [Keycode.XBX_RS_LEFT]
          case NavScheme.SHOULDER_BUTTONS: return [Keycode.XBX_LB]
          case NavScheme.TRIGGER_BUTTONS: return [Keycode.XBX_LT]
          case NavScheme.DPAD_AND_LEFT_STICK: return [Keycode.XBX_DPAD_LEFT, Keycode.XBX_LS_LEFT]
          default: []
        }

      case Device.PS4:
        switch (scheme) {
          case NavScheme.DPAD: return [Keycode.PS4_DPAD_LEFT]
          case NavScheme.LEFT_STICK: return [Keycode.PS4_LS_LEFT]
          case NavScheme.RIGHT_STICK: return [Keycode.PS4_RS_LEFT]
          case NavScheme.SHOULDER_BUTTONS: return [Keycode.PS4_L1]
          case NavScheme.TRIGGER_BUTTONS: return [Keycode.PS4_L2]
          case NavScheme.DPAD_AND_LEFT_STICK: return [Keycode.PS4_DPAD_LEFT, Keycode.PS4_LS_LEFT]
          default: []
        }

      case Device.SWITCH_PRO:
        switch (scheme) {
          case NavScheme.DPAD: return [Keycode.SWITCH_DPAD_LEFT]
          case NavScheme.LEFT_STICK: return [Keycode.SWITCH_LS_LEFT]
          case NavScheme.RIGHT_STICK: return [Keycode.SWITCH_RS_LEFT]
          case NavScheme.SHOULDER_BUTTONS: return [Keycode.SWITCH_L]
          case NavScheme.TRIGGER_BUTTONS: return [Keycode.SWITCH_ZL]
          case NavScheme.DPAD_AND_LEFT_STICK: return [Keycode.SWITCH_DPAD_LEFT, Keycode.SWITCH_LS_LEFT]
          default: []
        }
      
      case Device.KEYBOARD: 
        switch (scheme) {
          case NavScheme.ARROW_KEYS: return [Keycode.KBD_ARROW_LEFT]
          case NavScheme.WASD: return [Keycode.KBD_A]
          case NavScheme.QE: return [Keycode.KBD_Q]
          case NavScheme.TAB: return [Keycode.KBD_TAB, Keycode.KBD_SHIFT]
          default: []
        }
    }
  }

  private static getRightKeycode(device: Device, scheme: NavScheme): number[] {
    switch (device) {
      case Device.XBOX:
        switch (scheme) {
          case NavScheme.DPAD: return [Keycode.XBX_DPAD_RIGHT]
          case NavScheme.LEFT_STICK: return [Keycode.XBX_LS_RIGHT]
          case NavScheme.RIGHT_STICK: return [Keycode.XBX_RS_RIGHT]
          case NavScheme.SHOULDER_BUTTONS: return [Keycode.XBX_RB]
          case NavScheme.TRIGGER_BUTTONS: return [Keycode.XBX_RT]
          case NavScheme.DPAD_AND_LEFT_STICK: return [Keycode.XBX_DPAD_RIGHT, Keycode.XBX_LS_RIGHT]
          default: []
        }

      case Device.PS4:
        switch (scheme) {
          case NavScheme.DPAD: return [Keycode.PS4_DPAD_RIGHT]
          case NavScheme.LEFT_STICK: return [Keycode.PS4_LS_RIGHT]
          case NavScheme.RIGHT_STICK: return [Keycode.PS4_RS_RIGHT]
          case NavScheme.SHOULDER_BUTTONS: return [Keycode.PS4_R1]
          case NavScheme.TRIGGER_BUTTONS: return [Keycode.PS4_R2]
          case NavScheme.DPAD_AND_LEFT_STICK: return [Keycode.PS4_DPAD_RIGHT, Keycode.PS4_LS_RIGHT]
          default: []
        }

      case Device.SWITCH_PRO:
        switch (scheme) {
          case NavScheme.DPAD: return [Keycode.SWITCH_DPAD_RIGHT]
          case NavScheme.LEFT_STICK: return [Keycode.SWITCH_LS_RIGHT]
          case NavScheme.RIGHT_STICK: return [Keycode.SWITCH_RS_RIGHT]
          case NavScheme.SHOULDER_BUTTONS: return [Keycode.SWITCH_R]
          case NavScheme.TRIGGER_BUTTONS: return [Keycode.SWITCH_ZR]
          case NavScheme.DPAD_AND_LEFT_STICK: return [Keycode.SWITCH_DPAD_RIGHT, Keycode.SWITCH_LS_RIGHT]
          default: []
        }

      case Device.KEYBOARD: 
        switch (scheme) {
          case NavScheme.ARROW_KEYS: return [Keycode.KBD_ARROW_RIGHT]
          case NavScheme.WASD: return [Keycode.KBD_D]
          case NavScheme.QE: return [Keycode.KBD_E]
          case NavScheme.TAB: return [Keycode.KBD_TAB]
          default: []
        }
    }
  }

  private static getUpKeycode(device: Device, scheme: NavScheme): number[] {
    switch (device) {
      case Device.XBOX:
        switch (scheme) {
          case NavScheme.DPAD: return [Keycode.XBX_DPAD_UP]
          case NavScheme.LEFT_STICK: return [Keycode.XBX_LS_UP]
          case NavScheme.RIGHT_STICK: return [Keycode.XBX_RS_UP]
          case NavScheme.DPAD_AND_LEFT_STICK: return [Keycode.XBX_DPAD_UP, Keycode.XBX_LS_UP]
          default: []
        }

      case Device.PS4:
        switch (scheme) {
          case NavScheme.DPAD: return [Keycode.PS4_DPAD_UP]
          case NavScheme.LEFT_STICK: return [Keycode.PS4_LS_UP]
          case NavScheme.RIGHT_STICK: return [Keycode.PS4_RS_UP]
          case NavScheme.DPAD_AND_LEFT_STICK: return [Keycode.PS4_DPAD_UP, Keycode.PS4_LS_UP]
          default: []
        }

      case Device.SWITCH_PRO:
        switch (scheme) {
          case NavScheme.DPAD: return [Keycode.SWITCH_DPAD_UP]
          case NavScheme.LEFT_STICK: return [Keycode.SWITCH_LS_UP]
          case NavScheme.RIGHT_STICK: return [Keycode.SWITCH_RS_UP]
          case NavScheme.DPAD_AND_LEFT_STICK: return [Keycode.SWITCH_DPAD_UP, Keycode.SWITCH_LS_UP]
          default: []
        }

      case Device.KEYBOARD: 
        switch (scheme) {
          case NavScheme.ARROW_KEYS: return [Keycode.KBD_ARROW_UP]
          case NavScheme.WASD: return [Keycode.KBD_W]
          default: []
        }
    }
  }

  private static getDownKeycode(device: Device, scheme: NavScheme): number[] {
    switch (device) {
      case Device.XBOX:
        switch (scheme) {
          case NavScheme.DPAD: return [Keycode.XBX_DPAD_DOWN]
          case NavScheme.LEFT_STICK: return [Keycode.XBX_LS_DOWN]
          case NavScheme.RIGHT_STICK: return [Keycode.XBX_RS_DOWN]
          case NavScheme.DPAD_AND_LEFT_STICK: return [Keycode.XBX_DPAD_DOWN, Keycode.XBX_LS_DOWN]
          default: []
        }

      case Device.PS4:
        switch (scheme) {
          case NavScheme.DPAD: return [Keycode.PS4_DPAD_DOWN]
          case NavScheme.LEFT_STICK: return [Keycode.PS4_LS_DOWN]
          case NavScheme.RIGHT_STICK: return [Keycode.PS4_RS_DOWN]
          case NavScheme.DPAD_AND_LEFT_STICK: return [Keycode.PS4_DPAD_DOWN, Keycode.PS4_LS_DOWN]
          default: []
        }

      case Device.SWITCH_PRO:
        switch (scheme) {
          case NavScheme.DPAD: return [Keycode.SWITCH_DPAD_DOWN]
          case NavScheme.LEFT_STICK: return [Keycode.SWITCH_LS_DOWN]
          case NavScheme.RIGHT_STICK: return [Keycode.SWITCH_RS_DOWN]
          case NavScheme.DPAD_AND_LEFT_STICK: return [Keycode.SWITCH_DPAD_DOWN, Keycode.SWITCH_LS_DOWN]
          default: []
        }

      case Device.KEYBOARD: 
        switch (scheme) {
          case NavScheme.ARROW_KEYS: return [Keycode.KBD_ARROW_DOWN]
          case NavScheme.WASD: return [Keycode.KBD_S]
          default: []
        }
    }
  }
}