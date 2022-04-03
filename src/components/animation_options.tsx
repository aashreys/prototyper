import { Columns, Dropdown, DropdownOption, TextboxNumeric, VerticalSpace, Text, Inline, Textbox, SegmentedControl, SegmentedControlOption, Checkbox, IconAdjust32, MiddleAlign} from '@create-figma-plugin/ui'
import { Component, Fragment, h, JSX } from 'preact'
import { useState } from 'preact/hooks'
import { AnimationDirection, AnimationEasing, AnimationType } from '../animation'
import { ArrowDownIcon } from '../icons/arrow_down'
import { ArrowLeftIcon } from '../icons/arrow_left'
import { ArrowRightIcon } from '../icons/arrow_right'
import { ArrowUpIcon } from '../icons/arrow_up'
import { CurveEaseInIcon } from '../icons/curve_ease_in'
import { CurveEaseInBackIcon } from '../icons/curve_ease_in_back'
import { CurveEaseInOutIcon } from '../icons/curve_ease_in_out'
import { CurveEaseInOutBackIcon } from '../icons/curve_ease_in_out_back'
import { CurveEaseOutIcon } from '../icons/curve_ease_out'
import { CurveEaseOutBackIcon } from '../icons/curve_ease_out_back'
import { TransitionInstantIcon } from '../icons/curve_instant'
import { CurveLinearIcon } from '../icons/curve_linear'
import { TransitionDissolveIcon } from '../icons/dissolve'
import { TransitionMoveIcon } from '../icons/move'
import { TransitionSmartAnimateIcon } from '../icons/smart_animate'
import { TimerIcon } from '../icons/timer'

/* 
Animation Type - Instant, Dissolve, Smart Animate, Move In, Move Out, Push, Slide In, Slide Out
Direction - Left, Right, Up, Down
Easing - Linear, Ease In, Ease Out, Ease In & Out...
Duration - time in ms
*/


// Animation Type
const INSTANT = 'Instant'
const DISSOLVE = 'Dissolve'
const SMART_ANIMATE = 'Smart Animate'
const MOVE_IN = 'Move in'
const MOVE_OUT = 'Move out'
const PUSH = 'Push'
const SLIDE_IN = 'Slide in'
const SLIDE_OUT = 'Slide out'

// Direction
const AUTO = 'Auto'
const LEFT = 'Left'
const RIGHT = 'Right'
const TOP = 'Top'
const BOTTOM = 'Bottom'

// Easing
const LINEAR = 'Linear'
const EASE_IN = 'Ease in'
const EASE_OUT = 'Ease out'
const EASE_IN_AND_OUT = 'Ease in and out'
const EASE_IN_BACK = 'Ease in back'
const EASE_OUT_BACK = 'Ease out back'
const EASE_IN_AND_OUT_BACK = 'Ease in and out back'

const TypeSelect = function (props) {

  const [value, setValue] = useState<null | string>(props.value)

  const options: Array<DropdownOption> = [
    { value: INSTANT },
    { value: DISSOLVE },
    { value: SMART_ANIMATE },
    { separator: true },
    { value: MOVE_IN },
    { value: MOVE_OUT },
    { value: PUSH },
    { value: SLIDE_IN },
    { value: SLIDE_OUT },
  ]

  function getIcon(value) {
    switch (value) {
      case INSTANT: return <TransitionInstantIcon />
      case DISSOLVE: return <TransitionDissolveIcon />
      case SMART_ANIMATE: return <TransitionSmartAnimateIcon />
      default: return <TransitionMoveIcon />
    }
  }

  function handleChange(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    setValue(newValue)
    props.callback(newValue)
  }

  return (
    <Dropdown
      icon={getIcon(value)}
      onChange={handleChange}
      options={options}
      value={value}
      noBorder
    />
  )

}

const DirectionSelect = function (props) {

  const [value, setValue] = useState(props.value)

  const options: Array<SegmentedControlOption> = [
    { value: AUTO },
    { value: LEFT, children: <ArrowLeftIcon /> },
    { value: RIGHT, children: <ArrowRightIcon /> },
    { value: BOTTOM, children: <ArrowDownIcon /> },
    { value: TOP, children: <ArrowUpIcon /> },
  ]

  function handleChange(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    setValue(newValue)
    props.callback(newValue);
  }

  return (
    <SegmentedControl 
      onChange={handleChange} 
      options={options} 
      value={props.value}
    />
  )

}

