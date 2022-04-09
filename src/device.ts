export enum Device {
  XBOX = 'XBOX_ONE',
  PS4 = 'PS4',
  SWITCH_PRO = 'SWITCH_PRO',
  KEYBOARD = 'KEYBOARD',
  // UNKNOWN_CONTROLLER = 'UNKNOWN_CONTROLLER',
  // MOUSE = 'MOUSE'
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
  XBX_RS_PRESS = 11,
  XBX_DPAD_UP = 12,
  XBX_DPAD_DOWN = 13,
  XBX_DPAD_LEFT = 14,
  XBX_DPAD_RIGHT = 15,
  XBX_HOME = 16,
  XBX_SHARE = 17,
  XBX_LS_LEFT = 1000,
  XBX_LS_RIGHT = 1001,
  XBX_LS_UP = 1002,
  XBX_LS_DOWN = 1003,
  XBX_RS_LEFT = 1004,
  XBX_RS_RIGHT = 1005,
  XBX_RS_UP = 1006,
  XBX_RS_DOWN = 1007,

  PS4_X = 0,
  PS4_CIRCLE = 1,
  PS4_SQUARE = 2,
  PS4_TRIANGLE = 3,
  PS4_L1 = 4,
  PS4_R1 = 5,
  PS4_L2 = 6,
  PS4_R2 = 7,
  PS4_SHARE = 8,
  PS4_OPTIONS = 9,
  PS4_L3 = 10,
  PS4_R3 = 11,
  PS4_DPAD_UP = 12,
  PS4_DPAD_DOWN = 13,
  PS4_DPAD_LEFT = 14,
  PS4_DPAD_RIGHT = 15,
  PS4_HOME = 16,
  PS4_TOUCHPAD = 17,
  PS4_LS_LEFT = 1000,
  PS4_LS_RIGHT = 1001,
  PS4_LS_UP = 1002,
  PS4_LS_DOWN = 1003,
  PS4_RS_LEFT = 1004,
  PS4_RS_RIGHT = 1005,
  PS4_RS_UP = 1006,
  PS4_RS_DOWN = 1007,
  
  SWITCH_B = 0,
  SWITCH_A = 1,
  SWITCH_Y = 2,
  SWITCH_X = 3,
  SWITCH_L = 4,
  SWITCH_R = 5,
  SWITCH_ZL = 6,
  SWITCH_ZR = 7,
  SWITCH_MINUS = 8,
  SWITCH_PLUS = 9,
  SWITCH_LS_PRESS = 10,
  SWITCH_RS_PRESS = 11,
  SWITCH_DPAD_UP = 12,
  SWITCH_DPAD_DOWN = 13,
  SWITCH_DPAD_LEFT = 14,
  SWITCH_DPAD_RIGHT = 15,
  SWITCH_HOME = 16,
  SWITCH_CAPTURE = 17,
  SWITCH_LS_LEFT = 1000,
  SWITCH_LS_RIGHT = 1001,
  SWITCH_LS_UP = 1002,
  SWITCH_LS_DOWN = 1003,
  SWITCH_RS_LEFT = 1004,
  SWITCH_RS_RIGHT = 1005,
  SWITCH_RS_UP = 1006,
  SWITCH_RS_DOWN = 1007,

  KBD_ARROW_UP = 38,
  KBD_ARROW_DOWN = 40,
  KBD_ARROW_LEFT = 37,
  KBD_ARROW_RIGHT = 39,
  KBD_W = 87,
  KBD_A = 65,
  KBD_S = 83,
  KBD_D = 68,
  KBD_Q = 81,
  KBD_E = 69,
  KBD_SHIFT = 16,
  KBD_TAB = 9,
  KBD_BACKSPC = 8,
  KBD_CTRL = 17,
  KBD_ALT = 18,
  KBD_META = 91, // Command or Win key

}

export class KeycodeUtils {

