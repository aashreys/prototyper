import { VerticalSpace, SegmentedControl, SegmentedControlOption, Text } from '@create-figma-plugin/ui'
import { h, JSX, Component, Fragment } from 'preact'
import { useState } from 'preact/hooks'
import { Device } from '../device';

const XBOX = 'Xbox One'

const DeviceSelect = function (props) {

  const [value, setValue] = useState(props.value)

  const options: Array<SegmentedControlOption> = [
    { value: XBOX },
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
    console.log('Device UI value changed:' + deviceUiValue);
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
    }
  }

  getConfigValueFromUi(uiValue) {
    switch (uiValue) {
      case XBOX: return Device.XBOX;
    }
  }

}