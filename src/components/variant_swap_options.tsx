import { Bold, Text, Textbox } from '@create-figma-plugin/ui'
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
        <Text style={'margin-left: 8px'}><Bold>
          Navigation Focus
        </Bold></Text>

        <div style='height: 12px' />
        
        <div>

          <Textbox 
          // icon={<AaIcon/>}
          onInput={e => this.onPropertyChange(e.currentTarget.value)}
          placeholder="Focus component property name"
          value={props.swapVariant.property} />

          {
            props.showPropertyError &&
            <div style='margin-top: 2px; margin-bottom: 8px; margin-left: 8px'>
              <text class={styles.errorText}>Property name required</text>
            </div>
          }

          <div style='height: 4px' />

          <div style='display: flex; align-items:center'>

            <Textbox 
            style={'flex-grow: 1;'}
            // icon={<DiamondOutlineIcon/>}

            onInput={e => this.onFromChange(e.currentTarget.value)} 
            placeholder="Unfocused value"
            value={props.swapVariant.from} />

            <div style='padding-left: 2px; padding-right: 2px;'>
              <ArrowRightIcon class={styles.greyIcon} />  
            </div>

            <Textbox 
            style={'flex-grow: 1;'}
            // icon={<DiamondIcon/>}
            onInput={e => this.onToChange(e.currentTarget.value)}
            placeholder="Focused value" 
            value={props.swapVariant.to} />

          </div>

          {
            props.showToVariantError &&
            <div style='margin-top: 2px; margin-bottom: 8px; margin-left: 8px'>
              <text class={styles.errorText}>Property values required</text>
            </div>
          }

        </div>
      </div>
    )
  }

}