  private static KEYBOARD_MAP = [
    "", // [0]
    "", // [1]
    "", // [2]
    "Cancel", // [3]
    "", // [4]
    "", // [5]
    "Help", // [6]
    "", // [7]
    "Backspace", // [8]
    "Tab", // [9]
    "", // [10]
    "", // [11]
    "Clear", // [12]
    "Enter", // [13]
    "Enter", // [14] // Enter Special
    "", // [15]
    "Shift", // [16]
    "Control", // [17]
    "Alt", // [18]
    "Pause", // [19]
    "Caps Lock", // [20]
    "Kana", // [21]
    "Eisu", // [22]
    "Junja", // [23]
    "Final", // [24]
    "Hanja", // [25]
    "", // [26]
    "Esc", // [27]
    "Convert", // [28]
    "Non Convert", // [29]
    "Accept", // [30]
    "Mode Change", // [31]
    "Space", // [32]
    "Page Up", // [33]
    "Page Down", // [34]
    "End", // [35]
    "Home", // [36]
    "\u2190", // [37] // LEFT
    "\u2191", // [38] // UP
    "\u2192", // [39] // RIGHT
    "\u2193", // [40] // DOWN
    "Select", // [41]
    "Print", // [42]
    "Execute", // [43]
    "Print Screen", // [44]
    "Insert", // [45]
    "Delete", // [46]
    "", // [47]
    "0", // [48]
    "1", // [49]
    "2", // [50]
    "3", // [51]
    "4", // [52]
    "5", // [53]
    "6", // [54]
    "7", // [55]
    "8", // [56]
    "9", // [57]
    ":", // [58]
    ";", // [59]
    "<", // [60]
    "=", // [61]
    ">", // [62]
    "?", // [63]
    "@", // [64]
    "A", // [65]
    "B", // [66]
    "C", // [67]
    "D", // [68]
    "E", // [69]
    "F", // [70]
    "G", // [71]
    "H", // [72]
    "I", // [73]
    "J", // [74]
    "K", // [75]
    "L", // [76]
    "M", // [77]
    "N", // [78]
    "O", // [79]
    "P", // [80]
    "Q", // [81]
    "R", // [82]
    "S", // [83]
    "T", // [84]
    "U", // [85]
    "V", // [86]
    "W", // [87]
    "X", // [88]
    "Y", // [89]
    "Z", // [90]
    "OS_KEY", // [91] Windows Key (Windows) or Command Key (Mac)
    "", // [92]
    "Context", // [93]
    "", // [94]
    "Sleep", // [95]
    "Num 0", // [96]
    "Num 1", // [97]
    "Num 2", // [98]
    "Num 3", // [99]
    "Num 4", // [100]
    "Num 5", // [101]
    "Num 6", // [102]
    "Num 7", // [103]
    "Num 8", // [104]
    "Num 9", // [105]
    "Multiply", // [106]
    "Add", // [107]
    "Separator", // [108]
    "Subtract", // [109]
    "Decimal", // [110]
    "Devide", // [111]
    "F1", // [112]
    "F2", // [113]
    "F3", // [114]
    "F4", // [115]
    "F5", // [116]
    "F6", // [117]
    "F7", // [118]
    "F8", // [119]
    "F9", // [120]
    "F10", // [121]
    "F11", // [122]
    "F12", // [123]
    "F13", // [124]
    "F14", // [125]
    "F15", // [126]
    "F16", // [127]
    "F17", // [128]
    "F18", // [129]
    "F19", // [130]
    "F20", // [131]
    "F21", // [132]
    "F22", // [133]
    "F23", // [134]
    "F24", // [135]
    "", // [136]
    "", // [137]
    "", // [138]
    "", // [139]
    "", // [140]
    "", // [141]
    "", // [142]
    "", // [143]
    "Num Lock", // [144]
    "Scroll Lock", // [145]
    "WIN_OEM_FJ_JISHO", // [146]
    "WIN_OEM_FJ_MASSHOU", // [147]
    "WIN_OEM_FJ_TOUROKU", // [148]
    "WIN_OEM_FJ_LOYA", // [149]
    "WIN_OEM_FJ_ROYA", // [150]
    "", // [151]
    "", // [152]
    "", // [153]
    "", // [154]
    "", // [155]
    "", // [156]
    "", // [157]
    "", // [158]
    "", // [159]
    "CIRCUMFLEX", // [160]
    "!", // [161]
    "\"", // [162]
    "#", // [163]
    "$", // [164]
    "%", // [165]
    "&", // [166]
    "_", // [167]
    "(", // [168]
    ")", // [169]
    "*", // [170]
    "+", // [171]
    "|", // [172]
    "-", // [173]
    "{", // [174]
    "}", // [175]
    "~`", // [176]
    "", // [177]
    "", // [178]
    "", // [179]
    "", // [180]
    "Mute", // [181]
    "Volume Down", // [182]
    "Volume Up", // [183]
    "", // [184]
    "", // [185]
    ";", // [186]
    "=", // [187]
    ",", // [188]
    "-", // [189]
    ".", // [190]
    "/", // [191]
    "`", // [192]
    "", // [193]
    "", // [194]
    "", // [195]
    "", // [196]
    "", // [197]
    "", // [198]
    "", // [199]
    "", // [200]
    "", // [201]
    "", // [202]
    "", // [203]
    "", // [204]
    "", // [205]
    "", // [206]
    "", // [207]
    "", // [208]
    "", // [209]
    "", // [210]
    "", // [211]
    "", // [212]
    "", // [213]
    "", // [214]
    "", // [215]
    "", // [216]
    "", // [217]
    "", // [218]
    "[", // [219]
    "\\", // [220]
    "]", // [221]
    "'", // [222]
    "", // [223]
    "META", // [224]
    "ALTGR", // [225]
    "", // [226]
    "WIN_ICO_HELP", // [227]
    "WIN_ICO_00", // [228]
    "", // [229]
    "WIN_ICO_CLEAR", // [230]
    "", // [231]
    "", // [232]
    "WIN_OEM_RESET", // [233]
    "WIN_OEM_JUMP", // [234]
    "WIN_OEM_PA1", // [235]
    "WIN_OEM_PA2", // [236]
    "WIN_OEM_PA3", // [237]
    "WIN_OEM_WSCTRL", // [238]
    "WIN_OEM_CUSEL", // [239]
    "WIN_OEM_ATTN", // [240]
    "WIN_OEM_FINISH", // [241]
    "WIN_OEM_COPY", // [242]
    "WIN_OEM_AUTO", // [243]
    "WIN_OEM_ENLW", // [244]
    "WIN_OEM_BACKTAB", // [245]
    "ATTN", // [246]
    "CRSEL", // [247]
    "EXSEL", // [248]
    "EREOF", // [249]
    "PLAY", // [250]
    "ZOOM", // [251]
    "", // [252]
    "PA1", // [253]
    "WIN_OEM_CLEAR", // [254]
    "" // [255]
  ];

