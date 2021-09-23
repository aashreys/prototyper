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
    }
  }
}