import { Dropdown, DropdownOption, VerticalSpace, Text, SegmentedControlOption, SegmentedControl } from '@create-figma-plugin/ui'
import { Component, Fragment, h } from 'preact'
import { Device } from '../device';
import { ControllerIcon } from '../icons/controller';
import { DPadIcon } from '../icons/dpad';
import { FaceButtonsIcon } from '../icons/face_buttons';
import { KeyboardArrowKeys } from '../icons/kbd_arrow_keys';
import { KeyboardQe } from '../icons/kbd_qe';
import { KeyboardShiftTab } from '../icons/kbd_shift_tab';
import { KeyboardWasd } from '../icons/kbd_wasd';
import { KeyboardIcon } from '../icons/keyboard';
import { LeftStickIcon } from '../icons/left_stick';
import { RightStickIcon } from '../icons/right_stick';
import { ShoulderButtonsIcon } from '../icons/shoulder_buttons';
import { TriggerButtonsIcon } from '../icons/trigger_buttons';
import { Navigation, NavigationKeycodes, NavScheme } from '../navigation';
import { CustomInput } from './custom_input';

const XBOX = 'Xbox'
const PS4 = 'PlayStation'
const SWITCH = 'Switch Pro'
const KEYBOARD = 'Keyboard'

// Controller
const DPAD = 'D-Pad'
const LEFT_STICK = 'Left Stick'
const RIGHT_STICK = 'Right Stick'
const SHOULDER_BUTTONS = 'Shoulder Buttons'
const TRIGGER_BUTTONS = 'Trigger Buttons'

// Keyboard
const WASD = 'WASD'
const ARROW_KEYS = 'Arrow Keys'
const QE = 'Q & E'
const TAB = 'Tab & ⇧Tab'

// Custom
const CUSTOM = 'Custom'

const CONTROLLER_OPTIONS: Array<DropdownOption> = [
  { value: DPAD },
  { value: LEFT_STICK },
  { value: RIGHT_STICK },
  { separator: true },
  { header: 'Horizontal' },
  { value: SHOULDER_BUTTONS },
  { value: TRIGGER_BUTTONS },
  { separator: true },
  { value: CUSTOM },
]

const KEYBOARD_OPTIONS: Array<DropdownOption> = [
  { value: ARROW_KEYS },
  { value: WASD },
  { separator: true },
  { header: 'Horizontal' },
  { value: QE },
  { value: TAB },
  { separator: true },
  { value: CUSTOM },
]

const DEVICES: Array<DropdownOption> = [
  { value: XBOX },
  { value: PS4 },
  { value: SWITCH },
  { separator: true },
  { value: KEYBOARD },
]

export class NavigationOptions extends Component<any, any> {

  constructor(props) {
    super(props)
    this.bindMethods()
  }

  bindMethods() {
    this.onSchemeChange = this.onSchemeChange.bind(this)
    this.onDeviceChange = this.onDeviceChange.bind(this)
    this.onCustomInputChange = this.onCustomInputChange.bind(this)
  }

  onSchemeChange(navSchemeUiValue: string) {
    let scheme = this.getConfigValueFromUi(navSchemeUiValue) as NavScheme
    this.props.onNavigationChange(
      new Navigation(
        this.props.activeNavigation.device,
        scheme,
        this.props.activeNavigation.customKeycodes
      )
    )
  }

  onDeviceChange(deviceUiValue: string) {
    let device: Device = this.getConfigValueFromUi(deviceUiValue) as Device

    let navigation: Navigation
    if (device === Device.KEYBOARD) {
      navigation = new Navigation(device, this.props.keyboardNavigation.scheme, this.props.keyboardNavigation.customKeycodes)
    }
    else {
      navigation = new Navigation(device, this.props.controllerNavigation.scheme, this.props.controllerNavigation.customKeycodes)
    }

    this.props.onNavigationChange(navigation)
  }

  onCustomInputChange(keycodes: NavigationKeycodes) {
    this.props.onNavigationChange(
      new Navigation(
        this.props.activeNavigation.device,
        this.props.activeNavigation.scheme,
        keycodes
      )
    )
  }

