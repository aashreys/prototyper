import { Columns, IconArrowRight16, MiddleAlign, Stack, Text, Textbox, VerticalSpace } from '@create-figma-plugin/ui'
import { Component, Fragment, h, JSX } from 'preact'
import { useState } from 'preact/hooks'
import { AaIcon } from '../icons/aa'
import { ArrowRightIcon } from '../icons/arrow_right'
import { DiamondIcon } from '../icons/diamond'
import { DiamondOutlineIcon } from '../icons/diamond_outline'
import styles from '../styles.css'

const VariantPropertyTextbox = function (props) {
  const [value, setValue] = useState(props.value)
  function handleInput(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    setValue(newValue)
    props.onPropertyChange(newValue);
  }
  return (
    <Textbox 
    icon={<AaIcon/>}
    disabled={props.disabled} 
    onInput={handleInput} 
    placeholder="Variant Property" 
    value={value} 
    noBorder />
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
    <Textbox 
    icon={<DiamondOutlineIcon/>}
    disabled={props.disabled} 
    onInput={handleInput} 
    placeholder="From Variant" 
    value={value} 
    noBorder />
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
    <Textbox 
    icon={<DiamondIcon/>}
    disabled={props.disabled} 
    onInput={handleInput} 
    placeholder="To Variant" 
    value={value} 
    noBorder />
  )
}

export class VariantSwapOptions extends Component<any, any>  {

  constructor(props) {
    super(props)
    this.bindMethods()
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
    })
  }

  onFromChange(from) {
    this.props.onSwapVariantChange({
      ...this.props.swapVariant,
      from: from
    })
  }

  onToChange(to) {
    this.props.onSwapVariantChange({
      ...this.props.swapVariant,
      to: to
    })
  }

  render(props, state) {
    return (
      <div style={props.style ? props.style : ''}>
        <Text style={'margin-left: 8px'} muted={props.disabled} bold>Swap Variant</Text>

        <div style='height: 12px' />
        
        <div>

          {
            props.showPropertyError && 
            <div style='margin-top: 8px; margin-bottom: 4px; margin-left: 8px'>
              <Text style="color:red">Variant Property required</Text>
            </div>
          }

          <VariantPropertyTextbox
            disabled={this.props.disabled}
            onPropertyChange={this.onPropertyChange}
            value={props.swapVariant.property}
          />

          <div style='height: 4px' />

          {
            props.showToVariantError && 
            <div style='margin-top: 8px; margin-bottom: 4px; margin-left: 8px'>
              <Text style="color:red">To Property required</Text>
            </div>
          }

          <Columns>
            <VariantFromValueTextbox
              disabled={props.disabled}
              onFromChange={this.onFromChange}
              value={props.swapVariant.from}
            />
            <div style='padding-left: 4px; padding-right: 4px'>
              <MiddleAlign>
                <ArrowRightIcon fill={props.disabled ? "#eaeaea" : "#b0b0b0"} />
              </MiddleAlign>
            </div>
            <VariantToValueTextbox
              disabled={props.disabled}
              onToChange={this.onToChange}
              value={props.swapVariant.to}
            />
          </Columns>

        </div>
      </div>
    )
  }

}

