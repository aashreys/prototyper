import { Columns, Dropdown, DropdownOption, TextboxNumeric, VerticalSpace, Text, Textbox, IconTimer32 } from '@create-figma-plugin/ui'
import { Component, Fragment, h, JSX } from 'preact'
import { useState } from 'preact/hooks'
import { AnimationType } from '../animation'

const INSTANT = 'Instant'
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
    { value: EASE_IN },
    { value: EASE_OUT },
    { value: EASE_IN_OUT },
    { separator: true },
    { value: EASE_IN_BACK },
    { value: EASE_OUT_BACK },
    { value: EASE_IN_OUT_BACK },
  ]
  
  function handleChange(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    setValue(newValue)
    props.onAnimChange(newValue);
  }

  return (
    <Dropdown
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

  function onFocusGained() {
    if (value === 0) {
      setValue('');
    }
  }

  function onFocusLost() {
    if (value.length === 0) {
      setValue(0);
    }
  }

  return (
    <TextboxNumeric
      icon={<IconTimer32 />}
      onFocusCapture={onFocusGained}
      onBlurCapture={onFocusLost}
      disabled={props.disabled} 
      onInput={handleInput} 
      placeholder="Duration" 
      value={value}
    />
  )

}

export class AnimationOptions extends Component <any, any> {

  state = {
    animUiValue: undefined,
  };

  constructor(props) {
    super(props);
    this.state = {
      animUiValue: this.getAnimationUIValue(props.animation),
    }
    this.bindMethods();
  }

  bindMethods() {
    this.onAnimChange = this.onAnimChange.bind(this);
    this.onAnimDurationChange = this.onAnimDurationChange.bind(this);
  }

  onAnimChange(animUiValue) {
    this.setState(prevState => ({
      ...prevState,
      animUiValue: animUiValue,
    }));
    this.props.onAnimChange(this.getAnimConfigValue(animUiValue));
  }

  onAnimDurationChange(duration) {
    this.props.onAnimDurationChange(duration);
  }

  getAnimationUIValue(anim: AnimationType) {
    switch(anim) {
      case AnimationType.INSTANT: return INSTANT;
      case AnimationType.EASE_IN: return EASE_IN
      case AnimationType.EASE_OUT: return EASE_OUT
      case AnimationType.EASE_IN_OUT: return EASE_IN_OUT
      case AnimationType.EASE_IN_BACK: return EASE_IN_BACK
      case AnimationType.EASE_OUT_BACK: return EASE_OUT_BACK
      case AnimationType.EASE_IN_OUT_BACK: return EASE_IN_OUT_BACK
    }
  }

  getAnimConfigValue(anim: string) {
    switch(anim) {
      case INSTANT: return AnimationType.INSTANT
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
        <Text bold>Animation</Text>
        <VerticalSpace space='small' />
        <Columns space='extraSmall'>
            <AnimationDropdown onAnimChange={this.onAnimChange} value={this.getAnimationUIValue(props.animation)}/>
            <AnimationDurationTextbox disabled={state.animUiValue && state.animUivalue === INSTANT} onAnimDurationChange={this.onAnimDurationChange} value={props.duration}/>
        </Columns>
      </Fragment>
    )
  }

}