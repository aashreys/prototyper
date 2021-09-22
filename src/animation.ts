export interface Animation {

  readonly animType: AnimationType
  readonly duration: number // in milliseconds

}

export enum AnimationType {

  INSTANT = 'instant',
  LINEAR = 'LINEAR',
  EASE_IN = 'EASE_IN',
  EASE_OUT = 'EASE_OUT',
  EASE_IN_OUT = 'EASE_IN_AND_OUT',
  EASE_IN_BACK = 'EASE_IN_BACK',
  EASE_OUT_BACK = 'EASE_OUT_BACK',
  EASE_IN_OUT_BACK = 'EASE_IN_AND_OUT_BACK',

}