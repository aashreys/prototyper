import { Dropdown, DropdownOption, VerticalSpace, Text, Textbox, TextboxNumeric, SegmentedControl, SegmentedControlOption, Checkbox, Bold} from '@create-figma-plugin/ui'
import { Component, h, JSX } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import { AnimationCustomSpring, AnimationDirection, AnimationEasing, AnimationType } from '../animation'
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
import {
  BOUNCY,
  CUSTOM_SPRING,
  EASE_IN,
  EASE_IN_AND_OUT,
  EASE_IN_AND_OUT_BACK,
  EASE_IN_BACK,
  EASE_OUT,
  EASE_OUT_BACK,
  EASING_OPTIONS,
  GENTLE,
  getAnimationEasingConfigValue,
  getAnimationEasingUiValue,
  LINEAR,
  QUICK,
  SLOW
} from '../animation_easing'
import { getCustomSpringForAnimation, normalizeCustomSpring } from '../custom_spring'
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

const TRANSITION_OPTIONS: Array<DropdownOption> = [
  { value: INSTANT },
  { value: DISSOLVE },
  { value: SMART_ANIMATE },
  "-",
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

const DURATION_INCREMENT_SMALL = 10
const DURATION_INCREMENT_LARGE = 50
const DURATION_INPUT_PATTERN = /^\d*(?:m|ms)?$/i

const DurationInput = function (props) {

  const [value, setValue] = useState(formatPropsValue(props.value))
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (!isFocused) {
      setValue(formatPropsValue(props.value))
    }
  }, [isFocused, props.value])

  function handleInput(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    if (!isAllowedDurationInput(newValue)) {
      event.currentTarget.value = value
      return
    }
    setValue(newValue)

    const parsedValue = parseDurationValue(newValue)
    if (parsedValue === null) return
    props.callback(parsedValue)
  }

  function handleKeyDown(event: JSX.TargetedKeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    event.preventDefault()
    const increment = event.shiftKey ? DURATION_INCREMENT_LARGE : DURATION_INCREMENT_SMALL
    const direction = event.key === 'ArrowUp' ? 1 : -1
    const parsedValue = parseDurationValue(value)
    const baseValue = parsedValue === null ? props.value : parsedValue
    const nextValue = Math.max(0, baseValue + direction * increment)
    const nextDisplayValue = formatPropsValue(nextValue)
    setValue(nextDisplayValue)
    event.currentTarget.value = nextDisplayValue
    event.currentTarget.select()
    props.callback(nextValue)
  }

  function removeDurationSuffix(string: string) {
    return string.replace(/m?s?$/i, '')
  }

  function hasNonDigit(string): boolean {
    return string.match(/\D+/)
  }

  function removeLeadingZeroes(string) {
    return string.replace(/^0+/, '')
  }

  function formatPropsValue(value) {
    let valueString = value.toString();
    return valueString && valueString.length > 0 ? removeDurationSuffix(valueString) + 'ms' : valueString
  }

  function isAllowedDurationInput(value: string): boolean {
    return DURATION_INPUT_PATTERN.test(value.trim())
  }

  function parseDurationValue(value): null | number {
    const normalizedValue = removeDurationSuffix(value).trim()
    if (normalizedValue.length === 0 || hasNonDigit(normalizedValue)) return null
    const parsedValue = Number(normalizedValue)
    return Number.isFinite(parsedValue) ? parsedValue : null
  }

  function validateOnBlur(value: null | string): null | string | boolean {
    const parsedValue = parseDurationValue(value || '')
    if (parsedValue === null) return false
    value = removeLeadingZeroes(parsedValue.toString())
    if (value.length === 0) value = '0'
    return value + 'ms'
  }

  return (
    <Textbox
    // icon={<TimerIcon />}
    onBlur={() => setIsFocused(false)}
    onFocus={() => setIsFocused(true)}
    validateOnBlur={validateOnBlur}
    onKeyDown={handleKeyDown}
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
    this.onCustomSpringDurationChange = this.onCustomSpringDurationChange.bind(this)
    this.onCustomSpringMassChange = this.onCustomSpringMassChange.bind(this)
    this.onCustomSpringStiffnessChange = this.onCustomSpringStiffnessChange.bind(this)
    this.onCustomSpringDampingChange = this.onCustomSpringDampingChange.bind(this)
    this.onIsMatchLayersChange = this.onIsMatchLayersChange.bind(this)
    this.isDirectional = this.isDirectional.bind(this)
    this.isTimedAndEased = this.isTimedAndEased.bind(this)
    this.isCustomSpring = this.isCustomSpring.bind(this)
  }

  onTypeChange(uiValue) {
    this.props.onAnimationChange({
      ...this.props.animation,
      type: this.getConfigValue(uiValue)
    })
  }

  onEasingChange(uiValue) {
    const easing = this.getConfigValue(uiValue)
    const customSpring = easing === AnimationEasing.CUSTOM_SPRING
      ? getCustomSpringForAnimation(this.props.animation)
      : this.props.animation.customSpring
    this.props.onAnimationChange({
      ...this.props.animation,
      easing: easing,
      duration: easing === AnimationEasing.CUSTOM_SPRING ? customSpring.duration : this.props.animation.duration,
      customSpring: customSpring
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
    if (this.props.animation.easing === AnimationEasing.CUSTOM_SPRING) {
      const customSpring = normalizeCustomSpring({
        ...getCustomSpringForAnimation(this.props.animation),
        duration: duration
      })
      this.props.onAnimationChange({
        ...this.props.animation,
        duration: customSpring.duration,
        customSpring: customSpring
      })
      return
    }

    this.props.onAnimationChange({
      ...this.props.animation,
      duration: duration
    })
  }

  onCustomSpringDurationChange(value: null | number) {
    if (value === null) return
    const customSpring = normalizeCustomSpring({
      ...getCustomSpringForAnimation(this.props.animation),
      duration: value
    })
    this.onCustomSpringChange(customSpring)
  }

  onCustomSpringMassChange(value: null | number) {
    if (value === null) return
    this.onCustomSpringChange({
      ...getCustomSpringForAnimation(this.props.animation),
      mass: value
    })
  }

  onCustomSpringStiffnessChange(value: null | number) {
    if (value === null) return
    this.onCustomSpringChange({
      ...getCustomSpringForAnimation(this.props.animation),
      stiffness: value
    })
  }

  onCustomSpringDampingChange(value: null | number) {
    if (value === null) return
    this.onCustomSpringChange({
      ...getCustomSpringForAnimation(this.props.animation),
      damping: value
    })
  }

  onCustomSpringChange(spring: AnimationCustomSpring) {
    const customSpring = normalizeCustomSpring(spring)
    this.props.onAnimationChange({
      ...this.props.animation,
      easing: AnimationEasing.CUSTOM_SPRING,
      duration: customSpring.duration,
      customSpring: customSpring
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

  isCustomSpring(): boolean {
    return this.props.animation.easing === AnimationEasing.CUSTOM_SPRING
  }

  formatNumber(value: number): string {
    return Number.isInteger(value) ? value.toString() : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
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
      default: return getAnimationEasingUiValue(configValue)
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
      default: return getAnimationEasingConfigValue(uiValue)
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
      case GENTLE:
      case QUICK:
      case BOUNCY:
      case SLOW:
      case CUSTOM_SPRING:
        return <CurveEaseOutIcon />
      default: return <TransitionMoveIcon />
    }
  }

  render(props, state) {
    const customSpring = getCustomSpringForAnimation(props.animation)

    return (
      <div style={props.style ? props.style : ''}>
        <Text class={styles.sectionHeading}>
          <Bold>Animation</Bold>
        </Text>
        
        <VerticalSpace space='small' />
        
        <div class={styles.animationPrimaryRow}>

          <div class={styles.animationTransitionControl}>
            <Dropdown // Transition Select
            // icon={this.getIcon(this.getUiValue(props.animation.type))}
            onChange={e => this.onTypeChange(e.currentTarget.value)}
            options={TRANSITION_OPTIONS}
            value={this.getUiValue(props.animation.type)} />
          </div>

          {
            this.isDirectional() && 
            <div class={styles.animationDirectionControl}>
              <SegmentedControl // Direction Select
              onChange={e => this.onDirectionChange(e.currentTarget.value)} 
              options={DIRECTION_OPTIONS} 
              value={props.animation.isAutoDirection ? AUTO : 
                this.getUiValue(props.animation.direction)} />
            </div>

          }
        </div>
        
        {
          this.isTimedAndEased() &&
          <div class={styles.animationSecondaryRow}>

            <div class={styles.animationEasingControl}>
              <Dropdown // Easing Select
              // icon={this.getIcon(this.getUiValue(props.animation.easing))}
              onChange={e => this.onEasingChange(e.currentTarget.value)}
              options={EASING_OPTIONS}
              value={this.getUiValue(props.animation.easing)} />
            </div>

            {
              !this.isCustomSpring() &&
              <div class={styles.animationDurationControl}>
                <DurationInput // Duration Input
                callback={this.onDurationChange}
                value={props.animation.duration} />
              </div>
            }

          </div> 
        }

        {
          this.isTimedAndEased() && this.isCustomSpring() &&
          <div class={styles.animationSpringControls}>
            <Text>Duration</Text>
            <TextboxNumeric
              integer
              minimum={50}
              maximum={5000}
              onNumericValueInput={this.onCustomSpringDurationChange}
              suffix='ms'
              value={this.formatNumber(customSpring.duration)} />

            <Text>Mass</Text>
            <TextboxNumeric
              minimum={0.001}
              maximum={1000000}
              onNumericValueInput={this.onCustomSpringMassChange}
              value={this.formatNumber(customSpring.mass)} />

            <Text>Stiffness</Text>
            <TextboxNumeric
              minimum={0.001}
              maximum={1000000}
              onNumericValueInput={this.onCustomSpringStiffnessChange}
              value={this.formatNumber(customSpring.stiffness)} />

            <Text>Damping</Text>
            <TextboxNumeric
              minimum={0.001}
              maximum={1000000}
              onNumericValueInput={this.onCustomSpringDampingChange}
              value={this.formatNumber(customSpring.damping)} />
          </div>
        }

        {
          this.isDirectional() && 
          <div class={styles.animationMatchLayersControl}>

            <Checkbox // Match Layers Checkbox
            onChange={e => this.onIsMatchLayersChange(e.currentTarget.checked)} 
            value={props.animation.isMatchLayers} >
              <Text>Animate matching layers</Text>
            </Checkbox>
            
          </div>
        }
        
      </div>
    )
  }
}
