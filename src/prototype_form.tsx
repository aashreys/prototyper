import { VerticalSpace, Button, Text } from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { h, Component } from 'preact'
import { Navigation, NavScheme } from "./navigation";
import { Constants } from './constants';
import { AnimationOptions } from './components/animation_options';
import { NavigationOptions } from './components/navigation_options';
import { NavigationFocusOptions } from './components/navigation_focus_options';
import { Mode } from './main';
import { HelpWdiget } from './components/help_widget';
import { UI } from './ui';
import { Config, StoredNavigation } from './config';
import { Device } from './device';
import { Animation } from './animation';
import { isVariantFocusMode, NavigationFocusConfig } from './navigation_focus';
import styles from './styles.css';

export class PrototypeForm extends Component<any, any>  {

  state: UIState = {
    config: undefined,
    ui: {
      showVariantPropertyError: false,
      showVariantToValueError: false,
      showCustomInputError: false,
      buttonLoading: false,
      errorMessage: ''
    }
  }

  constructor(props) {
    super(props);
    this.state.config = props.value.config;
    this.bindMethods();
    this.registerEventHandlers();
  }

  bindMethods() {
    this.onClick = this.onClick.bind(this);
    this.validateAndShowErrors = this.validateAndShowErrors.bind(this);
    this.setButtonLoading = this.setButtonLoading.bind(this);
    this.onError = this.onError.bind(this);
    this.onDone = this.onDone.bind(this);
    this.componentDidUpdate = this.componentDidUpdate.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.onFormBlur = this.onFormBlur.bind(this);
    this.onAnimationChange = this.onAnimationChange.bind(this);
    this.onNavigationChange = this.onNavigationChange.bind(this);
    this.onNavigationFocusChange = this.onNavigationFocusChange.bind(this);
    this.clearComponentFocusErrors = this.clearComponentFocusErrors.bind(this);
    this.registerEventHandlers = this.registerEventHandlers.bind(this);
  }