const EasingSelect = function (props) {

  const [value, setValue] = useState<null | string>(props.value)

  const options: Array<DropdownOption> = [
    { value: LINEAR },
    { separator: true },
    { value: EASE_IN },
    { value: EASE_OUT },
    { value: EASE_IN_AND_OUT },
    { separator: true },
    { value: EASE_IN_BACK },
    { value: EASE_OUT_BACK },
    { value: EASE_IN_AND_OUT_BACK },
  ]

  function getIcon(value) {
    switch (value) {
      case LINEAR: return <CurveLinearIcon />
      case EASE_IN: return <CurveEaseInIcon />
      case EASE_OUT: return <CurveEaseOutIcon />
      case EASE_IN_AND_OUT: return <CurveEaseInOutIcon />
      case EASE_IN_BACK: return <CurveEaseInBackIcon />
      case EASE_OUT_BACK: return <CurveEaseOutBackIcon />
      case EASE_IN_AND_OUT_BACK: return <CurveEaseInOutBackIcon />
    }
  }

  function handleChange(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    setValue(newValue)
    props.callback(newValue);
  }

  return (
    <Dropdown
      icon={getIcon(value)}
      onChange={handleChange}
      options={options}
      value={value}
      noBorder
    />
  )

}

const DurationInput = function (props) {

  const [value, setValue] = useState(formatPropsValue(props.value))

  function handleInput(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value;
    setValue(newValue);
    props.callback(newValue.length > 0 ? removeMsString(newValue) : 0);
  }

  function removeMsString(string) {
    return string.replace(/ms/gm, '')
  }

  function hasNonDigit(string): boolean {
    return string.match(/\D+/)
  }

  function removeLeadingZeroes(string) {
    return string.replace(/^0+/, '')
  }

  function formatPropsValue(value) {
    let valueString = value.toString();
    return valueString && valueString.length > 0 ? removeMsString(valueString) + 'ms' : valueString
  }

  function validateOnBlur(value: null | string): null | string | boolean {
    if (value.length > 0) {
      value = removeMsString(value)
      if (!hasNonDigit(value)) {
        value = removeLeadingZeroes(value)
        if (value.length > 0) {
          value = value + 'ms'
          return value;
        }
        else {
          return false;
        }
      }
      else {
        return false;
      }
    } 
    else {
      return false;
    }
  }

  return (
    <Textbox
      icon={<TimerIcon />}
      validateOnBlur={validateOnBlur}
      onInput={handleInput}
      placeholder='Duration'
      value={value}
      noBorder
    />
  )

}

const MatchLayersSelect = function (props) {

  const [value, setValue] = useState(false)

  function handleChange(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.checked
    setValue(newValue)
    props.callback(newValue)
  }

  return (
    <Checkbox onChange={handleChange} value={props.value}>
      <Text>Smart animate matching layers</Text>
    </Checkbox>
  )

}

export class AnimationOptions extends Component<any, any> {

  constructor(props) {
    super(props);
    this.bindMethods();
  }

  bindMethods() {
    this.onTypeChange = this.onTypeChange.bind(this)
    this.onEasingChange = this.onEasingChange.bind(this)
    this.onDirectionChange = this.onDirectionChange.bind(this)
    this.onDurationChange = this.onDurationChange.bind(this)
    this.onIsMatchLayersChange = this.onIsMatchLayersChange.bind(this)
    this.isDirectional = this.isDirectional.bind(this)
    this.isTimedAndEased = this.isTimedAndEased.bind(this)
  }

  onTypeChange(uiValue) {
    this.props.onAnimationChange({
      ...this.props.animation,
      type: this.getConfigValue(uiValue)
    })
  }

  onEasingChange(uiValue) {
    this.props.onAnimationChange({
      ...this.props.animation,
      easing: this.getConfigValue(uiValue)
    })
  }

  onDirectionChange(uiValue) {
    if (uiValue === AUTO) {
      this.props.onAnimationChange({
        ...this.props.animation,
        isAutoDirection: true
      })
    } 
    else {
      this.props.onAnimationChange({
        ...this.props.animation,
        isAutoDirection: false,
        direction: this.getConfigValue(uiValue)
      })
    }
  }

  onDurationChange(duration) {
    this.props.onAnimationChange({
      ...this.props.animation,
      duration: duration
    })
  }

  onIsMatchLayersChange(isChecked) {
    this.props.onAnimationChange({
      ...this.props.animation,
      isMatchLayers: isChecked
    })
  }

