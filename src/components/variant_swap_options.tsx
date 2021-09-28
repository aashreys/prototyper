import { Columns, IconArrowRight16, MiddleAlign, Stack, Text, Textbox, VerticalSpace } from '@create-figma-plugin/ui'
import { Component, Fragment, h, JSX } from 'preact'
import { useState } from 'preact/hooks'

const VariantPropertyTextbox = function (props) {
  const [value, setValue] = useState(props.value)
  function handleInput(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    setValue(newValue)
    props.onPropertyChange(newValue);
  }
  return (
    <Textbox onInput={handleInput} placeholder="Property Name" value={value} />
  )
}

const VariantFromValueTextbox = function (props) {
  const [value, setValue] = useState(props.value)
  function handleInput(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    setValue(newValue)
    props.onFromChange(newValue)
  }
  return (
    <Textbox onInput={handleInput} placeholder="From Variant" value={value} />
  )
}

const VariantToValueTextbox = function (props) {
  const [value, setValue] = useState(props.value)
  function handleInput(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    setValue(newValue)
    props.onToChange(newValue)
  }
  return (
    <Textbox onInput={handleInput} placeholder="To Variant" value={value} />
  )
}

export class VariantSwapOptions extends Component<any, any>  {

  constructor(props) {
    super(props);
    this.bindMethods();
  }

  bindMethods() {
    this.onPropertyChange = this.onPropertyChange.bind(this);
    this.onFromChange = this.onFromChange.bind(this);
    this.onToChange = this.onToChange.bind(this);
  }

  onPropertyChange(property) {
    this.props.onSwapVariantChange({
      ...this.props.swapVariant,
      property: property
    });
  }

  onFromChange(from) {
    this.props.onSwapVariantChange({
      ...this.props.swapVariant,
      from: from
    });
  }

  onToChange(to) {
    this.props.onSwapVariantChange({
      ...this.props.swapVariant,
      to: to
    });
  }

  render(props, state) {
    return(
      <Fragment>
        <Text bold>Swap Variant</Text>
        <VerticalSpace space='small' />
        <Stack space='extraSmall'>
          { props.showPropertyError && <Text style="color:red">Property Name required</Text> }
          <VariantPropertyTextbox onPropertyChange={this.onPropertyChange} value={props.swapVariant.property} />
          { props.showToVariantError && <Text style="color:red">To Variant required</Text> }
          <Columns space='extraSmall'>
            <VariantFromValueTextbox onFromChange={this.onFromChange} value={props.swapVariant.from} />
            <MiddleAlign> <IconArrowRight16 /> </MiddleAlign>
            <VariantToValueTextbox onToChange={this.onToChange} value={props.swapVariant.to} />
          </Columns>
        </Stack>
      </Fragment>
    );
  }

}

