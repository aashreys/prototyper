import { emit, on, showUI } from '@create-figma-plugin/utilities'
import { Config } from './config.js'
import { Onboarding } from './onboarding.js'
import { Constants } from './constants';
import { doGeneratePrototype } from './core/generate_prototype.js';
import { doLinkFrames } from './core/link_frames.js';
import { setRelaunchButton } from '@create-figma-plugin/utilities';
import { Stats } from './stats.js';

const WIDTH = 240;
const HEIGHT = 460;

export enum Mode {
  GENERATE,
  LINK
}

export default function () {

  /* Set Relaunch Button if not already set */
  if (!('default' in figma.root.getRelaunchData())) setRelaunchButton(figma.root, 'default')

  /* Run Main Program */
  Config.migrateConfig()

  Stats.clearStats()

  showUI(
    { width: WIDTH, height: HEIGHT },
    { config: Config.isConfigSaved() ? Config.getSavedConfig() : Config.getDefaultConfig() }
  )

  Onboarding.isCompleteAsync()
  .then(
    (isComplete) => {
      emit(Constants.EVENT_ONBOARDING_STATUS_LOADED, isComplete? isComplete : false)
    },
    () => {
      console.error('Failed to loading onboarding status')
    }
  )

  on(Constants.EVENT_GENERATE, (config) => {
    runPlugin(config, Mode.GENERATE);
  });

  on(Constants.EVENT_LINK, (config) => {
    runPlugin(config, Mode.LINK);
  });

  on(Constants.EVENT_UI_RESIZE, (height) => {
    figma.ui.resize(WIDTH, height);
  })

  on(Constants.EVENT_TAB_SWTICH, () => {
    emit(Constants.EVENT_CLEAR_UI_ERRORS);
  })

  on(Constants.EVENT_ONBOARDING_COMPLETE, () => {
    Onboarding.completed();
  })

  on(Constants.EVENT_REQUEST_STATS, () => {
    console.log('stats request received in main')
    Stats.getStats().then(
      (stats) => emit(Constants.EVENT_RECEIVE_STATS, stats)
    )
  })

  function runPlugin(config: Config, mode: Mode) {
    try {
      Config.save(config)
      if (mode === Mode.GENERATE) doGeneratePrototype(config)
      if (mode === Mode.LINK) doLinkFrames(config)
    } catch (error) {
      postError(0, error.message)
    } finally {
      emit(Constants.EVENT_DONE)
    }
  }
}

function postError(code: number, message: string) {
  console.error(message);
  emit(Constants.EVENT_ERROR, { code: code, message: message });
}