  isDirectional(): boolean {
    let type: AnimationType = this.props.animation.type
    return type === AnimationType.MOVE_IN || type === AnimationType.MOVE_OUT || type === AnimationType.PUSH || type === AnimationType.SLIDE_IN || type === AnimationType.SLIDE_OUT
  }

  isTimedAndEased(): boolean {
    return this.props.animation.type !== AnimationType.INSTANT
  }

  getUiValue(configValue: string) {
    switch (configValue) {
      case AnimationType.INSTANT: return INSTANT
      case AnimationType.DISSOLVE: return DISSOLVE
      case AnimationType.SMART_ANIMATE: return SMART_ANIMATE
      case AnimationType.MOVE_IN: return MOVE_IN
      case AnimationType.MOVE_OUT: return MOVE_OUT
      case AnimationType.PUSH: return PUSH
      case AnimationType.SLIDE_IN: return SLIDE_IN
      case AnimationType.SLIDE_OUT: return SLIDE_OUT
      case AnimationDirection.LEFT: return LEFT
      case AnimationDirection.RIGHT: return RIGHT
      case AnimationDirection.TOP: return TOP
      case AnimationDirection.BOTTOM: return BOTTOM
      case AnimationEasing.LINEAR: return LINEAR
      case AnimationEasing.EASE_IN: return EASE_IN
      case AnimationEasing.EASE_OUT: return EASE_OUT
      case AnimationEasing.EASE_IN_AND_OUT: return EASE_IN_AND_OUT
      case AnimationEasing.EASE_IN_BACK: return EASE_IN_BACK
      case AnimationEasing.EASE_OUT_BACK: return EASE_OUT_BACK
      case AnimationEasing.EASE_IN_AND_OUT_BACK: return EASE_IN_AND_OUT_BACK
    }
  }

  getConfigValue(uiValue: string) {
    switch (uiValue) {
      case INSTANT: return AnimationType.INSTANT
      case DISSOLVE: return AnimationType.DISSOLVE
      case SMART_ANIMATE: return AnimationType.SMART_ANIMATE
      case MOVE_IN: return AnimationType.MOVE_IN
      case MOVE_OUT: return AnimationType.MOVE_OUT
      case PUSH: return AnimationType.PUSH
      case SLIDE_IN: return AnimationType.SLIDE_IN
      case SLIDE_OUT: return AnimationType.SLIDE_OUT
      case LEFT: return AnimationDirection.LEFT
      case RIGHT: return AnimationDirection.RIGHT
      case TOP: return AnimationDirection.TOP
      case BOTTOM: return AnimationDirection.BOTTOM
      case LINEAR: return AnimationEasing.LINEAR
      case EASE_IN: return AnimationEasing.EASE_IN
      case EASE_OUT: return AnimationEasing.EASE_OUT
      case EASE_IN_AND_OUT: return AnimationEasing.EASE_IN_AND_OUT
      case EASE_IN_BACK: return AnimationEasing.EASE_IN_BACK
      case EASE_OUT_BACK: return AnimationEasing.EASE_OUT_BACK
      case EASE_IN_AND_OUT_BACK: return AnimationEasing.EASE_IN_AND_OUT_BACK
    }
  }

  render(props, state) {
    return (
      <div style={props.style ? props.style : ''}>
        <Text style={'margin-left: 8px'} bold>Animation</Text>
        <VerticalSpace space='small' />
        <div style='display: flex'>
          <div style='min-width: 35%'>
            <TypeSelect
            callback={this.onTypeChange}
            value={this.getUiValue(props.animation.type)} />
          </div>
          {
            this.isDirectional() && 
            <div style=''>
              <MiddleAlign>
                <DirectionSelect
                callback={this.onDirectionChange}
                value={props.animation.isAutoDirection ? AUTO : 
                  this.getUiValue(props.animation.direction)} />
              </MiddleAlign>
            </div>
          }
        </div>

        {
          this.isTimedAndEased() &&
          <div style='display: flex; margin-top: 4px;'>
            <div style='width: 50%;'> 
              <EasingSelect 
              callback={this.onEasingChange} 
              value={this.getUiValue(props.animation.easing)} /> 
            </div>
            <div style='width: 50%;'>
            <DurationInput 
            callback={this.onDurationChange} 
            value={props.animation.duration} />
            </div>
          </div> 
        }

        {
          this.isDirectional() && 
          <div style='margin-top: 12px; margin-bottom: 8px; margin-left: 8px; margin-right: 8px'>
            <MatchLayersSelect
            callback={this.onIsMatchLayersChange}
            value={props.animation.isMatchLayers} />
          </div>
        }
        
      </div>
    )
  }
}