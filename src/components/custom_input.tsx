import { IconArrowDown16, IconArrowLeft16, IconArrowRight16, IconArrowUp16, Textbox } from "@create-figma-plugin/ui";
import { Component, h } from "preact";
import { GamepadListener } from 'gamepad.js'
import { Device, Keycode, KeycodeUtils } from "../device";
import { OS, Utils } from "../utils";
import { KeyboardKeycodes } from "../keyboard_keycodes";
import styles from "../styles.css";

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
    this.clearInput = this.clearInput.bind(this)
    this.onKeyboardEvent = this.onKeyboardEvent.bind(this)
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
      onKeyDownCapture={this.onKeyDownCapture} />
    )
  }

  onFocused() {
    this.setState({isFocused: true});
  }

  onUnfocused() {
    this.setState({isFocused: false});
  }

  onKeyDownCapture(event) {
    // Clear keycode when Backspace is pressed
    if (event.keyCode === Keycode.KBD_BACKSPC) this.clearInput()
    // If keycode is not just a modifer press, consume it as a custom input
    else if (!this.isModifierKeyCode(event.keyCode)) this.onKeyboardEvent(event)
    
    event.preventDefault() // Stop textbox from displaying regular keyboard input
  }

  isModifierKeyCode(keycode: number) {
    return keycode === Keycode.KBD_SHIFT || keycode === Keycode.KBD_CTRL || keycode === Keycode.KBD_ALT || keycode === Keycode.KBD_META
  }

  clearInput() {
    this.props.onKeycodeChange([])
  }

  onKeyboardEvent(event: KeyboardEvent) {
    let keycodes: number[] = []
    keycodes.push(event.keyCode)
    if (event.metaKey) keycodes.push(Keycode.KBD_META)
    if (event.ctrlKey) keycodes.push(Keycode.KBD_CTRL)
    if (event.altKey) keycodes.push(Keycode.KBD_ALT)
    if (event.shiftKey) keycodes.push(Keycode.KBD_SHIFT)
    this.props.onKeycodeChange(keycodes)
  }
  

  onGamepadButtonEvent(event) {
    if (this.state.isFocused) {
      this.props.onKeycodeChange([event.detail.button])
    }
  }

  onGamepadAxisEvent(event) {
    if (this.state.isFocused) {
      let axisKeycode = this.getAxisKeycode(event)
      if (axisKeycode && axisKeycode > 0) { // Use > 0 value because axis reset keycode is -1
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
  
  getKeyString(device: Device, keycodes: number[]): string {
    if (keycodes.length > 0) {
      if (device === Device.KEYBOARD) {
        return this.getKeyboardKeyString(keycodes)
      } else {
        return KeycodeUtils.getControllerString(device, keycodes[0])
      }
    } else {
      return ''
    }
  }

  getKeyboardKeyString(keycodes: number[]) {
    let os = Utils.getOs()
    let string = ''
    

    switch (os) {
      case OS.MAC_OS: {
        for (let i = keycodes.length - 1; i >= 0; i--) {
          switch(keycodes[i]) {
            case Keycode.KBD_META: string = string + '⌘'; break;
            case Keycode.KBD_CTRL: string = string + '⌃'; break;
            case Keycode.KBD_ALT: string = string + '⌥'; break;
            case Keycode.KBD_SHIFT: string = string + '⇧'; break;
            default: string = string + KeyboardKeycodes.getKeyString(keycodes[i]); break;
          }
        }
        break
      }

      case OS.WINDOWS: {
        for (let i = keycodes.length - 1; i >= 0; i--) {
          switch(keycodes[i]) {
            case Keycode.KBD_META: string = string + '⌘+'; break;
            case Keycode.KBD_CTRL: string = string + 'Ctrl+'; break;
            case Keycode.KBD_ALT: string = string + 'Alt+'; break;
            case Keycode.KBD_SHIFT: string = string + 'Shift+'; break;
            default: string = string + KeyboardKeycodes.getKeyString(keycodes[i]); break;
          }
        }
        break
      }

      case OS.OTHER: {
        for (let i = keycodes.length - 1; i >= 0; i--) {
          switch(keycodes[i]) {
            case Keycode.KBD_META: string = string + '⌘+'; break;
            case Keycode.KBD_CTRL: string = string + 'Ctrl+'; break;
            case Keycode.KBD_ALT: string = string + 'Alt+'; break;
            case Keycode.KBD_SHIFT: string = string + 'Shift+'; break;
            default: string = string + KeyboardKeycodes.getKeyString(keycodes[i]); break;
          }
        }
        break
      }
    }

    return string
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
      <div style="display: block; margin: auto; caret-color: transparent;">
        {
          props.showError &&
          <div style={'margin-top: 12px; text-align: center'}>
            <text class={styles.errorText}>Please specify at least one input</text>
          </div>
        }

        <div style="width: 50%; margin: auto; margin-top: 4px;">
          <CustomInputTextbox 
          icon={<IconArrowUp16 />}
          placeholder='Up Input'
          device={props.device}
          onKeycodeChange={this.onUpKeycodeChange}
          keycodes={props.keycodes.up} />
        </div>

        <div style="display: flex; margin-top: 4px">
          <div style="width: 50%;">
            <CustomInputTextbox 
            icon={<IconArrowLeft16 />}
            placeholder='Left Input'
            device={props.device}
            onKeycodeChange={this.onLeftKeycodeChange}
            keycodes={props.keycodes.left} />
          </div>

          <div style="width: 50%;">
            <CustomInputTextbox 
            icon={<IconArrowRight16 />}
            placeholder='Right Input'
            device={props.device}
            onKeycodeChange={this.onRightKeycodeChange}
            keycodes={props.keycodes.right} />
          </div>

        </div>
        
        <div style="width: 50%; margin: auto; margin-top: 4px;">
            <CustomInputTextbox 
            icon={<IconArrowDown16 />}
            placeholder='Down Input'
            device={props.device}
            onKeycodeChange={this.onDownKeycodeChange}
            keycodes={props.keycodes.down} />
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