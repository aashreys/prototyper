import { Config } from "./config";
import { Device, Keycode } from "./device";

export class Navigation {
  
  readonly device: Device
  readonly scheme: NavScheme
  readonly customKeycodes: NavigationKeycodes

  constructor(
    device: Device, 
    scheme: NavScheme, 
    customKeycodes?: NavigationKeycodes
  ) {
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

  static fromConfig(config: Config): NavigationKeycodes[] {
    if (config.activeNavigation.scheme !== NavScheme.CUSTOM) {
      return NavigationKeycodes.fromDeviceScheme(
        config.activeNavigation.device, 
        config.activeNavigation.scheme
      )
    }
    else {
      return [config.activeNavigation.customKeycodes]
    }
  }

  private static fromDeviceScheme(device: Device, scheme: NavScheme) {
    switch (device) {
      case Device.XBOX: {
        switch (scheme) {
          case NavScheme.DPAD_AND_LEFT_STICK: return [
            new NavigationKeycodes(
              [Keycode.XBX_DPAD_LEFT],
              [Keycode.XBX_DPAD_RIGHT],
              [Keycode.XBX_DPAD_UP],
              [Keycode.XBX_DPAD_DOWN]
            ),
            new NavigationKeycodes(
              [Keycode.XBX_LS_LEFT],
              [Keycode.XBX_LS_RIGHT],
              [Keycode.XBX_LS_UP],
              [Keycode.XBX_LS_DOWN]
            )
          ]
          case NavScheme.DPAD: return [new NavigationKeycodes(
            [Keycode.XBX_DPAD_LEFT],
            [Keycode.XBX_DPAD_RIGHT],
            [Keycode.XBX_DPAD_UP],
            [Keycode.XBX_DPAD_DOWN]
          )]
          case NavScheme.LEFT_STICK: return [
            new NavigationKeycodes(
              [Keycode.XBX_LS_LEFT],
              [Keycode.XBX_LS_RIGHT],
              [Keycode.XBX_LS_UP],
              [Keycode.XBX_LS_DOWN]
            )
          ]
          case NavScheme.RIGHT_STICK: return [
            new NavigationKeycodes(
              [Keycode.XBX_RS_LEFT],
              [Keycode.XBX_RS_RIGHT],
              [Keycode.XBX_RS_UP],
              [Keycode.XBX_RS_DOWN]
            )
          ]
          case NavScheme.SHOULDER_BUTTONS: return [
            new NavigationKeycodes(
              [Keycode.XBX_LB],
              [Keycode.XBX_RB],
              [],
              []
            )
          ]
          case NavScheme.TRIGGER_BUTTONS: return [
            new NavigationKeycodes(
              [Keycode.XBX_LT],
              [Keycode.XBX_RT],
              [],
              []
            )
          ]
        }
      }
      case Device.PS4: {
        switch (scheme) {
          case NavScheme.DPAD_AND_LEFT_STICK: return [
            new NavigationKeycodes(
              [Keycode.PS4_DPAD_LEFT],
              [Keycode.PS4_DPAD_RIGHT],
              [Keycode.PS4_DPAD_UP],
              [Keycode.PS4_DPAD_DOWN]
            ),
            new NavigationKeycodes(
              [Keycode.PS4_LS_LEFT],
              [Keycode.PS4_LS_RIGHT],
              [Keycode.PS4_LS_UP],
              [Keycode.PS4_LS_DOWN]
            )
          ]
          case NavScheme.DPAD: return [new NavigationKeycodes(
            [Keycode.PS4_DPAD_LEFT],
            [Keycode.PS4_DPAD_RIGHT],
            [Keycode.PS4_DPAD_UP],
            [Keycode.PS4_DPAD_DOWN]
          )]
          case NavScheme.LEFT_STICK: return [
            new NavigationKeycodes(
              [Keycode.PS4_LS_LEFT],
              [Keycode.PS4_LS_RIGHT],
              [Keycode.PS4_LS_UP],
              [Keycode.PS4_LS_DOWN]
            )
          ]
          case NavScheme.RIGHT_STICK: return [
            new NavigationKeycodes(
              [Keycode.PS4_RS_LEFT],
              [Keycode.PS4_RS_RIGHT],
              [Keycode.PS4_RS_UP],
              [Keycode.PS4_RS_DOWN]
            )
          ]
          case NavScheme.SHOULDER_BUTTONS: return [
            new NavigationKeycodes(
              [Keycode.PS4_L1],
              [Keycode.PS4_R1],
              [],
              []
            )
          ]
          case NavScheme.TRIGGER_BUTTONS: return [
            new NavigationKeycodes(
              [Keycode.PS4_L2],
              [Keycode.PS4_R2],
              [],
              []
            )
          ]
        }
      }
      case Device.SWITCH_PRO: {
        switch (scheme) {
          case NavScheme.DPAD_AND_LEFT_STICK: return [
            new NavigationKeycodes(
              [Keycode.SWITCH_DPAD_LEFT],
              [Keycode.SWITCH_DPAD_RIGHT],
              [Keycode.SWITCH_DPAD_UP],
              [Keycode.SWITCH_DPAD_DOWN]
            ),
            new NavigationKeycodes(
              [Keycode.SWITCH_LS_LEFT],
              [Keycode.SWITCH_LS_RIGHT],
              [Keycode.SWITCH_LS_UP],
              [Keycode.SWITCH_LS_DOWN]
            )
          ]
          case NavScheme.DPAD: return [new NavigationKeycodes(
            [Keycode.SWITCH_DPAD_LEFT],
            [Keycode.SWITCH_DPAD_RIGHT],
            [Keycode.SWITCH_DPAD_UP],
            [Keycode.SWITCH_DPAD_DOWN]
          )]
          case NavScheme.LEFT_STICK: return [
            new NavigationKeycodes(
              [Keycode.SWITCH_LS_LEFT],
              [Keycode.SWITCH_LS_RIGHT],
              [Keycode.SWITCH_LS_UP],
              [Keycode.SWITCH_LS_DOWN]
            )
          ]
          case NavScheme.RIGHT_STICK: return [
            new NavigationKeycodes(
              [Keycode.SWITCH_RS_LEFT],
              [Keycode.SWITCH_RS_RIGHT],
              [Keycode.SWITCH_RS_UP],
              [Keycode.SWITCH_RS_DOWN]
            )
          ]
          case NavScheme.SHOULDER_BUTTONS: return [
            new NavigationKeycodes(
              [Keycode.SWITCH_L],
              [Keycode.SWITCH_R],
              [],
              []
            )
          ]
          case NavScheme.TRIGGER_BUTTONS: return [
            new NavigationKeycodes(
              [Keycode.SWITCH_ZL],
              [Keycode.SWITCH_ZR],
              [],
              []
            )
          ]
        }
      }
    }
  }

  private static getKeycodes(device: Device, scheme: NavScheme): NavigationKeycodes[] {
    switch (device) {
      case Device.XBOX: {
        switch (scheme) {
          case NavScheme.DPAD_AND_LEFT_STICK: return [
            new NavigationKeycodes(
              [Keycode.XBX_DPAD_LEFT],
              [Keycode.XBX_DPAD_RIGHT],
              [Keycode.XBX_DPAD_UP],
              [Keycode.XBX_DPAD_DOWN]
            ),
            new NavigationKeycodes(
              [Keycode.XBX_LS_LEFT],
              [Keycode.XBX_LS_RIGHT],
              [Keycode.XBX_LS_UP],
              [Keycode.XBX_LS_DOWN]
            )
          ]
          case NavScheme.DPAD: return [new NavigationKeycodes(
            [Keycode.XBX_DPAD_LEFT],
            [Keycode.XBX_DPAD_RIGHT],
            [Keycode.XBX_DPAD_UP],
            [Keycode.XBX_DPAD_DOWN]
          )]
          case NavScheme.LEFT_STICK: return [
            new NavigationKeycodes(
              [Keycode.XBX_LS_LEFT],
              [Keycode.XBX_LS_RIGHT],
              [Keycode.XBX_LS_UP],
              [Keycode.XBX_LS_DOWN]
            )
          ]
          case NavScheme.RIGHT_STICK: return [
            new NavigationKeycodes(
              [Keycode.XBX_RS_LEFT],
              [Keycode.XBX_RS_RIGHT],
              [Keycode.XBX_RS_UP],
              [Keycode.XBX_RS_DOWN]
            )
          ]
          case NavScheme.SHOULDER_BUTTONS: return [
            new NavigationKeycodes(
              [Keycode.XBX_LB],
              [Keycode.XBX_RB],
              [],
              []
            )
          ]
          case NavScheme.TRIGGER_BUTTONS: return [
            new NavigationKeycodes(
              [Keycode.XBX_LT],
              [Keycode.XBX_RT],
              [],
              []
            )
          ]
        }
      }
      case Device.PS4: {
        switch (scheme) {
          case NavScheme.DPAD_AND_LEFT_STICK: return [
            new NavigationKeycodes(
              [Keycode.PS4_DPAD_LEFT],
              [Keycode.PS4_DPAD_RIGHT],
              [Keycode.PS4_DPAD_UP],
              [Keycode.PS4_DPAD_DOWN]
            ),
            new NavigationKeycodes(
              [Keycode.PS4_LS_LEFT],
              [Keycode.PS4_LS_RIGHT],
              [Keycode.PS4_LS_UP],
              [Keycode.PS4_LS_DOWN]
            )
          ]
          case NavScheme.DPAD: return [new NavigationKeycodes(
            [Keycode.PS4_DPAD_LEFT],
            [Keycode.PS4_DPAD_RIGHT],
            [Keycode.PS4_DPAD_UP],
            [Keycode.PS4_DPAD_DOWN]
          )]
          case NavScheme.LEFT_STICK: return [
            new NavigationKeycodes(
              [Keycode.PS4_LS_LEFT],
              [Keycode.PS4_LS_RIGHT],
              [Keycode.PS4_LS_UP],
              [Keycode.PS4_LS_DOWN]
            )
          ]
          case NavScheme.RIGHT_STICK: return [
            new NavigationKeycodes(
              [Keycode.PS4_RS_LEFT],
              [Keycode.PS4_RS_RIGHT],
              [Keycode.PS4_RS_UP],
              [Keycode.PS4_RS_DOWN]
            )
          ]
          case NavScheme.SHOULDER_BUTTONS: return [
            new NavigationKeycodes(
              [Keycode.PS4_L1],
              [Keycode.PS4_R1],
              [],
              []
            )
          ]
          case NavScheme.TRIGGER_BUTTONS: return [
            new NavigationKeycodes(
              [Keycode.PS4_L2],
              [Keycode.PS4_R2],
              [],
              []
            )
          ]
        }
      }
      case Device.SWITCH_PRO: {
        switch (scheme) {
          case NavScheme.DPAD_AND_LEFT_STICK: return [
            new NavigationKeycodes(
              [Keycode.SWITCH_DPAD_LEFT],
              [Keycode.SWITCH_DPAD_RIGHT],
              [Keycode.SWITCH_DPAD_UP],
              [Keycode.SWITCH_DPAD_DOWN]
            ),
            new NavigationKeycodes(
              [Keycode.SWITCH_LS_LEFT],
              [Keycode.SWITCH_LS_RIGHT],
              [Keycode.SWITCH_LS_UP],
              [Keycode.SWITCH_LS_DOWN]
            )
          ]
          case NavScheme.DPAD: return [new NavigationKeycodes(
            [Keycode.SWITCH_DPAD_LEFT],
            [Keycode.SWITCH_DPAD_RIGHT],
            [Keycode.SWITCH_DPAD_UP],
            [Keycode.SWITCH_DPAD_DOWN]
          )]
          case NavScheme.LEFT_STICK: return [
            new NavigationKeycodes(
              [Keycode.SWITCH_LS_LEFT],
              [Keycode.SWITCH_LS_RIGHT],
              [Keycode.SWITCH_LS_UP],
              [Keycode.SWITCH_LS_DOWN]
            )
          ]
          case NavScheme.RIGHT_STICK: return [
            new NavigationKeycodes(
              [Keycode.SWITCH_RS_LEFT],
              [Keycode.SWITCH_RS_RIGHT],
              [Keycode.SWITCH_RS_UP],
              [Keycode.SWITCH_RS_DOWN]
            )
          ]
          case NavScheme.SHOULDER_BUTTONS: return [
            new NavigationKeycodes(
              [Keycode.SWITCH_L],
              [Keycode.SWITCH_R],
              [],
              []
            )
          ]
          case NavScheme.TRIGGER_BUTTONS: return [
            new NavigationKeycodes(
              [Keycode.SWITCH_ZL],
              [Keycode.SWITCH_ZR],
              [],
              []
            )
          ]
        }
      }
    }
  }

  
}