  render(props, state) {
    let navigation = props.activeNavigation
    return (
      <div style={props.style ? props.style : ''}>

        <Text style={'margin-left: 8px'} bold>Navigate With</Text>

        <VerticalSpace space='small' />

        <div style='display: flex'>

          <Dropdown
          icon={this.getIcon(this.getUiValueFromConfig(navigation.device))}
          onChange={e => this.onDeviceChange(e.currentTarget.value)} 
          options={DEVICES} 
          value={this.getUiValueFromConfig(navigation.device)}
          noBorder />

          <Dropdown
          style={'flex-grow: 1'}
          icon={this.getIcon(this.getUiValueFromConfig(navigation.scheme))}
          onChange={e => this.onSchemeChange(e.currentTarget.value)} 
          options={navigation.device === Device.KEYBOARD ? KEYBOARD_OPTIONS : CONTROLLER_OPTIONS} 
          value={this.getUiValueFromConfig(navigation.scheme)}
          noBorder />

        </div>

        {
          navigation.scheme === NavScheme.CUSTOM &&
          <Fragment>
            <CustomInput
            device={navigation.device}
            keycodes={navigation.customKeycodes}
            onCustomInputChange={this.onCustomInputChange}
            showError={props.showCustomInputError}
            />
          </Fragment>
        }
      </div>
    )
  }

  getUiValueFromConfig(configValue: NavScheme | Device): string {
    switch (configValue) {
      // Controller Nav
      case NavScheme.DPAD: return DPAD
      case NavScheme.LEFT_STICK: return LEFT_STICK
      case NavScheme.RIGHT_STICK: return RIGHT_STICK
      case NavScheme.SHOULDER_BUTTONS: return SHOULDER_BUTTONS
      case NavScheme.TRIGGER_BUTTONS: return TRIGGER_BUTTONS
      
      // Keyboard Nav
      case NavScheme.ARROW_KEYS: return ARROW_KEYS
      case NavScheme.WASD: return WASD
      case NavScheme.QE: return QE
      case NavScheme.TAB: return TAB

      // Custom Nav
      case NavScheme.CUSTOM: return CUSTOM

      // Devices
      case Device.XBOX: return XBOX
      case Device.PS4: return PS4
      case Device.SWITCH_PRO: return SWITCH
      case Device.KEYBOARD: return KEYBOARD
    }
  }

  getConfigValueFromUi(uiValue: string): NavScheme | Device {
    switch (uiValue) {
      // Controller Nav
      case DPAD: return NavScheme.DPAD
      case LEFT_STICK: return NavScheme.LEFT_STICK
      case RIGHT_STICK: return NavScheme.RIGHT_STICK
      case SHOULDER_BUTTONS: return NavScheme.SHOULDER_BUTTONS
      case TRIGGER_BUTTONS: return NavScheme.TRIGGER_BUTTONS

      // Keyboard Nav
      case ARROW_KEYS: return NavScheme.ARROW_KEYS
      case WASD: return NavScheme.WASD
      case QE: return NavScheme.QE
      case TAB: return NavScheme.TAB

      // Custom Nav
      case CUSTOM: return NavScheme.CUSTOM

      // Devices
      case XBOX: return Device.XBOX
      case PS4: return Device.PS4
      case SWITCH: return Device.SWITCH_PRO
      case KEYBOARD: return Device.KEYBOARD
    }
  }

  getIcon(value) {
    switch (value) {
      case DPAD: return <DPadIcon />
      case LEFT_STICK: return <LeftStickIcon />
      case RIGHT_STICK: return <RightStickIcon />
      case SHOULDER_BUTTONS: return <ShoulderButtonsIcon />
      case TRIGGER_BUTTONS: return <TriggerButtonsIcon />
      case CUSTOM: return <FaceButtonsIcon />
      case ARROW_KEYS: return <KeyboardArrowKeys />
      case WASD: return <KeyboardWasd />
      case QE: return <KeyboardQe />
      case TAB: return <KeyboardShiftTab />
      case XBOX: 
      case SWITCH:
      case PS4: return <ControllerIcon />
      case KEYBOARD: return <KeyboardIcon />
      default: return <DPadIcon />
    }
  }

}