  static getKeyboardString(keycode: number) {
    if (keycode >= 0 && keycode < 256) {
      return KeycodeUtils.KEYBOARD_MAP[keycode]
    } else {
      return ''
    }
  }

  static getControllerString(device: Device, keycode: number) {
    switch (device) {
      case Device.XBOX:
        switch (keycode) {
          case Keycode.XBX_A: return "A"
          case Keycode.XBX_B: return "B"
          case Keycode.XBX_X: return "X"
          case Keycode.XBX_Y: return "Y"
          case Keycode.XBX_LB: return "LB"
          case Keycode.XBX_RB: return "RB"
          case Keycode.XBX_LT: return "LT"
          case Keycode.XBX_RT: return "RT"
          case Keycode.XBX_VIEW: return "View"
          case Keycode.XBX_MENU: return "Menu"
          case Keycode.XBX_LS_PRESS: return "LStick Press"
          case Keycode.XBX_RS_PRESS: return "RStick Press"
          case Keycode.XBX_DPAD_UP: return "DPad Up"
          case Keycode.XBX_DPAD_DOWN: return "DPad Down"
          case Keycode.XBX_DPAD_LEFT: return "DPad Left"
          case Keycode.XBX_DPAD_RIGHT: return "DPad Right"
          case Keycode.XBX_HOME: return "Home"
          case Keycode.XBX_SHARE: return "Share"
          case Keycode.XBX_LS_LEFT: return "LStick Left"
          case Keycode.XBX_LS_RIGHT: return "LStick Right"
          case Keycode.XBX_LS_UP: return "LStick Up"
          case Keycode.XBX_LS_DOWN: return "LStick Down"
          case Keycode.XBX_RS_LEFT: return "RStick Left"
          case Keycode.XBX_RS_RIGHT: return "RStick Right"
          case Keycode.XBX_RS_UP: return "RStick Up"
          case Keycode.XBX_RS_DOWN: return "RStick Down"
          default: return 'Button ' + keycode
        }

        case Device.PS4:
          switch (keycode) {
            case Keycode.PS4_X: return "Cross"
            case Keycode.PS4_CIRCLE: return "Circle"
            case Keycode.PS4_SQUARE: return "Square"
            case Keycode.PS4_TRIANGLE: return "Triangle"
            case Keycode.PS4_L1: return "L1"
            case Keycode.PS4_R1: return "R1"
            case Keycode.PS4_L2: return "L2"
            case Keycode.PS4_R2: return "R2"
            case Keycode.PS4_SHARE: return "Share"
            case Keycode.PS4_OPTIONS: return "Options"
            case Keycode.PS4_L3: return "LStick Press"
            case Keycode.PS4_R3: return "RStick Press"
            case Keycode.PS4_DPAD_UP: return "DPad Up"
            case Keycode.PS4_DPAD_DOWN: return "DPad Down"
            case Keycode.PS4_DPAD_LEFT: return "DPad Left"
            case Keycode.PS4_DPAD_RIGHT: return "DPad Right"
            case Keycode.PS4_HOME: return "Home"
            case Keycode.PS4_TOUCHPAD: return "Touchpad"
            case Keycode.PS4_LS_LEFT: return "LStick Left"
            case Keycode.PS4_LS_RIGHT: return "LStick Right"
            case Keycode.PS4_LS_UP: return "LStick Up"
            case Keycode.PS4_LS_DOWN: return "LStick Down"
            case Keycode.PS4_RS_LEFT: return "RStick Left"
            case Keycode.PS4_RS_RIGHT: return "RStick Right"
            case Keycode.PS4_RS_UP: return "RStick Up"
            case Keycode.PS4_RS_DOWN: return "RStick Down"
            default: return 'Button ' + keycode
          }

        case Device.SWITCH_PRO:
          switch (keycode) {
            case Keycode.SWITCH_B: return "B"
            case Keycode.SWITCH_A: return "A"
            case Keycode.SWITCH_Y: return "Y"
            case Keycode.SWITCH_X: return "X"
            case Keycode.SWITCH_L: return "L"
            case Keycode.SWITCH_R: return "R"
            case Keycode.SWITCH_ZL: return "ZL"
            case Keycode.SWITCH_ZR: return "ZR"
            case Keycode.SWITCH_MINUS: return "- (Switch)"
            case Keycode.SWITCH_PLUS: return "+ (Switch)"
            case Keycode.SWITCH_LS_PRESS: return "LStick Press"
            case Keycode.SWITCH_RS_PRESS: return "RStick Press"
            case Keycode.SWITCH_DPAD_UP: return "DPad Up"
            case Keycode.SWITCH_DPAD_DOWN: return "DPad Down"
            case Keycode.SWITCH_DPAD_LEFT: return "DPad Left"
            case Keycode.SWITCH_DPAD_RIGHT: return "DPad Right"
            case Keycode.SWITCH_HOME: return "Home"
            case Keycode.SWITCH_CAPTURE: return "Capture"
            case Keycode.SWITCH_LS_LEFT: return "LStick Left"
            case Keycode.SWITCH_LS_RIGHT: return "LStick Right"
            case Keycode.SWITCH_LS_UP: return "LStick Up"
            case Keycode.SWITCH_LS_DOWN: return "LStick Down"
            case Keycode.SWITCH_RS_LEFT: return "RStick Left"
            case Keycode.SWITCH_RS_RIGHT: return "RStick Right"
            case Keycode.SWITCH_RS_UP: return "RStick Up"
            case Keycode.SWITCH_RS_DOWN: return "RStick Down"
            default: return 'Button ' + keycode
          }

        default: return 'Button ' + keycode 
          
    }    
      
  }

}