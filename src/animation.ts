export interface Animation {

  readonly type: AnimationType
  readonly isAutoDirection: boolean
  readonly direction: AnimationDirection
  readonly isMatchLayers: boolean
  readonly easing: AnimationEasing
  readonly duration: number // in milliseconds

}

export enum AnimationType {

  INSTANT = 'INSTANT',
  DISSOLVE = 'DISSOLVE',
  SMART_ANIMATE = 'SMART_ANIMATE',
  MOVE_IN = 'MOVE_IN',
  MOVE_OUT = 'MOVE_OUT',
  PUSH  = 'PUSH',
  SLIDE_IN = 'SLIDE_IN',
  SLIDE_OUT = 'SLIDE_OUT',

}

export enum AnimationDirection {

  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  TOP = 'TOP',
  BOTTOM = 'BOTTOM',

}

export enum AnimationEasing {

  LINEAR = 'LINEAR',
  EASE_IN = 'EASE_IN',
  EASE_OUT = 'EASE_OUT',
  EASE_IN_AND_OUT = 'EASE_IN_AND_OUT',
  EASE_IN_BACK = 'EASE_IN_BACK',
  EASE_OUT_BACK = 'EASE_OUT_BACK',
  EASE_IN_AND_OUT_BACK = 'EASE_IN_AND_OUT_BACK',
  GENTLE = 'GENTLE',
  QUICK = 'QUICK',
  BOUNCY = 'BOUNCY',
  SLOW = 'SLOW'

}