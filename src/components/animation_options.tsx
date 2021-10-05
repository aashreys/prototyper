import { Columns, Dropdown, DropdownOption, TextboxNumeric, VerticalSpace, Text, Inline} from '@create-figma-plugin/ui'
import { Component, Fragment, h, JSX } from 'preact'
import { useState } from 'preact/hooks'
import { AnimationType } from '../animation'
import { CurveEaseInIcon } from '../icons/curve_ease_in'
import { CurveEaseInBackIcon } from '../icons/curve_ease_in_back'
import { CurveEaseInOutIcon } from '../icons/curve_ease_in_out'
import { CurveEaseInOutBackIcon } from '../icons/curve_ease_in_out_back'
import { CurveEaseOutIcon } from '../icons/curve_ease_out'
import { CurveEaseOutBackIcon } from '../icons/curve_ease_out_back'
import { CurveInstantIcon } from '../icons/curve_instant'
import { CurveLinearIcon } from '../icons/curve_linear'
import { TimerIcon } from '../icons/timer'

const INSTANT = 'Instant'
const LINEAR = 'Linear'
const EASE_IN = 'Ease in'
const EASE_OUT = 'Ease out'
const EASE_IN_OUT = 'Ease in and out'
const EASE_IN_BACK = 'Ease in back'
const EASE_OUT_BACK = 'Ease out back'
const EASE_IN_OUT_BACK = 'Ease in and out back'

const AnimationDropdown = function (props) {

  const [value, setValue] = useState<null | string>(props.value)

  const options: Array<DropdownOption> = [
    { value: INSTANT },
    { separator: true },
    { header: 'Smart Animate' },
    { value: LINEAR },
    { value: EASE_IN },
    { value: EASE_OUT },
    { value: EASE_IN_OUT },
    { separator: true },
    { value: EASE_IN_BACK },
    { value: EASE_OUT_BACK },
    { value: EASE_IN_OUT_BACK },
  ]

  function getIcon(value) {
    switch (value) {
      case INSTANT: return <CurveInstantIcon />
      case LINEAR: return <CurveLinearIcon />
      case EASE_IN: return <CurveEaseInIcon />
      case EASE_OUT: return <CurveEaseOutIcon />
      case EASE_IN_OUT: return <CurveEaseInOutIcon />
      case EASE_IN_BACK: return <CurveEaseInBackIcon />
      case EASE_OUT_BACK: return <CurveEaseOutBackIcon />
      case EASE_IN_OUT_BACK: return <CurveEaseInOutBackIcon />
    }
  }

  function handleChange(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    setValue(newValue)
    props.onAnimChange(newValue);
  }

  return (
    <Dropdown
      icon={getIcon(value)}
      onChange={handleChange}
      options={options}
      value={value}
    />
  )

}

const AnimationDurationTextbox = function (props) {

  const [value, setValue] = useState(props.value)

  function handleInput(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value;
    setValue(newValue);
    props.onAnimDurationChange(newValue.length > 0 ? newValue : 0);
  }

  function validateOnBlur(value: null | number): null | number | boolean {
    return value !== null
  }

  return (
    <TextboxNumeric
      icon={<TimerIcon />}
      validateOnBlur={validateOnBlur}
      disabled={props.disabled}
      onInput={handleInput}
      placeholder="Duration"
      value={value}
    />
  )

}

export class AnimationOptions extends Component<any, any> {

  constructor(props) {
    super(props);
    this.bindMethods();
  }

  bindMethods() {
    this.onAnimChange = this.onAnimChange.bind(this);
    this.onAnimDurationChange = this.onAnimDurationChange.bind(this);
  }

  onAnimChange(animUiValue) {
    this.props.onAnimChange({
      ...this.props.animation,
      animType: this.getAnimConfigValue(animUiValue)
    })
  }

  onAnimDurationChange(duration) {
    this.props.onAnimChange({
      ...this.props.animation,
      duration: duration
    })
  }

  getAnimationUIValue(anim: AnimationType) {
    switch (anim) {
      case AnimationType.INSTANT: return INSTANT
      case AnimationType.LINEAR: return LINEAR
      case AnimationType.EASE_IN: return EASE_IN
      case AnimationType.EASE_OUT: return EASE_OUT
      case AnimationType.EASE_IN_OUT: return EASE_IN_OUT
      case AnimationType.EASE_IN_BACK: return EASE_IN_BACK
      case AnimationType.EASE_OUT_BACK: return EASE_OUT_BACK
      case AnimationType.EASE_IN_OUT_BACK: return EASE_IN_OUT_BACK
    }
  }

  getAnimConfigValue(anim: string) {
    switch (anim) {
      case INSTANT: return AnimationType.INSTANT
      case LINEAR: return AnimationType.LINEAR
      case EASE_IN: return AnimationType.EASE_IN
      case EASE_OUT: return AnimationType.EASE_OUT
      case EASE_IN_OUT: return AnimationType.EASE_IN_OUT
      case EASE_IN_BACK: return AnimationType.EASE_IN_BACK
      case EASE_OUT_BACK: return AnimationType.EASE_OUT_BACK
      case EASE_IN_OUT_BACK: return AnimationType.EASE_IN_OUT_BACK
    }
  }

  render(props, state) {
    return (
      <Fragment>
        <Text bold>Transition</Text>
        <VerticalSpace space='small' />
        <div style="width: 100%; display: flex;"> 
          <div style="width: 55%"> 
            <AnimationDropdown 
            onAnimChange={this.onAnimChange} 
            value={this.getAnimationUIValue(props.animation.animType)} /> 
          </div>
          <div style="width: 4%"> 
          </div>
          <div style="width: 41%"> 
            <AnimationDurationTextbox 
            disabled={this.getAnimationUIValue(props.animation.animType) === INSTANT} 
            onAnimDurationChange={this.onAnimDurationChange} 
            value={props.animation.duration} />
          </div>
        </div>
      </Fragment>
    )
  }
}