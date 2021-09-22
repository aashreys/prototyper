export class Controller {

  static getLeftNavKeycode(platform: Platform, inputScheme: InputScheme) {
    switch (platform) {
      case Platform.XBOX:
        switch (inputScheme) {
          case InputScheme.DPAD: return Keycode.XBX_DPAD_LEFT;
          case InputScheme.LEFT_STICK: return Keycode.XBX_LS_LEFT;
          case InputScheme.SHOULDER_BUTTONS: return Keycode.XBX_LB;
          case InputScheme.TRIGGER_BUTTONS: return undefined;
        }

      case Platform.PLAYSTATION:
        switch (inputScheme) {
          case InputScheme.DPAD: return undefined;
          case InputScheme.LEFT_STICK: return undefined;
          case InputScheme.SHOULDER_BUTTONS: return undefined;
          case InputScheme.TRIGGER_BUTTONS: return undefined;
        }
    }
  }
  
  static getUpNavKeycode(platform: Platform, inputScheme: InputScheme) {
    switch (platform) {
      case Platform.XBOX:
        switch (inputScheme) {
          case InputScheme.DPAD: return Keycode.XBX_DPAD_UP;
          case InputScheme.LEFT_STICK: return Keycode.XBX_LS_UP;
          case InputScheme.SHOULDER_BUTTONS: return undefined;
          case InputScheme.TRIGGER_BUTTONS: return undefined;
        }

      case Platform.PLAYSTATION:
        switch (inputScheme) {
          case InputScheme.DPAD: return undefined;
          case InputScheme.LEFT_STICK: return undefined;
          case InputScheme.SHOULDER_BUTTONS: return undefined;
          case InputScheme.TRIGGER_BUTTONS: return undefined;
        }
    }
  }

  static getRightNavKeycode(platform: Platform, inputScheme: InputScheme) {
    switch (platform) {
      case Platform.XBOX:
        switch (inputScheme) {
          case InputScheme.DPAD: return Keycode.XBX_DPAD_RIGHT;
          case InputScheme.LEFT_STICK: return Keycode.XBX_LS_RIGHT;
          case InputScheme.SHOULDER_BUTTONS: return Keycode.XBX_RB;
          case InputScheme.TRIGGER_BUTTONS: return undefined;
        }

      case Platform.PLAYSTATION:
        switch (inputScheme) {
          case InputScheme.DPAD: return undefined;
          case InputScheme.LEFT_STICK: return undefined;
          case InputScheme.SHOULDER_BUTTONS: return undefined;
          case InputScheme.TRIGGER_BUTTONS: return undefined;
        }
    }
  }

  static getDownNavKeycode(platform: Platform, inputScheme: InputScheme) {
    switch (platform) {
      case Platform.XBOX:
        switch (inputScheme) {
          case InputScheme.DPAD: return Keycode.XBX_DPAD_DOWN;
          case InputScheme.LEFT_STICK: return Keycode.XBX_LS_DOWN;
          case InputScheme.SHOULDER_BUTTONS: return undefined;
          case InputScheme.TRIGGER_BUTTONS: return undefined;
        }

      case Platform.PLAYSTATION:
        switch (inputScheme) {
          case InputScheme.DPAD: return undefined;
          case InputScheme.LEFT_STICK: return undefined;
          case InputScheme.SHOULDER_BUTTONS: return undefined;
          case InputScheme.TRIGGER_BUTTONS: return undefined;
        }
    }
  }

}

export enum InputScheme {
  DPAD = 'D-Pad',
  LEFT_STICK = 'Left Stick',
  SHOULDER_BUTTONS = 'Shoulder Buttons',
  TRIGGER_BUTTONS = 'Trigger Buttons'
}

export enum Platform {
  XBOX = 'Xbox',
  PLAYSTATION = 'PlayStation',
}

export enum Keycode {
  XBX_A = 0,
  XBX_B = 1,
  XBX_X = 2,
  XBX_Y = 3,
  XBX_LB = 4,
  XBX_RB = 5,
  XBX_LT = 6, 
  XBX_RT = 7,
  XBX_VIEW = 8,
  XBX_MENU = 9,
  XBX_LS_PRESS = 10,
  XBX_LS_LEFT = 1000,
  XBX_LS_RIGHT = 1001,
  XBX_LS_UP = 1002,
  XBX_LS_DOWN = 1003,
  XBX_RS_PRESS = 11,
  XBX_RS_LEFT = 1004,
  XBX_RS_RIGHT = 1005,
  XBX_RS_UP = 1006,
  XBX_RS_DOWN = 1007,
  XBX_DPAD_UP = 12,
  XBX_DPAD_DOWN = 13,
  XBX_DPAD_LEFT = 14,
  XBX_DPAD_RIGHT = 15,
  XBX_HOME = 16,
  XBX_SHARE = 17,
}