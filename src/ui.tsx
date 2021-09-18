import { render, Container, VerticalSpace, Button, SegmentedControl, SegmentedControlOption, Text, Dropdown, DropdownOption, Textbox, Stack } from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { h, JSX, Component, Fragment } from 'preact'
import { useState } from 'preact/hooks'
import { Platform, InputScheme } from "./controller";
import { Constants } from './constants';

const PlatformSelect = function (props) {
  const [value, setValue] = useState(props.value)
  const options: Array<SegmentedControlOption> = [
    { value: Platform.XBOX },
    // { value: Platform.PLAYSTATION },
  ]
  function handleChange(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    setValue(newValue)
    props.onConfigChange('platform', newValue);
  }
  return (
    <SegmentedControl onChange={handleChange} options={options} value={value} />
  )
}

const InputSelect = function (props) {
  const [value, setValue] = useState<null | string>(props.value)
  const options: Array<DropdownOption> = [
    { value: InputScheme.DPAD },
    { value: InputScheme.LEFT_STICK },
    // { separator: true },
    // { header: 'Only Horizontal' },
    // { value: InputScheme.SHOULDER_BUTTONS },
    // { value: InputScheme.TRIGGER_BUTTONS },
  ]
  function handleChange(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    setValue(newValue)
    props.onConfigChange('inputScheme', newValue);
  }
  return (
    <Dropdown
        onChange={handleChange}
        options={options}
        placeholder="Placeholder"
        value={value}
      />
  )
}

const VariantPropertyTextbox = function (props) {
  const [value, setValue] = useState(props.value)
  function handleInput(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    setValue(newValue)
    props.onConfigChange('variantProperty', newValue);
  }
  return (
    <Textbox onInput={handleInput} placeholder="Variant Property (Required)" value={value} />
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
    <Textbox onInput={handleInput} placeholder="From Value (Optional)" value={value} />
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
    <Textbox onInput={handleInput} placeholder="To Value (Required)" value={value} />
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

class PrototypeForm extends Component< any, any >  {

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
    this.bind();
    this.registerEventHandlers();
  }

  bind() {
    this.onClick = this.onClick.bind(this);
    this.onConfigChange = this.onConfigChange.bind(this);
    this.validate = this.validate.bind(this);
    this.setButtonLoading = this.setButtonLoading.bind(this);
    this.onError = this.onError.bind(this);
    this.onDone = this.onDone.bind(this);
    this.componentDidUpdate = this.componentDidUpdate.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
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
    console.log('Error received in UI: ' + code);
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
      emit(Constants.EVENT_SUBMIT, this.state.config);
      this.setButtonLoading(true);
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

  onConfigChange(key, value) {
    this.setState(prevState => ({
      config: {
        ...prevState.config,
        [key]: value
      }
    }));
  }

  validate() {
    let variantProperty = this.state.config.variantProperty
    let variantToValue = this.state.config.variantToValue
    return variantProperty.length > 0 && variantToValue.length > 0;
  }

  render() {
    return (
      <Container space='medium' ref={ (container) => {this.container = container }}>

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

        <Text bold>Controller</Text>

        <VerticalSpace space='small' />

        <PlatformSelect onConfigChange={this.onConfigChange} value={this.state.config.platform}/>
        
        <VerticalSpace space='large' />
        
        <Text bold>Navigate With</Text>

        <VerticalSpace space='small' />

        <InputSelect onConfigChange={this.onConfigChange} value={this.state.config.inputScheme}/>
        
        <VerticalSpace space='large' />
        
        <Text bold>Swap Variant</Text>

        <VerticalSpace space='small' />

        <Stack space='extraSmall'>

          {
            this.state.ui.showVariantPropertyError &&
            <Text style="color:red">Variant Property required</Text>
          }
          
          <VariantPropertyTextbox onConfigChange={this.onConfigChange} value={this.state.config.variantProperty}/>
          
          <VariantFromValueTextbox onConfigChange={this.onConfigChange} value={this.state.config.variantFromValue}/>
          
          {
            this.state.ui.showVariantToValueError &&
            <Text style="color:red">To Value required</Text>
          }

          <VariantToValueTextbox onConfigChange={this.onConfigChange} value={this.state.config.variantToValue}/>
          
        </Stack>

        <VerticalSpace space='medium' />
        
        <Button fullWidth disabled={this.state.ui.buttonLoading} loading={this.state.ui.buttonLoading} onClick={this.onClick}>Generate Prototype</Button>

        <VerticalSpace space='medium' />

      </Container>
      );
    }
  }
  
  function Plugin(props) {
    return ( <PrototypeForm value={props} /> )
  }
    
    export default render(Plugin)