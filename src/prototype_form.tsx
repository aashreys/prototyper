import { VerticalSpace, Button, Text } from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { h, Component } from 'preact'
import { Navigation, NavScheme } from "./navigation";
import { Constants } from './constants';
import { AnimationOptions } from './components/animation_options';
import { NavigationOptions } from './components/navigation_options';
import { VariantSwapOptions } from './components/variant_swap_options';
import { SwapVariant } from './swap_variant';
import { Mode } from './main';
import { HelpWdiget } from './components/help_widget';
import { UI } from './ui';
import { Config, StoredNavigation } from './config';
import { Device } from './device';
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
    this.onAnimationChange = this.onAnimationChange.bind(this);
    this.onNavigationChange = this.onNavigationChange.bind(this);
    this.onSwapVariantChange = this.onSwapVariantChange.bind(this);
    this.registerEventHandlers = this.registerEventHandlers.bind(this);
  }

  componentDidMount() {
    this.onHeightChanged()
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.onHeightChanged()
  }

  onHeightChanged() {
    emit(Constants.EVENT_UI_RESIZE, UI.getUIHeight());
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
    let storedNavigation: StoredNavigation = this.state.config.storedNavigation
    if (navigation.device === Device.KEYBOARD) {
      storedNavigation.keyboard = navigation
    } else {
      storedNavigation.controller = navigation
    }

    this.setState(prevState => ({
      config: {
        ...prevState.config,
        activeNavigation: navigation,
        storedNavigation: storedNavigation
      }
    }));
  }

  validateAndShowErrors() {
    let config = this.state.config
    let scheme = config.activeNavigation.scheme
    let keyCodes = config.activeNavigation.customKeycodes;

    let isVariantPropertyValid = config.swapVariant.property.length > 0
    let isVariantToValueValid = config.swapVariant.to.length > 0
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

  isCustomInputValid() {
    let config = this.state.config
    let scheme = config.activeNavigation.scheme
    let keyCodes = config.activeNavigation.customKeycodes
    return (scheme !== NavScheme.CUSTOM || 
      (scheme === NavScheme.CUSTOM && (keyCodes.left.length > 0 || keyCodes.right.length > 0 || keyCodes.up.length > 0 || keyCodes.down.length > 0)))
  }



  onAnimationChange(animation: Animation) {

    this.setState(prevState => ({
      config: {
        ...prevState.config,
        animation: animation
      }
    }));
  }

  onSwapVariantChange(swapVariant: SwapVariant) {
    this.setState(prevState => ({
      config: {
        ...prevState.config,
        swapVariant: swapVariant
      }
    }));
  }

  render() {

    return (
      <div>

        <VerticalSpace space='extraLarge' />

        <Text style={'margin-left: 16px; margin-right: 16px;'}>{this.props.uiMessage}</Text>
        
        {
          this.state.ui.errorMessage.length > 0 && 
          <div style='padding-left: 16px; padding-right: 16px;'> 
            <VerticalSpace space='large' />
            <text class={styles.errorText}>{this.state.ui.errorMessage}</text>
          </div>
        }

        <VerticalSpace space='extraLarge' />

        <NavigationOptions
          style='padding-left: 8px; padding-right: 8px;'
          onNavigationChange={this.onNavigationChange}
          activeNavigation={this.state.config.activeNavigation}
          keyboardNavigation={this.state.config.storedNavigation.keyboard}
          controllerNavigation={this.state.config.storedNavigation.controller}
          showCustomInputError={this.state.ui.showCustomInputError}
        />

        <VerticalSpace space='large' />

        <AnimationOptions
          style='padding-left: 8px; padding-right: 8px;'
          animation={this.state.config.animation}
          onAnimationChange={this.onAnimationChange}
        />

        <VerticalSpace space='large' />
        
        {
          this.props.mode !== Mode.LINK &&
          <VariantSwapOptions
          style='padding-left: 8px; padding-right: 8px; padding-bottom: 12px;'
          disabled={this.props.mode === Mode.LINK}
          swapVariant={this.state.config.swapVariant}
          onSwapVariantChange={this.onSwapVariantChange}
          showPropertyError={this.state.ui.showVariantPropertyError}
          showToVariantError={this.state.ui.showVariantToValueError} />
        }

        <div style="display: flex; padding-left: 16px; padding-right: 16px;"> 
          <div style="flex-grow: 1"> 
            <Button 
            fullWidth
            disabled={this.state.ui.buttonLoading} 
            loading={this.state.ui.buttonLoading} 
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