import { Dropdown, DropdownOption, VerticalSpace, Text, SegmentedControlOption, SegmentedControl } from '@create-figma-plugin/ui'
import { Component, Fragment, h, JSX } from 'preact'
import { useState } from 'preact/hooks'
import { Device } from '../device';
import { DPadIcon } from '../icons/dpad';
import { FaceButtonsIcon } from '../icons/face_buttons';
import { LeftStickIcon } from '../icons/left_stick';
import { RightStickIcon } from '../icons/right_stick';
import { ShoulderButtonsIcon } from '../icons/shoulder_buttons';
import { TriggerButtonsIcon } from '../icons/trigger_buttons';
import { Navigation, NavigationKeycodes, NavScheme } from '../navigation';
import { CustomInput } from './custom_input';

const XBOX = 'Xbox One'
const PS4 = 'PS4'
const SWITCH = 'Switch Pro'

const DPAD = 'D-Pad'
const LEFT_STICK = 'Left Stick'
const RIGHT_STICK = 'Right Stick'
const SHOULDER_BUTTONS = 'Shoulder Buttons'
const TRIGGER_BUTTONS = 'Trigger Buttons'
const CUSTOM = 'Custom'

const DeviceSelect = function (props) {

  const [value, setValue] = useState(props.value)

  const options: Array<SegmentedControlOption> = [
    { value: XBOX },
    { value: PS4 },
    { value: SWITCH },
  ]

  function handleChange(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    setValue(newValue)
    props.onDeviceChange(newValue);
  }

  return (
    <SegmentedControl onChange={handleChange} options={options} value={value} />
  )

}

const SchemeSelect = function (props) {

  const [value, setValue] = useState<null | string>(props.value)

  const options: Array<DropdownOption> = [
    { value: DPAD },
    { value: LEFT_STICK },
    { value: RIGHT_STICK },
    { separator: true },
    { value: SHOULDER_BUTTONS },
    { value: TRIGGER_BUTTONS },
    { separator: true },
    { value: CUSTOM },
  ]

  function handleChange(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    setValue(newValue)
    props.onNavChange(newValue);
  }

  function getIcon(value) {
    switch (value) {
      case DPAD: return <DPadIcon />
      case LEFT_STICK: return <LeftStickIcon />
      case RIGHT_STICK: return <RightStickIcon />
      case SHOULDER_BUTTONS: return <ShoulderButtonsIcon />
      case TRIGGER_BUTTONS: return <TriggerButtonsIcon />
      case CUSTOM: return <FaceButtonsIcon />
    }
  }

  return (
    <Dropdown icon={getIcon(value)} onChange={handleChange} options={options} value={value} />
  )

}

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
        this.props.navigation.device,
        scheme,
        this.props.navigation.customKeycodes
      )
    )
  }

  onDeviceChange(deviceUiValue: string) {
    let device = this.getConfigValueFromUi(deviceUiValue) as Device
    this.props.onNavigationChange(
      new Navigation(
        device,
        this.props.navigation.scheme,
        this.props.navigation.customKeycodes
      )
    )
  }

  onCustomInputChange(keycodes: NavigationKeycodes) {
    this.props.onNavigationChange(
      new Navigation(
        this.props.navigation.device,
        this.props.navigation.scheme,
        keycodes
      )
    )
  }

  render(props, state) {
    return (
      <Fragment>
        <Text bold>Navigate With</Text>
        <VerticalSpace space='small' />
        <DeviceSelect onDeviceChange={this.onDeviceChange} value={this.getUiValueFromConfig(props.navigation.device)} />
        <VerticalSpace space='extraSmall' />
        <SchemeSelect onNavChange={this.onSchemeChange} value={this.getUiValueFromConfig(props.navigation.scheme)} />
        {
          props.navigation.scheme === NavScheme.CUSTOM &&
          <Fragment>
            <VerticalSpace space='medium' />
            <CustomInput
            device={props.navigation.device}
            keycodes={props.navigation.customKeycodes}
            onCustomInputChange={this.onCustomInputChange}
            showError={props.showCustomInputError}
            />
          </Fragment>
        }
      </Fragment>
    )
  }

  getUiValueFromConfig(configValue): string {
    switch (configValue) {
      case NavScheme.DPAD: return DPAD
      case NavScheme.LEFT_STICK: return LEFT_STICK
      case NavScheme.RIGHT_STICK: return RIGHT_STICK
      case NavScheme.SHOULDER_BUTTONS: return SHOULDER_BUTTONS
      case NavScheme.TRIGGER_BUTTONS: return TRIGGER_BUTTONS
      case NavScheme.CUSTOM: return CUSTOM
      case Device.XBOX: return XBOX
      case Device.PS4: return PS4
      case Device.SWITCH_PRO: return SWITCH
    }
  }

  getConfigValueFromUi(uiValue): NavScheme | Device {
    switch (uiValue) {
      case DPAD: return NavScheme.DPAD
      case LEFT_STICK: return NavScheme.LEFT_STICK
      case RIGHT_STICK: return NavScheme.RIGHT_STICK
      case SHOULDER_BUTTONS: return NavScheme.SHOULDER_BUTTONS
      case TRIGGER_BUTTONS: return NavScheme.TRIGGER_BUTTONS
      case CUSTOM: return NavScheme.CUSTOM
      case XBOX: return Device.XBOX
      case PS4: return Device.PS4
      case SWITCH: return Device.SWITCH_PRO
    }
  }

}