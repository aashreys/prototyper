import { Dropdown, DropdownOption, VerticalSpace, Text, SegmentedControlOption, SegmentedControl } from '@create-figma-plugin/ui'
import { Component, Fragment, h, JSX } from 'preact'
import { useState } from 'preact/hooks'
import { Device } from '../device';
import { DPadIcon } from '../icons/dpad';
import { LeftStickIcon } from '../icons/left_stick';
import { RightStickIcon } from '../icons/right_stick';
import { ShoulderButtonsIcon } from '../icons/shoulder_buttons';
import { TriggerButtonsIcon } from '../icons/trigger_buttons';
import { NavScheme } from '../navigation';
import { CustomInput } from './custom_inputs';

const XBOX = 'Xbox One'
const PS4 = 'PS4'
const SWITCH = 'Switch Pro'

const DPAD = 'D-Pad'
const LEFT_STICK = 'Left Stick'
const RIGHT_STICK = 'Right Stick'
const SHOULDER_BUTTONS = 'Shoulder Buttons'
const TRIGGER_BUTTONS = 'Trigger Buttons'

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

const NavigationSelect = function (props) {

  const [value, setValue] = useState<null | string>(props.value)

  const options: Array<DropdownOption> = [
    { value: DPAD },
    { value: LEFT_STICK },
    { value: RIGHT_STICK },
    { separator: true },
    { header: 'Horizontal Only' },
    { value: SHOULDER_BUTTONS },
    { value: TRIGGER_BUTTONS },
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
    }
  }

  return (
    <Dropdown icon={getIcon(value)} onChange={handleChange} options={options} value={value} />
  )

}

export class NavigationOptions extends Component<any, any> {

  constructor(props) {
    super(props)
    this.bindMethods();
  }

  bindMethods() {
    this.onNavChange = this.onNavChange.bind(this);
    this.onDeviceChange = this.onDeviceChange.bind(this);
  }

  onNavChange(navSchemeUiValue: string) {
    this.props.onNavChange(this.getConfigValueFromUi(navSchemeUiValue));
  }

  onDeviceChange(deviceUiValue: string) {
    this.props.onDeviceChange(this.getConfigValueFromUi(deviceUiValue));
  }

  render(props, state) {
    return (
      <Fragment>
        <Text bold>Navigate With</Text>
        <VerticalSpace space='small' />
        <DeviceSelect onDeviceChange={this.onDeviceChange} value={this.getUiValueFromConfig(props.device)} />
        <VerticalSpace space='extraSmall' />
        <NavigationSelect onNavChange={this.onNavChange} value={this.getUiValueFromConfig(props.navigation)} />
        <VerticalSpace space='extraSmall' />
        <CustomInput />
      </Fragment>
    )
  }

  getUiValueFromConfig(configValue) {
    switch (configValue) {
      case NavScheme.DPAD: return DPAD
      case NavScheme.LEFT_STICK: return LEFT_STICK
      case NavScheme.RIGHT_STICK: return RIGHT_STICK
      case NavScheme.SHOULDER_BUTTONS: return SHOULDER_BUTTONS
      case NavScheme.TRIGGER_BUTTONS: return TRIGGER_BUTTONS
      case Device.XBOX: return XBOX
      case Device.PS4: return PS4
      case Device.SWITCH_PRO: return SWITCH
    }
  }

  getConfigValueFromUi(uiValue) {
    switch (uiValue) {
      case DPAD: return NavScheme.DPAD
      case LEFT_STICK: return NavScheme.LEFT_STICK
      case RIGHT_STICK: return NavScheme.RIGHT_STICK
      case SHOULDER_BUTTONS: return NavScheme.SHOULDER_BUTTONS
      case TRIGGER_BUTTONS: return NavScheme.TRIGGER_BUTTONS
      case XBOX: return Device.XBOX
      case PS4: return Device.PS4
      case SWITCH: return Device.SWITCH_PRO
    }
  }

}