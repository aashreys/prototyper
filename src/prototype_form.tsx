import { Container, VerticalSpace, Button, Text } from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { h, Component } from 'preact'
import { Navigation, NavScheme } from "./navigation";
import { Constants } from './constants';
import { AnimationOptions } from './components/animation_options';
import { AnimationType } from './animation';
import { NavigationOptions } from './components/navigation_options';
import { VariantSwapOptions } from './components/variant_swap_options';
import { SwapVariant } from './swap_variant';
import { Mode } from './main';
import { HelpWdiget } from './components/help_widget';
import { UI } from './ui';
import styles from './styles.css';

const ErrorBox = function (props) {
  return (
    props.visible &&
    <div>
      <VerticalSpace space='large' />
      <text class={styles.errorText}>{props.message}</text>
    </div>
  )
}

export class PrototypeForm extends Component<any, any>  {

  state = {
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
    this.onAnimChange = this.onAnimChange.bind(this);
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
    this.setState(prevState => ({
      config: {
        ...prevState.config,
        navigation: navigation
      }
    }));
  }

  validateAndShowErrors() {
    let config = this.state.config
    let scheme = config.navigation.scheme
    let keyCodes = config.navigation.customKeycodes;

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
    let scheme = config.navigation.scheme
    let keyCodes = config.navigation.customKeycodes
    return (scheme !== NavScheme.CUSTOM || 
      (scheme === NavScheme.CUSTOM && (keyCodes.left.length > 0 || keyCodes.right.length > 0 || keyCodes.up.length > 0 
        || keyCodes.down.length > 0)))
  }



  onAnimChange(animation: AnimationType) {
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
      <Container space="medium">

        <VerticalSpace space='extraLarge' />

        <Text>{this.props.uiMessage}</Text>

        <ErrorBox 
          visible={this.state.ui.errorMessage.length > 0}
          message={this.state.ui.errorMessage} 
        />

        <VerticalSpace space='extraLarge' />

        <NavigationOptions
          onNavigationChange={this.onNavigationChange}
          navigation={this.state.config.navigation}
          showCustomInputError={this.state.ui.showCustomInputError}
        />

        <VerticalSpace space='large' />

        <AnimationOptions
          animation={this.state.config.animation}
          onAnimChange={this.onAnimChange}
        />

        <VerticalSpace space='large' />

        <VariantSwapOptions
          disabled={this.props.mode === Mode.LINK}
          swapVariant={this.state.config.swapVariant}
          onSwapVariantChange={this.onSwapVariantChange}
          showPropertyError={this.state.ui.showVariantPropertyError}
          showToVariantError={this.state.ui.showVariantToValueError}
        />

        <VerticalSpace space='medium' />

        <div style="width: 100%; display: flex;"> 
          <div style="order: 0; flex-grow: 1"> 
            <Button 
            fullWidth
            disabled={this.state.ui.buttonLoading} 
            loading={this.state.ui.buttonLoading} 
            onClick={this.onClick}>{this.props.buttonTitle}
            </Button>
          </div>
          <div style="margin-left: 8px; order: 1; flex-grow: 0">
            <HelpWdiget />
          </div>
        </div>

      </Container>
    );
  }
}