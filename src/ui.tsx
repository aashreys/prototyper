import { render, Container, VerticalSpace, Button, Text, Textbox, Stack, Columns, IconArrowRight16, MiddleAlign, IconSwap32, IconMoveRight16, Inline } from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { h, JSX, Component, Fragment } from 'preact'
import { useState } from 'preact/hooks'
import { Navigation, NavScheme } from "./navigation";
import { Constants } from './constants';
import { AnimationOptions } from './components/animation_options';
import { AnimationType } from './animation';
import { Device } from './device';
import { DeviceOptions } from './components/device_options';
import { NavigationOptions } from './components/navigation_options';

const VariantPropertyTextbox = function (props) {
  const [value, setValue] = useState(props.value)
  function handleInput(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    setValue(newValue)
    props.onConfigChange('variantProperty', newValue);
  }
  return (
    <Textbox noBorder onInput={handleInput} placeholder="Property Name" value={value} />
  )
}

const VariantFromValueTextbox = function (props) {
  const [value, setValue] = useState(props.value)
  function handleInput(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    setValue(newValue)
    props.onConfigChange('variantFromValue', newValue)
  }
  return (
    <Textbox noBorder onInput={handleInput} placeholder="From Variant" value={value} />
  )
}

const VariantToValueTextbox = function (props) {
  const [value, setValue] = useState(props.value)
  function handleInput(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    setValue(newValue)
    props.onConfigChange('variantToValue', newValue)
  }
  return (
    <Textbox noBorder onInput={handleInput} placeholder="To Variant" value={value} />
  )
}

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
    this.onConfigChange = this.onConfigChange.bind(this);
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
        showVariantPropertyError: this.state.config.variantProperty.length == 0,
        showVariantToValueError: this.state.config.variantToValue.length == 0
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
    let variantProperty = this.state.config.variantProperty
    let variantToValue = this.state.config.variantToValue
    return variantProperty.length > 0 && variantToValue.length > 0;
  }

  onAnimChange(animation: AnimationType) {
    this.setState(prevState => ({
      config: {
        ...prevState.config,
        animation: {
          ...prevState.config.animation,
          animType: animation
        }
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

  onConfigChange(key, value) {
    this.setState(prevState => ({
      config: {
        ...prevState.config,
        [key]: value
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

        <DeviceOptions onDeviceChange={this.onDeviceChange} value={this.state.config.device} />

        <VerticalSpace space='large' />

        <NavigationOptions onNavChange={this.onNavChange} value={this.state.config.navigation.scheme} />

        <VerticalSpace space='large' />

        <AnimationOptions
          animation={this.state.config.animation.animType}
          duration={this.state.config.animation.duration}
          onAnimChange={this.onAnimChange}
          onAnimDurationChange={this.onAnimDurationChange}
        />

        <VerticalSpace space='large' />

        <Text bold>Swap Variant</Text>

        <VerticalSpace space='small' />

        <Stack space='extraSmall'>

          {
            this.state.ui.showVariantPropertyError &&
            <Text style="color:red">Property Name required</Text>
          }

          <VariantPropertyTextbox onConfigChange={this.onConfigChange} value={this.state.config.variantProperty} />

          {
            this.state.ui.showVariantToValueError &&
            <Text style="color:red">To Variant required</Text>
          }

          <Columns space='extraSmall'>

            <VariantFromValueTextbox onConfigChange={this.onConfigChange} value={this.state.config.variantFromValue} />

            <MiddleAlign> <IconArrowRight16 /> </MiddleAlign>
            
            <VariantToValueTextbox onConfigChange={this.onConfigChange} value={this.state.config.variantToValue} />

          </Columns>

        </Stack>

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