import { Device, Keycode } from "./device";

export enum NavScheme {

  DPAD = 0,
  LEFT_STICK,
  RIGHT_STICK,
  SHOULDER_BUTTONS,
  TRIGGER_BUTTONS

}

export class Navigation {

  readonly scheme: NavScheme
  readonly left: Keycode
  readonly right: Keycode
  readonly up: Keycode
  readonly down: Keycode

  constructor(scheme: NavScheme, left: Keycode, right: Keycode, up: Keycode, down: Keycode) {
    this.scheme = scheme
    this.left = left
    this.right = right
    this.up = up
    this.down = down
  }

  static createNavigation(device: Device, scheme: NavScheme) {
    return new Navigation(
      scheme,
      this.getLeft(device, scheme),
      this.getRight(device, scheme),
      this.getUp(device, scheme),
      this.getDown(device, scheme)
    )
  }

  static getLeft(device: Device, scheme: NavScheme) {
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

  static getRight(device: Device, scheme: NavScheme) {
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

  static getUp(device: Device, scheme: NavScheme) {
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

  static getDown(device: Device, scheme: NavScheme) {
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