  componentDidMount() {
    this.onHeightChanged()
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevProps.value.config !== this.props.value.config && this.state.config !== this.props.value.config) {
      this.setState(prevState => ({
        ...prevState,
        config: this.props.value.config
      }))
    }
    this.onHeightChanged()
  }

  onHeightChanged() {
    emit(Constants.EVENT_UI_RESIZE, UI.getUIHeight());
  }

  onFormBlur() {
    this.props.onConfigFlush()
  }

  registerEventHandlers() {
    on(Constants.EVENT_ERROR, (props) => {
      this.onError(props.code, props.message)
    });
    on(Constants.EVENT_DONE, () => {
      this.onDone()
    })
    on(Constants.EVENT_CLEAR_UI_ERRORS, () => {
      this.setErrorMessage('')
      this.hideErrorUi()
    })
  }

  onError(code: number, message: string) {
    this.setErrorMessage(message);
    this.onDone();
  }

  onDone() {
    this.setButtonLoading(false);
  }

  onClick = e => {
    this.setErrorMessage('')
    this.props.onConfigFlush()
    if (this.validateAndShowErrors()) {
      this.setButtonLoading(true);
      emit(this.props.buttonEvent, this.state.config);
    }
  }

  hideErrorUi() {
    this.updateErrorUi(false, false, false)
  }

  setButtonLoading(bool) {
    this.setState(prevState => ({
      config: prevState.config,
      ui: {
        ...prevState.ui,
        buttonLoading: bool
      }
    }))
  }

  setErrorMessage(message) {
    this.setState(prevState => ({
      config: prevState.config,
      ui: {
        ...prevState.ui,
        errorMessage: message
      }
    }))
  }

  onNavigationChange(navigation: Navigation) {
    let storedNavigation: StoredNavigation = {
      ...this.state.config.storedNavigation
    }
    if (navigation.device === Device.KEYBOARD) {
      storedNavigation.keyboard = navigation
    } else {
      storedNavigation.controller = navigation
    }

    this.setConfig({
      ...this.state.config,
      activeNavigation: navigation,
      storedNavigation: storedNavigation
    });
  }

  validateAndShowErrors() {
    let config = this.state.config
    let scheme = config.activeNavigation.scheme
    let keyCodes = config.activeNavigation.customKeycodes;

    let shouldValidateVariant = this.props.mode === Mode.GENERATE && isVariantFocusMode(config.focus)
    let componentMappings = config.focus.components || []
    let isVariantPropertyValid = !shouldValidateVariant ||
      (componentMappings.length > 0 && componentMappings.every(mapping => mapping.property.length > 0))
    let isVariantToValueValid = !shouldValidateVariant ||
      componentMappings.every(mapping => mapping.type !== 'variant' || (mapping.from.length > 0 && mapping.to.length > 0))
    let isCustonInputValid = (scheme !== NavScheme.CUSTOM || 
      (scheme === NavScheme.CUSTOM && 
        keyCodes.left.length > 0 || keyCodes.right.length > 0 || keyCodes.up.length > 0 || keyCodes.down.length > 0))

    if (this.props.mode === Mode.GENERATE) {
      this.updateErrorUi(!isVariantPropertyValid, !isVariantToValueValid, !isCustonInputValid)
      return isVariantPropertyValid && isVariantToValueValid && isCustonInputValid
    } 
    else if (this.props.mode === Mode.LINK) {
      this.updateErrorUi(false, false, !isCustonInputValid) // Always hide variant property and value errors in LINK
      return isCustonInputValid;
    }
  }

  updateErrorUi(showVariantPropertyError: boolean, showVariantToValueError: boolean, showCustomInputError: boolean) {
    this.setState(prevState => ({
      config: prevState.config,
      ui: {
        ...prevState.ui,
        showVariantPropertyError: showVariantPropertyError,
        showVariantToValueError: showVariantToValueError,
        showCustomInputError: showCustomInputError
      }
    }))
  }

  clearComponentFocusErrors() {
    this.setState(prevState => ({
      config: prevState.config,
      ui: {
        ...prevState.ui,
        showVariantPropertyError: false,
        showVariantToValueError: false
      }
    }))
  }

  isCustomInputValid() {
    let config = this.state.config
    let scheme = config.activeNavigation.scheme
    let keyCodes = config.activeNavigation.customKeycodes
    return (scheme !== NavScheme.CUSTOM || 
      (scheme === NavScheme.CUSTOM && (keyCodes.left.length > 0 || keyCodes.right.length > 0 || keyCodes.up.length > 0 || keyCodes.down.length > 0)))
  }



  onAnimationChange(animation: Animation) {
    this.setConfig({
      ...this.state.config,
      animation: animation
    });
  }

  onNavigationFocusChange(focus: NavigationFocusConfig) {
    this.setConfig({
      ...this.state.config,
      focus: focus,
      swapVariant: focus.variant
    });
  }

  setConfig(config: Config) {
    this.setState(prevState => ({
      config: config
    }));
    this.props.onConfigChange(config)
  }

  render() {

    return (
      <div onBlurCapture={this.onFormBlur}>

        <VerticalSpace space='large' />

        <div class={styles.formContent}>
          <Text>{this.props.uiMessage}</Text>
        </div>
        
        {
          this.state.ui.errorMessage.length > 0 && 
          <div class={styles.formContent}>
            <VerticalSpace space='large' />
            <text class={styles.errorText}>{this.state.ui.errorMessage}</text>
          </div>
        }

        <VerticalSpace space='extraLarge' />

        <NavigationOptions
          style='padding-left: 16px; padding-right: 16px;'
          onNavigationChange={this.onNavigationChange}
          activeNavigation={this.state.config.activeNavigation}
          keyboardNavigation={this.state.config.storedNavigation.keyboard}
          controllerNavigation={this.state.config.storedNavigation.controller}
          showCustomInputError={this.state.ui.showCustomInputError}
        />

        <VerticalSpace space='large' />

        <AnimationOptions
          style='padding-left: 16px; padding-right: 16px;'
          animation={this.state.config.animation}
          onAnimationChange={this.onAnimationChange}
        />

        <VerticalSpace space='large' />
        
        {
          this.props.mode !== Mode.LINK &&
          <div>
            <NavigationFocusOptions
            style='padding-left: 16px; padding-right: 16px;'
            focus={this.state.config.focus}
            onComponentMappingAdd={this.clearComponentFocusErrors}
            onNavigationFocusChange={this.onNavigationFocusChange}
            showPropertyError={this.state.ui.showVariantPropertyError}
            showToVariantError={this.state.ui.showVariantToValueError} />
            <VerticalSpace space='large' />
          </div>
        }

        <div class={styles.actionDivider} />

        <div style="display: flex; padding-left: 16px; padding-right: 16px;"> 
          <div style="flex-grow: 1"> 
            <Button 
            fullWidth
            disabled={this.state.ui.buttonLoading} 
            loading={this.state.ui.buttonLoading} 
            style="height: 32px;"
            onClick={this.onClick}>{this.props.buttonTitle}
            </Button>
          </div>
          <div style="padding-left: 8px; flex-grow: 0">
            <HelpWdiget />
          </div>
        </div>

      </div>
    );
  }
}

interface UIState {
  config: Config,
  ui: any
}
