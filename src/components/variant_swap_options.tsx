import { Text, Textbox } from '@create-figma-plugin/ui'
import { Component, h } from 'preact'
import { AaIcon } from '../icons/aa'
import { ArrowRightIcon } from '../icons/arrow_right'
import { DiamondIcon } from '../icons/diamond'
import { DiamondOutlineIcon } from '../icons/diamond_outline'
import styles from '../styles.css'

export class VariantSwapOptions extends Component<any, any>  {

  constructor(props) {
    super(props)
    this.bindMethods()
  }

  bindMethods() {
    this.onPropertyChange = this.onPropertyChange.bind(this)
    this.onFromChange = this.onFromChange.bind(this)
    this.onToChange = this.onToChange.bind(this)
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
        <Text style={'margin-left: 8px'} muted={props.disabled} bold>Navigation Focus</Text>

        <div style='height: 12px' />
        
        <div>

          {
            props.showPropertyError && 
            <div style='margin-top: 8px; margin-bottom: 4px; margin-left: 8px'>
              <Text style={'color: red'}>Variant property required</Text>
            </div>
          }

          <Textbox 
          icon={<AaIcon/>}
          disabled={props.disabled} 
          onInput={e => this.onPropertyChange(e.currentTarget.value)}
          placeholder="Variant property"
          value={props.swapVariant.property} 
          noBorder />

          <div style='height: 4px' />

          {
            props.showToVariantError && 
            <div style='margin-top: 8px; margin-bottom: 4px; margin-left: 8px'>
              <Text style={'color: red'}>To value required</Text>
            </div>
          }

          <div style='display: flex; align-items:center'>

            <Textbox 
            style={'flex-grow: 1;'}
            icon={<DiamondOutlineIcon/>}
            disabled={props.disabled} 
            onInput={e => this.onFromChange(e.currentTarget.value)} 
            placeholder="From value" 
            value={props.swapVariant.from} 
            noBorder />

            <div style='padding-left: 8px; padding-right: 8px; align-items: center;'>
              <ArrowRightIcon fill={props.disabled ? "#eaeaea" : "#b0b0b0"} />  
            </div>

            <Textbox 
            style={'flex-grow: 1;'}
            icon={<DiamondIcon/>}
            disabled={props.disabled} 
            onInput={e => this.onToChange(e.currentTarget.value)}
            placeholder="To value" 
            value={props.swapVariant.to} 
            noBorder />

          </div>

        </div>
      </div>
    )
  }

}

