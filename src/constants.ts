export abstract class Constants {

  static readonly EVENT_DONE = 'DONE';
  static readonly EVENT_ERROR = 'ERROR';
  static readonly EVENT_UI_RESIZE = 'UI_RESIZE';
  static readonly EVENT_GENERATE = 'GENERATE';
  static readonly EVENT_LINK = 'LINK';

  static readonly ERROR_NOTHING_SELECTED = 'Nothing selected. Select component instances to link and try again.';
  static readonly ERROR_NO_INSTANCES = 'Selection does not contain any component instances to link together.';
  static readonly ERROR_MORE_THAN_1_CHILD = 'Selection must contain 2 or more component instances to link together.';

}