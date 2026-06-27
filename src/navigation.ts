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

type NavigationKeycodeSpec = {
  readonly left: ReadonlyArray<number>
  readonly right: ReadonlyArray<number>
  readonly up: ReadonlyArray<number>
  readonly down: ReadonlyArray<number>
}

type NavigationKeycodeLookup = Partial<Record<Device, Partial<Record<NavScheme, ReadonlyArray<NavigationKeycodeSpec>>>>>

function keycodes(
  left: ReadonlyArray<number>,
  right: ReadonlyArray<number>,
  up: ReadonlyArray<number>,
  down: ReadonlyArray<number>
): NavigationKeycodeSpec {
  return { left, right, up, down }
}

const NAVIGATION_KEYCODE_LOOKUP: NavigationKeycodeLookup = {
  [Device.XBOX]: {
    [NavScheme.DPAD_AND_LEFT_STICK]: [
      keycodes(
        [Keycode.XBX_DPAD_LEFT],
        [Keycode.XBX_DPAD_RIGHT],
        [Keycode.XBX_DPAD_UP],
        [Keycode.XBX_DPAD_DOWN]
      ),
      keycodes(
        [Keycode.XBX_LS_LEFT],
        [Keycode.XBX_LS_RIGHT],
        [Keycode.XBX_LS_UP],
        [Keycode.XBX_LS_DOWN]
      )
    ],
    [NavScheme.DPAD]: [
      keycodes(
        [Keycode.XBX_DPAD_LEFT],
        [Keycode.XBX_DPAD_RIGHT],
        [Keycode.XBX_DPAD_UP],
        [Keycode.XBX_DPAD_DOWN]
      )
    ],
    [NavScheme.LEFT_STICK]: [
      keycodes(
        [Keycode.XBX_LS_LEFT],
        [Keycode.XBX_LS_RIGHT],
        [Keycode.XBX_LS_UP],
        [Keycode.XBX_LS_DOWN]
      )
    ],
    [NavScheme.RIGHT_STICK]: [
      keycodes(
        [Keycode.XBX_RS_LEFT],
        [Keycode.XBX_RS_RIGHT],
        [Keycode.XBX_RS_UP],
        [Keycode.XBX_RS_DOWN]
      )
    ],
    [NavScheme.SHOULDER_BUTTONS]: [
      keycodes(
        [Keycode.XBX_LB],
        [Keycode.XBX_RB],
        [],
        []
      )
    ],
    [NavScheme.TRIGGER_BUTTONS]: [
      keycodes(
        [Keycode.XBX_LT],
        [Keycode.XBX_RT],
        [],
        []
      )
    ]
  },
  [Device.PS4]: {
    [NavScheme.DPAD_AND_LEFT_STICK]: [
      keycodes(
        [Keycode.PS4_DPAD_LEFT],
        [Keycode.PS4_DPAD_RIGHT],
        [Keycode.PS4_DPAD_UP],
        [Keycode.PS4_DPAD_DOWN]
      ),
      keycodes(
        [Keycode.PS4_LS_LEFT],
        [Keycode.PS4_LS_RIGHT],
        [Keycode.PS4_LS_UP],
        [Keycode.PS4_LS_DOWN]
      )
    ],
    [NavScheme.DPAD]: [
      keycodes(
        [Keycode.PS4_DPAD_LEFT],
        [Keycode.PS4_DPAD_RIGHT],
        [Keycode.PS4_DPAD_UP],
        [Keycode.PS4_DPAD_DOWN]
      )
    ],
    [NavScheme.LEFT_STICK]: [
      keycodes(
        [Keycode.PS4_LS_LEFT],
        [Keycode.PS4_LS_RIGHT],
        [Keycode.PS4_LS_UP],
        [Keycode.PS4_LS_DOWN]
      )
    ],
    [NavScheme.RIGHT_STICK]: [
      keycodes(
        [Keycode.PS4_RS_LEFT],
        [Keycode.PS4_RS_RIGHT],
        [Keycode.PS4_RS_UP],
        [Keycode.PS4_RS_DOWN]
      )
    ],
    [NavScheme.SHOULDER_BUTTONS]: [
      keycodes(
        [Keycode.PS4_L1],
        [Keycode.PS4_R1],
        [],
        []
      )
    ],
    [NavScheme.TRIGGER_BUTTONS]: [
      keycodes(
        [Keycode.PS4_L2],
        [Keycode.PS4_R2],
        [],
        []
      )
    ]
  },
  [Device.SWITCH_PRO]: {
    [NavScheme.DPAD_AND_LEFT_STICK]: [
      keycodes(
        [Keycode.SWITCH_DPAD_LEFT],
        [Keycode.SWITCH_DPAD_RIGHT],
        [Keycode.SWITCH_DPAD_UP],
        [Keycode.SWITCH_DPAD_DOWN]
      ),
      keycodes(
        [Keycode.SWITCH_LS_LEFT],
        [Keycode.SWITCH_LS_RIGHT],
        [Keycode.SWITCH_LS_UP],
        [Keycode.SWITCH_LS_DOWN]
      )
    ],
    [NavScheme.DPAD]: [
      keycodes(
        [Keycode.SWITCH_DPAD_LEFT],
        [Keycode.SWITCH_DPAD_RIGHT],
        [Keycode.SWITCH_DPAD_UP],
        [Keycode.SWITCH_DPAD_DOWN]
      )
    ],
    [NavScheme.LEFT_STICK]: [
      keycodes(
        [Keycode.SWITCH_LS_LEFT],
        [Keycode.SWITCH_LS_RIGHT],
        [Keycode.SWITCH_LS_UP],
        [Keycode.SWITCH_LS_DOWN]
      )
    ],
    [NavScheme.RIGHT_STICK]: [
      keycodes(
        [Keycode.SWITCH_RS_LEFT],
        [Keycode.SWITCH_RS_RIGHT],
        [Keycode.SWITCH_RS_UP],
        [Keycode.SWITCH_RS_DOWN]
      )
    ],
    [NavScheme.SHOULDER_BUTTONS]: [
      keycodes(
        [Keycode.SWITCH_L],
        [Keycode.SWITCH_R],
        [],
        []
      )
    ],
    [NavScheme.TRIGGER_BUTTONS]: [
      keycodes(
        [Keycode.SWITCH_ZL],
        [Keycode.SWITCH_ZR],
        [],
        []
      )
    ]
  },
  [Device.KEYBOARD]: {
    [NavScheme.WASD]: [
      keycodes(
        [Keycode.KBD_A],
        [Keycode.KBD_D],
        [Keycode.KBD_W],
        [Keycode.KBD_S]
      )
    ],
    [NavScheme.ARROW_KEYS]: [
      keycodes(
        [Keycode.KBD_ARROW_LEFT],
        [Keycode.KBD_ARROW_RIGHT],
        [Keycode.KBD_ARROW_UP],
        [Keycode.KBD_ARROW_DOWN]
      )
    ],
    [NavScheme.QE]: [
      keycodes(
        [Keycode.KBD_Q],
        [Keycode.KBD_E],
        [],
        []
      )
    ],
    [NavScheme.TAB]: [
      keycodes(
        [Keycode.KBD_SHIFT, Keycode.KBD_TAB],
        [Keycode.KBD_TAB],
        [],
        []
      )
    ]
  }
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
    const keycodesList = NAVIGATION_KEYCODE_LOOKUP[device]?.[scheme]
    return keycodesList?.map((keycode) => new NavigationKeycodes(
      [...keycode.left],
      [...keycode.right],
      [...keycode.up],
      [...keycode.down]
    ))
  }
  
}
