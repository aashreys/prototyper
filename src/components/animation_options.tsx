import { Dropdown, DropdownOption, VerticalSpace, Text, Textbox, SegmentedControl, SegmentedControlOption, Checkbox, MiddleAlign, Bold} from '@create-figma-plugin/ui'
import { Component, h, JSX } from 'preact'
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
import styles from '../styles.css'

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

const TRANSITION_OPTIONS: Array<DropdownOption> = [
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

const DIRECTION_OPTIONS: Array<SegmentedControlOption> = [
  { value: AUTO },
  { value: LEFT, children: <ArrowLeftIcon class={styles.themedIcon} /> },
  { value: RIGHT, children: <ArrowRightIcon class={styles.themedIcon} /> },
  { value: BOTTOM, children: <ArrowDownIcon class={styles.themedIcon} /> },
  { value: TOP, children: <ArrowUpIcon class={styles.themedIcon} /> },
]

const EASING_OPTIONS: Array<DropdownOption> = [
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
    value={value} />
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

  getIcon(value) {
    switch (value) {
      case INSTANT: return <TransitionInstantIcon />
      case DISSOLVE: return <TransitionDissolveIcon />
      case SMART_ANIMATE: return <TransitionSmartAnimateIcon />
      case LINEAR: return <CurveLinearIcon />
      case EASE_IN: return <CurveEaseInIcon />
      case EASE_OUT: return <CurveEaseOutIcon />
      case EASE_IN_AND_OUT: return <CurveEaseInOutIcon />
      case EASE_IN_BACK: return <CurveEaseInBackIcon />
      case EASE_OUT_BACK: return <CurveEaseOutBackIcon />
      case EASE_IN_AND_OUT_BACK: return <CurveEaseInOutBackIcon />
      default: return <TransitionMoveIcon />
    }
  }

  render(props, state) {
    return (
      <div style={props.style ? props.style : ''}>
        <Text style={'margin-left: 8px'}><Bold>Animation</Bold></Text>
        
        <VerticalSpace space='small' />
        
        <div style='display: flex; align-items:center'>

          <Dropdown // Transition Select
          style={'min-width: 35%; flex-grow: 1'}
          icon={this.getIcon(this.getUiValue(props.animation.type))}
          onChange={e => this.onTypeChange(e.currentTarget.value)}
          options={TRANSITION_OPTIONS}
          value={this.getUiValue(props.animation.type)} />

          {
            this.isDirectional() && 
            <SegmentedControl // Direction Select
            onChange={e => this.onDirectionChange(e.currentTarget.value)} 
            options={DIRECTION_OPTIONS} 
            value={props.animation.isAutoDirection ? AUTO : 
              this.getUiValue(props.animation.direction)} />

          }
        </div>

        {
          this.isTimedAndEased() &&
          <div style='display: flex; margin-top: 4px;'>

            <Dropdown // Easing Select
            style={'width: 50%;'}
            icon={this.getIcon(this.getUiValue(props.animation.easing))}
            onChange={e => this.onEasingChange(e.currentTarget.value)}
            options={EASING_OPTIONS}
            value={this.getUiValue(props.animation.easing)} />

            <div style='width: 50%;'>
              <DurationInput // Duration Input
              callback={this.onDurationChange} 
              value={props.animation.duration} />
            </div>

          </div> 
        }

        {
          this.isDirectional() && 
          <div style='margin-top: 12px; margin-bottom: 8px; margin-left: 8px; margin-right: 8px'>

            <Checkbox // Match Layers Checkbox
            onChange={e => this.onIsMatchLayersChange(e.currentTarget.checked)} 
            value={props.animation.isMatchLayers} >
              <Text>Smart animate matching layers</Text>
            </Checkbox>
            
          </div>
        }
        
      </div>
    )
  }
}