import { VerticalSpace, SegmentedControl, SegmentedControlOption, Text } from '@create-figma-plugin/ui'
import { h, JSX, Component, Fragment } from 'preact'
import { useState } from 'preact/hooks'
import { Device } from '../device';

const XBOX = 'Xbox One'
const PS4 = 'PS4'

const DeviceSelect = function (props) {

  const [value, setValue] = useState(props.value)

  const options: Array<SegmentedControlOption> = [
    { value: XBOX },
    { value: PS4 },
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

export class DeviceOptions extends Component<any, any> {

  constructor(props) {
    super(props)
    this.bindMethods();
  }

  bindMethods() {
    this.onDeviceChange = this.onDeviceChange.bind(this);
  }

  onDeviceChange(deviceUiValue: string) {
    this.props.onDeviceChange(this.getConfigValueFromUi(deviceUiValue));
  }

  render(props, state) {
    return (
      <Fragment>
        <Text bold>Controller</Text>
        <VerticalSpace space='small' />
        <DeviceSelect onDeviceChange={this.onDeviceChange} value={this.getUiValueFromConfig(props.value)} />
      </Fragment>
    )
  }

  getUiValueFromConfig(device: Device) {
    switch (device) {
      case Device.XBOX: return XBOX;
      case Device.PS4: return PS4;
    }
  }

  getConfigValueFromUi(uiValue) {
    switch (uiValue) {
      case XBOX: return Device.XBOX;
      case PS4: return Device.PS4;
    }
  }

}