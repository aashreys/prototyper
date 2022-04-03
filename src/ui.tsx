import { render, Stack, Tabs, TabsOption } from '@create-figma-plugin/ui'
import { useState } from 'preact/hooks';
import { Component, h, JSX } from 'preact';
import { PrototypeForm } from './prototype_form';
import { emit, on } from '@create-figma-plugin/utilities';
import { Constants } from './constants';
import { Mode } from './main';
import { OnboardingBanner } from './components/onboarding_banner';

const BUTTON_GENERATE = 'Generate Prototype'
const BUTTON_LINK = 'Link Frames'

const GENERATE_MESSAGE = "Select 2 or more component instances in the same top-level frame to generate a prototype."

const LINK_MESSAGE = "Select 2 or more top-level frames to link into a prototype."

const TAB_GENERATE = 'Generate'
const TAB_LINK = 'Link'

const HEIGHT_OFFSET = 16

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
      activeTab: TAB_GENERATE,
      isOnboardingComplete: true
    }
    this.bindMethods()
    this.registerEventListeners()
  }

  bindMethods() {
    this.onTabSet = this.onTabSet.bind(this)
    this.componentDidUpdate = this.componentDidUpdate.bind(this)
    this.registerEventListeners = this.registerEventListeners.bind(this)
    this.updateOnboardingComplete = this.updateOnboardingComplete.bind(this)
    this.onOnboardingDismiss = this.onOnboardingDismiss.bind(this)
  }

  registerEventListeners() {
    on(Constants.EVENT_ONBOARDING_STATUS_LOADED, (isComplete) => {
      this.updateOnboardingComplete(isComplete)
    })
  }

  updateOnboardingComplete(isComplete) {
    this.setState(prevState => ({
      ...prevState,
      isOnboardingComplete: isComplete
    }));
    if (isComplete) {
      emit(Constants.EVENT_ONBOARDING_COMPLETE)
    }
  }

  onTabSet(value) {
    if (value !== this.state.activeTab) {
      this.setState(prevState => ({
        activeTab: value,
      }))
      emit(Constants.EVENT_TAB_SWTICH)
    }
  }

  onOnboardingDismiss() {
    this.updateOnboardingComplete(true)
  }

  componentDidUpdate() {
    emit(Constants.EVENT_UI_RESIZE, UI.getUIHeight())
  }

  render(props, state) {
    return (
      <Stack>
        {
          !state.isOnboardingComplete &&
          <OnboardingBanner onDismiss={this.onOnboardingDismiss} />
        }
        <UITabs 
          options={this.tabs} 
          value={TAB_GENERATE} 
          onTabSet={this.onTabSet}
        />
      </Stack>
    )
  }

  static getUIHeight() {
    return document.getElementById('create-figma-plugin').clientHeight + HEIGHT_OFFSET;
  }

}

function Plugin(props) {
  return (<UI config={props} />)
}

export default render(Plugin)