import { emit, on, showUI } from "@create-figma-plugin/utilities";
import { Config } from "./config.js";
import { Onboarding } from "./onboarding.js";
import { Constants } from "./constants";
import { doGeneratePrototype } from "./core/generate_prototype.js";
import { doLinkFrames } from "./core/link_frames.js";
import { setRelaunchButton } from "@create-figma-plugin/utilities";
import { Stats } from "./stats.js";
import {
  DEFAULT_PROTOTYPE_ALGORITHM,
  parsePrototypeAlgorithm,
  PrototypeAlgorithm,
} from "./prototype_algorithm.js";
import {
  DEFAULT_ERROR_MESSAGE,
  getErrorType,
  normalizeErrorMessage,
} from "./errors.js";
import { DebugReport } from "./debug_report.js";

const WIDTH = 240;
const HEIGHT = 460;

export enum Mode {
  GENERATE,
  LINK,
}

export default function () {
  /* Set Relaunch Button if not already set */
  if (!("default" in figma.root.getRelaunchData()))
    setRelaunchButton(figma.root, "default");

  /* Run Main Program */
  Config.migrateConfig();

  showUI(
    { width: WIDTH, height: HEIGHT },
    {
      config: Config.isConfigSaved()
        ? Config.getSavedConfig()
        : Config.getDefaultConfig(),
    },
  );

  Onboarding.isCompleteAsync().then(
    (isComplete) => {
      emit(
        Constants.EVENT_ONBOARDING_STATUS_LOADED,
        isComplete ? isComplete : false,
      );
    },
    () => {
      console.error("Failed to loading onboarding status");
    },
  );

  on(Constants.EVENT_GENERATE, (request) => {
    const payload = getRunPluginPayload(request);
    runPlugin(payload.config, Mode.GENERATE, payload.algorithm);
  });

  on(Constants.EVENT_LINK, (request) => {
    const payload = getRunPluginPayload(request);
    runPlugin(payload.config, Mode.LINK, payload.algorithm);
  });

  on(Constants.EVENT_SAVE_CONFIG, (config) => {
    saveConfig(config);
  });

  on(Constants.EVENT_UI_RESIZE, (height) => {
    figma.ui.resize(WIDTH, height);
  });

  on(Constants.EVENT_TAB_SWTICH, () => {
    emit(Constants.EVENT_CLEAR_UI_ERRORS);
  });

  on(Constants.EVENT_ONBOARDING_COMPLETE, () => {
    Onboarding.completed();
  });

  on(Constants.EVENT_REQUEST_STATS, () => {
    Stats.getStats().then((stats) =>
      emit(Constants.EVENT_RECEIVE_STATS, stats),
    );
  });

  on(Constants.EVENT_REQUEST_DEBUG_REPORT, () => {
    emit(Constants.EVENT_RECEIVE_DEBUG_REPORT, DebugReport.getLatestReport());
  });

  async function runPlugin(
    config: Config,
    mode: Mode,
    algorithm: PrototypeAlgorithm,
  ) {
    try {
      console.log(
        `Running ${Mode[mode]} with nearest-neighbor algorithm "${algorithm}"`,
      );
      saveConfig(config);
      if (mode === Mode.GENERATE) await doGeneratePrototype(config, algorithm);
      if (mode === Mode.LINK) await doLinkFrames(config, algorithm);
    } catch (error) {
      postError(0, normalizeErrorMessage(error), error);
    } finally {
      emit(Constants.EVENT_DONE);
    }
  }
}

function saveConfig(config: Config) {
  try {
    Config.save(config);
  } catch (error) {
    console.error("Unable to save plugin config", {
      error: error instanceof Error ? error.message : String(error || ""),
    });
  }
}

function getRunPluginPayload(payload): RunPluginPayload {
  if (payload && payload.config) {
    return {
      config: payload.config,
      algorithm: parsePrototypeAlgorithm(payload.algorithm),
    };
  }

  return {
    config: payload,
    algorithm: DEFAULT_PROTOTYPE_ALGORITHM,
  };
}

function postError(code: number, message: string, error?) {
  console.error(message);
  if (message === DEFAULT_ERROR_MESSAGE) {
    console.error(`Unknown plugin error type: ${getErrorType(error)}`);
  }
  emit(Constants.EVENT_ERROR, { code: code, message: message });
}

interface RunPluginPayload {
  config: Config;
  algorithm: PrototypeAlgorithm;
}
