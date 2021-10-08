import { emit, on, showUI } from '@create-figma-plugin/utilities'
import { Config } from './config.js'
import { Constants } from './constants';
import { doGeneratePrototype } from './core/generate_prototype.js';
import { doLinkFrames } from './core/link_frames.js';

export enum Mode {
  GENERATE,
  LINK
}

export default function () {

  const TITLE = 'Prototyper (BETA)';
  const WIDTH = 240;
  const HEIGHT = 469;

  let config: Config

  /* Main Program */
  Config.migrateConfig();

  showUI(
    { title: TITLE, width: WIDTH, height: HEIGHT },
    { config: Config.isConfigSaved() ? Config.getSavedConfig() : Config.getDefaultConfig() }
  )

  on(Constants.EVENT_GENERATE, (data) => {
    runPlugin(data, Mode.GENERATE);
  });

  on(Constants.EVENT_LINK, (data) => {
    runPlugin(data, Mode.LINK);
  });

  on(Constants.EVENT_UI_RESIZE, (height) => {
    figma.ui.resize(WIDTH, height);
  })

  on(Constants.EVENT_TAB_SWTICH, () => {
    emit(Constants.EVENT_CLEAR_UI_ERRORS);
  })

  function initializeConfig(configData: Config) {
    config = configData
    Config.save(config)
  }

  function runPlugin(config: Config, mode: Mode) {
    try {
      initializeConfig(config)
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