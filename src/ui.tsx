import { render, Container, VerticalSpace, Button, Text, Textbox, Stack, Columns, IconArrowRight16, MiddleAlign } from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { h, JSX, Component, Fragment } from 'preact'
import { useState } from 'preact/hooks'
import { Navigation, NavScheme } from "./navigation";
import { Constants } from './constants';
import { AnimationOptions } from './components/animation_options';
import { AnimationType } from './animation';
import { Device } from './device';
import { NavigationOptions } from './components/navigation_options';
import { VariantSwapOptions } from './components/variant_swap_options';
import { SwapVariant } from './swap_variant';
import { Config } from './config';

const ErrorBox = function (props) {
  const [value, setValue] = useState(props.message)
  return (
    <Container style="background-color: #FFF4F4; border-radius: 6px;" space='extraSmall'>
      <VerticalSpace space='small' />
      <Text style="color:red">{props.message}</Text>
      <VerticalSpace space='small' />
    </Container>
  )
}

class PrototypeForm extends Component<any, any>  {

  state = {
    config: undefined,
    ui: {
      showVariantPropertyError: false,
      showVariantToValueError: false,
      buttonLoading: false,
      errorMessage: ''
    }
  }

  container: any;

  constructor(props) {
    super(props);
    this.state.config = props.value.config;
    this.bindMethods();
    this.registerEventHandlers();
  }

  bindMethods() {
    this.onClick = this.onClick.bind(this);
    this.validate = this.validate.bind(this);
    this.setButtonLoading = this.setButtonLoading.bind(this);
    this.onError = this.onError.bind(this);
    this.onDone = this.onDone.bind(this);
    this.componentDidUpdate = this.componentDidUpdate.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.onAnimChange = this.onAnimChange.bind(this);
    this.onAnimDurationChange = this.onAnimDurationChange.bind(this);
    this.onDeviceChange = this.onDeviceChange.bind(this);
    this.onNavChange = this.onNavChange.bind(this);
    this.onSwapVariantChange = this.onSwapVariantChange.bind(this);
  }

  componentDidMount() {
    if (this.container) {
      this.onHeightChanged(this.container.base.parentNode.clientHeight);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.container) {
      this.onHeightChanged(this.container.base.parentNode.clientHeight);
    }
  }

  onHeightChanged(height: number) {
    emit(Constants.EVENT_UI_RESIZE, height);
  }

  registerEventHandlers() {
    on(Constants.EVENT_ERROR, (props) => {
      this.onError(props.code, props.message)
    });
    on(Constants.EVENT_DONE, () => {
      this.onDone();
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
    this.updateValidationUi()
    if (this.validate()) {
      this.setButtonLoading(true);
      emit(Constants.EVENT_SUBMIT, this.state.config);
    }
  }

  updateValidationUi() {
    this.setState(prevState => ({
      config: prevState.config,
      ui: {
        ...prevState.ui,
        showVariantPropertyError: this.state.config.swapVariant.property == 0,
        showVariantToValueError: this.state.config.swapVariant.to == 0
      }
    }))
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

  onDeviceChange(device: Device) {
    this.setState(prevState => ({
      config: {
        ...prevState.config,
        device: device
      }
    }));
  }

  onNavChange(navScheme: NavScheme) {
    this.setState(prevState => ({
      config: {
        ...prevState.config,
        navigation: Navigation.createNavigation(this.state.config.device, navScheme)
      }
    }));
  }

  validate() {
    let variantProperty = this.state.config.swapVariant.property
    let variantToValue = this.state.config.swapVariant.to
    return variantProperty.length > 0 && variantToValue.length > 0
  }

  onAnimChange(animation: AnimationType) {
    console.log('onAnimChange:')
    console.log(animation);
    this.setState(prevState => ({
      config: {
        ...prevState.config,
        animation: animation
      }
    }));
  }

  onAnimDurationChange(duration: number) {
    this.setState(prevState => ({
      config: {
        ...prevState.config,
        animation: {
          ...prevState.config.animation,
          duration: duration
        }
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
      <Container space='medium' ref={(container) => { this.container = container }}>

        <VerticalSpace space='large' />

        <Text>Select the component instances you'd like to link in the prototype, and click Generate Prototype.</Text>

        {
          this.state.ui.errorMessage.length > 0 &&
          <Fragment>
            <VerticalSpace space='medium' />
            <ErrorBox message={this.state.ui.errorMessage} />
          </Fragment>
        }

        <VerticalSpace space='large' />

        <NavigationOptions
        onDeviceChange={this.onDeviceChange} 
        onNavChange={this.onNavChange} 
        device={this.state.config.device}
        navigation={this.state.config.navigation.scheme} 
        />

        <VerticalSpace space='large' />

        <AnimationOptions
          animation={this.state.config.animation}
          onAnimChange={this.onAnimChange}
          onAnimDurationChange={this.onAnimDurationChange}
        />

        <VerticalSpace space='large' />

        <VariantSwapOptions
        swapVariant={this.state.config.swapVariant}
        onSwapVariantChange={this.onSwapVariantChange}
        showPropertyError={this.state.ui.showVariantPropertyError}
        showToVariantError={this.state.ui.showVariantToValueError}
        />

        <VerticalSpace space='medium' />

        <Button fullWidth disabled={this.state.ui.buttonLoading} loading={this.state.ui.buttonLoading} onClick={this.onClick}>Generate Prototype</Button>

        <VerticalSpace space='medium' />

      </Container>
    );
  }
}

function Plugin(props) {
  return (<PrototypeForm value={props} />)
}

export default render(Plugin)