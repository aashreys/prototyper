import { IconArrowDown16, IconArrowLeft16, IconArrowRight16, IconArrowUp16, Textbox, Text, VerticalSpace } from "@create-figma-plugin/ui";
import { Component, h } from "preact";
import styles from "../styles.css";
import { GamepadListener } from 'gamepad.js'
import { Device, Keycode } from "../device";

const PRESS_KEY = 'Press Key'

class CustomInputTextbox extends Component<any, any> {
  
  private gamepadListener = new GamepadListener({ 
    analog: false,
    deadZone: 0.6
  });

  constructor(props) {
    super(props)
    this.state = {isFocused: false}
    this.bindMethods()
    this.setupGamepadListeners()
  }

  bindMethods() {
    this.onKeyDownCapture = this.onKeyDownCapture.bind(this)
    this.onFocused = this.onFocused.bind(this)
    this.onUnfocused = this.onUnfocused.bind(this)
    this.setupGamepadListeners = this.setupGamepadListeners.bind(this)
    this.onGamepadButtonEvent = this.onGamepadButtonEvent.bind(this)
    this.onGamepadAxisEvent = this.onGamepadAxisEvent.bind(this)
  }

  setupGamepadListeners() {
    this.gamepadListener.on('gamepad:button', this.onGamepadButtonEvent)
    this.gamepadListener.on('gamepad:axis', this.onGamepadAxisEvent)
    this.gamepadListener.start()
  }

  componentWillUnmount() {
    this.gamepadListener.stop()
  }
  
  render(props, state) {
    return (
      <Textbox
        icon={props.icon}
        value={this.getKeyString(props.device, props.keycodes)}
        placeholder={state.isFocused ? PRESS_KEY : props.placeholder}
        onFocusCapture={this.onFocused}
        onBlurCapture={this.onUnfocused}
        onKeyDownCapture={this.onKeyDownCapture}
      />
    )
  }

  onFocused() {
    this.setState({isFocused: true});
  }

  onUnfocused() {
    this.setState({isFocused: false});
  }

  onKeyDownCapture(e) {
    if (e.keyCode === 8 || e.keyCode === 46) { // Delete or Backspace pressed
      this.props.onKeycodeChange([]) // Clear keycode
    }
  }

  onGamepadButtonEvent(event) {
    if (this.state.isFocused) {
      this.props.onKeycodeChange([event.detail.button])
    }
  }

  onGamepadAxisEvent(event) {
    if (this.state.isFocused) {
      let axisKeycode = this.getAxisKeycode(event)
      if (axisKeycode) {
        this.props.onKeycodeChange([axisKeycode])
      }
    }
  }

  getAxisKeycode(gamepadEvent): number {
    let stick = gamepadEvent.detail.stick // 0 is LStick, 1 is RStick
    let axis = gamepadEvent.detail.axis // 0 is Horizontal, 1 is Vertical
    let value = gamepadEvent.detail.value // 1 is Right or Down, -1 is Left or Up, 0 is no input

    if (stick === 0) { // Left Stick
      if (axis === 0) { // Horizontal Axis
        if (value === -1) {
          return Keycode.XBX_LS_LEFT
        } else if (value === 1) {
          return Keycode.XBX_LS_RIGHT
        } else {
          return -1
        }
      } else { // Vertical Axis
        if (value === -1) {
          return Keycode.XBX_LS_UP
        } else if (value === 1) {
          return Keycode.XBX_LS_DOWN
        } else {
          return undefined
        }
      }
    }
    else { // Right Stick
      if (axis === 0) { // Horizontal Axis
        if (value === -1) {
          return Keycode.XBX_RS_LEFT
        } else if (value === 1) {
          return Keycode.XBX_RS_RIGHT
        } else {
          return undefined
        }
      } else { // Vertical Axis
        if (value === -1) {
          return Keycode.XBX_RS_UP
        } else if (value === 1) {
          return Keycode.XBX_RS_DOWN
        } else {
          return -1
        }
      }
    }
  }
  
  getKeyString(device: Device, keycodes: Array<number>): string {
    return keycodes.length > 0 ? this.getGamepadKeyString(device, keycodes[0]) : ''
  }

  getGamepadKeyString(device: Device, keycode: number): string {
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
            case Keycode.PS4_X: return "X"
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
          }

        default: return 'Button ' + keycode
      } 
  }
}

export class CustomInput extends Component<any, any> {

  constructor(props) {
    super(props)
    this.bindMethods()
  }

  bindMethods() {
    this.onUpKeycodeChange = this.onUpKeycodeChange.bind(this)
    this.onDownKeycodeChange = this.onDownKeycodeChange.bind(this)
    this.onLeftKeycodeChange = this.onLeftKeycodeChange.bind(this)
    this.onRightKeycodeChange = this.onRightKeycodeChange.bind(this)
  }

  render(props, state) {
    return (
      <div class={styles.hideCaret} style="display: block; margin: auto">
        {
          props.showError &&
          <div style="display: block; text-align: center">
            <text class={styles.errorText}>Please specify at least one input</text>
            <VerticalSpace space="extraSmall" />
          </div>
        }
        <div>
          <div style="width: 48%; margin: auto">
            <CustomInputTextbox 
            icon={<IconArrowUp16 />}
            placeholder='Up Input'
            device={props.device}
            onKeycodeChange={this.onUpKeycodeChange}
            keycodes={props.keycodes.up} />
          </div>
        </div>
        <div style="display: flex; margin-top: var(--space-extra-small)">
          <div style="width: 48%">
            <CustomInputTextbox 
            icon={<IconArrowLeft16 />}
            placeholder='Left Input'
            device={props.device}
            onKeycodeChange={this.onLeftKeycodeChange}
            keycodes={props.keycodes.left} />
          </div>
          <div style="width: 4%"></div>
          <div style="width: 48%">
            <CustomInputTextbox 
            icon={<IconArrowRight16 />}
            placeholder='Right Input'
            device={props.device}
            onKeycodeChange={this.onRightKeycodeChange}
            keycodes={props.keycodes.right} />
          </div>
        </div>
        <div style="margin-top: var(--space-extra-small)">
          <div style="width: 48%; margin: auto">
            <CustomInputTextbox 
            icon={<IconArrowDown16 />}
            placeholder='Down Input'
            device={props.device}
            onKeycodeChange={this.onDownKeycodeChange}
            keycodes={props.keycodes.down} />
          </div>
        </div>
      </div>
    )
  }

  onUpKeycodeChange(keycode: Array<number>) {
    this.props.onCustomInputChange(
      {
        ...this.props.keycodes,
        up: keycode
      }
    )
  }

  onDownKeycodeChange(keycode: Array<number>) {
    this.props.onCustomInputChange(
      {
        ...this.props.keycodes,
        down: keycode
      }
    )
  }

  onLeftKeycodeChange(keycode: Array<number>) {
    this.props.onCustomInputChange(
      {
        ...this.props.keycodes,
        left: keycode
      }
    )
  }

  onRightKeycodeChange(keycode: Array<number>) {
    this.props.onCustomInputChange(
      {
        ...this.props.keycodes,
        right: keycode
      }
    )
  }

}