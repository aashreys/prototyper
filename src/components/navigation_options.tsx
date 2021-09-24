import { Dropdown, DropdownOption, VerticalSpace, Text } from '@create-figma-plugin/ui'
import { Component, Fragment, h, JSX } from 'preact'
import { useState } from 'preact/hooks'
import { NavScheme } from '../navigation';

const DPAD = 'D-Pad'
const LEFT_STICK = 'Left Stick'
const RIGHT_STICK = 'Right Stick'

const NavigationSelect = function (props) {

  const [value, setValue] = useState<null | string>(props.value)

  const options: Array<DropdownOption> = [
    { value: DPAD },
    { value: LEFT_STICK },
    { value: RIGHT_STICK }
  ]

  function handleChange(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    setValue(newValue)
    props.onNavChange(newValue);
  }

  return (
    <Dropdown onChange={handleChange} options={options} value={value} />
  )

}

export class NavigationOptions extends Component<any, any> {

  constructor(props) {
    super(props)
    this.bindMethods();
  }

  bindMethods() {
    this.onNavChange = this.onNavChange.bind(this);
  }

  onNavChange(navSchemeUiValue: string) {
    this.props.onNavChange(this.getConfigValueFromUi(navSchemeUiValue));
  }

  render(props, state) {
    return (
      <Fragment>
        <Text bold>Navigate With</Text>
        <VerticalSpace space='small' />
        <NavigationSelect onNavChange={this.onNavChange} value={this.getUiValueFromConfig(props.value)} />
      </Fragment>
    )
  }

  getUiValueFromConfig(scheme: NavScheme) {
    switch (scheme) {
      case NavScheme.DPAD: return DPAD;
      case NavScheme.LEFT_STICK: return LEFT_STICK;
      case NavScheme.RIGHT_STICK: return RIGHT_STICK;
    }
  }

  getConfigValueFromUi(uiValue) {
    switch (uiValue) {
      case DPAD: return NavScheme.DPAD;
      case LEFT_STICK: return NavScheme.LEFT_STICK
      case RIGHT_STICK: return NavScheme.RIGHT_STICK
    }
  }

}