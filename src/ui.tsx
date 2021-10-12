import { render, Stack, Tabs, TabsOption } from '@create-figma-plugin/ui'
import { useState } from 'preact/hooks';
import { Component, h, JSX } from 'preact';
import { PrototypeForm } from './prototype_form';
import { emit } from '@create-figma-plugin/utilities';
import { Constants } from './constants';
import { Mode } from './main';

const BUTTON_GENERATE = 'Generate Prototype'
const BUTTON_LINK = 'Link Frames'

const GENERATE_MESSAGE = "Generate a prototype from selected components instances within a single top-level frame."
const LINK_MESSAGE = "Link selected top-level frames into a prototype based on their relative position."

const TAB_GENERATE = 'Generate'
const TAB_LINK = 'Link'

const UITabs = function (props) {
  const [value, setValue] = useState(props.value)
  function handleChange(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    setValue(newValue)
    props.onTabSet(newValue);
  }
  return <Tabs onChange={handleChange} options={props.options} value={value} />
}

export class UI extends Component<any, any> {

  tabs: Array<TabsOption> = [
    {
      children:
        <PrototypeForm
          value={this.props.config}
          mode={Mode.GENERATE}
          buttonTitle={BUTTON_GENERATE}
          uiMessage={GENERATE_MESSAGE}
          buttonEvent={Constants.EVENT_GENERATE}
        />,
      value: TAB_GENERATE
    },
    {
      children:
        <PrototypeForm
          value={this.props.config}
          mode={Mode.LINK}
          buttonTitle={BUTTON_LINK}
          uiMessage={LINK_MESSAGE}
          buttonEvent={Constants.EVENT_LINK}
        />,
      value: TAB_LINK
    },
  ]

  constructor(props) {
    super(props);
    this.state = {
      activeTab: TAB_GENERATE
    }
    this.bindMethods()
  }

  bindMethods() {
    this.onTabSet = this.onTabSet.bind(this)
    this.componentDidUpdate = this.componentDidUpdate.bind(this)
  }

  onTabSet(value) {
    if (value !== this.state.activeTab) {
      this.setState(prevState => ({
        activeTab: value,
      }))
      emit(Constants.EVENT_TAB_SWTICH)
    }
  }

  componentDidUpdate() {
    emit(Constants.EVENT_UI_RESIZE, UI.getUIHeight())
  }

  render(props, state) {
    return (
      <Stack space="extraSmall">
        <UITabs 
          options={this.tabs} 
          value={TAB_GENERATE} 
          onTabSet={this.onTabSet}
        />
      </Stack>
      
    )
  }

  static getUIHeight() {
    return document.getElementById('create-figma-plugin').clientHeight;
  }

}

function Plugin(props) {
  return (<UI config={props} />)
}

export default render(Plugin)