import { render, Tabs } from '@create-figma-plugin/ui'
import { Component, h } from 'preact';
import { PrototypeForm } from './prototype_form';
import { emit, on } from '@create-figma-plugin/utilities';
import { Constants } from './constants';
import { Mode } from './main';
import { OnboardingBanner } from './components/onboarding_banner';
import { StatsPage } from './stats_ui';
import { Config } from './config';
import { StatsModel } from './stats';
import {
  OnboardingStatus,
  shouldShowFocusOptionsTooltip
} from './onboarding';

const BUTTON_GENERATE = 'Generate Prototype'
const BUTTON_LINK = 'Link Frames'

const GENERATE_MESSAGE = "Select layers in the same top-level frame to generate a prototype"

const LINK_MESSAGE = "Select top-level frames to link into a prototype"

const TAB_GENERATE = 'Generate'
const TAB_LINK = 'Link'
const TAB_STATS = 'Stats'

const HEIGHT_OFFSET = 16
const SAVE_CONFIG_DEBOUNCE_MS = 250

interface UIState {
  activeTab: string
  config: Config
  isOnboardingComplete: boolean
  showFocusOptionsTooltip: boolean
  stats: StatsModel
}

export class UI extends Component<{ config: Config }, UIState> {

  private configSaveTimeout: ReturnType<typeof setTimeout> | undefined
  private pendingConfig: Config | undefined

  constructor(props) {
    super(props);
    this.state = {
      activeTab: TAB_GENERATE,
      config: props.config,
      isOnboardingComplete: true,
      showFocusOptionsTooltip: false,
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
    this.updateOnboardingStatus = this.updateOnboardingStatus.bind(this)
    this.onOnboardingDismiss = this.onOnboardingDismiss.bind(this)
    this.onFocusOptionsTooltipDismiss = this.onFocusOptionsTooltipDismiss.bind(this)
    this.requestStats = this.requestStats.bind(this)
    this.onConfigChange = this.onConfigChange.bind(this)
    this.flushConfigSave = this.flushConfigSave.bind(this)
  }

  registerEventListeners() {
    on(Constants.EVENT_ONBOARDING_STATUS_LOADED, (status) => {
      this.updateOnboardingStatus(status)
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

  updateOnboardingStatus(status: OnboardingStatus | boolean) {
    const onboardingStatus = normalizeOnboardingStatus(status)
    this.setState(prevState => ({
      ...prevState,
      isOnboardingComplete: onboardingStatus.isComplete,
      showFocusOptionsTooltip: shouldShowFocusOptionsTooltip(onboardingStatus)
    }));
  }

  onTabChange(tab) {
    if (tab !== this.state.activeTab) {
      this.flushConfigSave()
      this.setState(prevState => ({
        activeTab: tab,
      }))
      emit(Constants.EVENT_TAB_SWTICH)
    }
  }

  onOnboardingDismiss() {
    this.setState(prevState => ({
      ...prevState,
      isOnboardingComplete: true
    }))
    emit(Constants.EVENT_ONBOARDING_COMPLETE)
  }

  onFocusOptionsTooltipDismiss() {
    this.setState(prevState => ({
      ...prevState,
      showFocusOptionsTooltip: false
    }))
    emit(Constants.EVENT_FOCUS_OPTIONS_ONBOARDING_DISMISSED)
  }

  componentDidUpdate() {
    emit(Constants.EVENT_UI_RESIZE, UI.getUIHeight())
  }

  componentWillUnmount() {
    this.flushConfigSave()
  }

  onConfigChange(config: Config) {
    this.pendingConfig = config
    if (this.configSaveTimeout) clearTimeout(this.configSaveTimeout)
    this.configSaveTimeout = setTimeout(this.flushConfigSave, SAVE_CONFIG_DEBOUNCE_MS)
    this.setState(prevState => ({
      ...prevState,
      config: config
    }))
  }

  flushConfigSave() {
    if (this.configSaveTimeout) {
      clearTimeout(this.configSaveTimeout)
      this.configSaveTimeout = undefined
    }
    if (!this.pendingConfig) return
    emit(Constants.EVENT_SAVE_CONFIG, this.pendingConfig)
    this.pendingConfig = undefined
  }

  render(props, state) {
    const showFocusOptionsTooltip =
      state.showFocusOptionsTooltip && state.activeTab === TAB_GENERATE

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
                  value={{ config: state.config }}
                  mode={Mode.GENERATE}
                  buttonTitle={BUTTON_GENERATE}
                  uiMessage={GENERATE_MESSAGE}
                  buttonEvent={Constants.EVENT_GENERATE}
                  onConfigChange={this.onConfigChange}
                  onConfigFlush={this.flushConfigSave}
                  onFocusOptionsTooltipDismiss={this.onFocusOptionsTooltipDismiss}
                  showFocusOptionsTooltip={showFocusOptionsTooltip}
                />,
              value: TAB_GENERATE
            },
            {
              children:
                <PrototypeForm
                  value={{ config: state.config }}
                  mode={Mode.LINK}
                  buttonTitle={BUTTON_LINK}
                  uiMessage={LINK_MESSAGE}
                  buttonEvent={Constants.EVENT_LINK}
                  onConfigChange={this.onConfigChange}
                  onConfigFlush={this.flushConfigSave}
                  onFocusOptionsTooltipDismiss={this.onFocusOptionsTooltipDismiss}
                  showFocusOptionsTooltip={false}
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

function normalizeOnboardingStatus(status: OnboardingStatus | boolean): OnboardingStatus {
  if (typeof status === 'boolean') {
    return {
      isComplete: status,
      isFocusOptionsTooltipDismissed: true
    }
  }
  return {
    isComplete: status?.isComplete === true,
    isFocusOptionsTooltipDismissed: status?.isFocusOptionsTooltipDismissed === true
  }
}

function Plugin(props) {
  return (<UI config={props.config} />)
}

export default render(Plugin)
