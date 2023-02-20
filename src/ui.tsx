import { render, Tabs, TabsOption } from '@create-figma-plugin/ui'
import { Component, h } from 'preact';
import { PrototypeForm } from './prototype_form';
import { emit, on } from '@create-figma-plugin/utilities';
import { Constants } from './constants';
import { Mode } from './main';
import { OnboardingBanner } from './components/onboarding_banner';
import { StatsPage } from './stats_ui';
import { Config } from './config';
import { StatsModel } from './stats';

const BUTTON_GENERATE = 'Generate Prototype'
const BUTTON_LINK = 'Link Frames'

const GENERATE_MESSAGE = "Select 2 or more component instances in the same top-level frame to generate a prototype."

const LINK_MESSAGE = "Select 2 or more top-level frames to link into a prototype."

const TAB_GENERATE = 'Generate'
const TAB_LINK = 'Link'
const TAB_STATS = 'Stats'

const HEIGHT_OFFSET = 16

export class UI extends Component<{ config: Config }, { activeTab: string, isOnboardingComplete: boolean, stats: StatsModel}> {

  constructor(props) {
    super(props);
    this.state = {
      activeTab: TAB_GENERATE,
      isOnboardingComplete: true,
      stats: {
        secondsSaved: 0,
        prototypesCreated: 0,
        framesDuped: 0,
        statesChanged: 0,
        interactionsCreated: 0
      }
    }
    this.bindMethods()
    this.registerEventListeners()
    this.requestStats()
  }

  bindMethods() {
    this.onTabChange = this.onTabChange.bind(this)
    this.componentDidUpdate = this.componentDidUpdate.bind(this)
    this.registerEventListeners = this.registerEventListeners.bind(this)
    this.updateOnboardingComplete = this.updateOnboardingComplete.bind(this)
    this.onOnboardingDismiss = this.onOnboardingDismiss.bind(this)
    this.requestStats = this.requestStats.bind(this)
  }

  registerEventListeners() {
    on(Constants.EVENT_ONBOARDING_STATUS_LOADED, (isComplete) => {
      this.updateOnboardingComplete(isComplete)
    })
    on(Constants.EVENT_RECEIVE_STATS, (stats) => {
      this.setState(prevState => ({
        stats: stats,
      }))
    })
  }

  requestStats() {
    emit(Constants.EVENT_REQUEST_STATS)
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

  onTabChange(tab) {
    if (tab !== this.state.activeTab) {
      this.setState(prevState => ({
        activeTab: tab,
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
      <div>

        {
          !state.isOnboardingComplete &&
          <OnboardingBanner onDismiss={this.onOnboardingDismiss} />
        }

        <Tabs 
        onChange={e => this.onTabChange(e.currentTarget.value)} 
        value={this.state.activeTab}
        options={
          [
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
            {
              children:
                <StatsPage stats={this.state.stats} />,
              value: TAB_STATS
            }
          ]
        } />

      </div>
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