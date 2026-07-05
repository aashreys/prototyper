import { emit, on, showUI } from "@create-figma-plugin/utilities";
import { Config } from "./config.js";
import { Onboarding } from "./onboarding.js";
import { Constants } from "./constants";
import { doGeneratePrototype } from "./core/generate_prototype.js";
import { doLinkFrames } from "./core/link_frames.js";
import { setRelaunchButton } from "@create-figma-plugin/utilities";
import { Stats } from "./stats.js";
import { PointerAssetStorage } from "./pointer_asset_storage.js";
import {
  DEFAULT_ERROR_MESSAGE,
  getErrorType,
  normalizeErrorMessage,
} from "./errors.js";

const WIDTH = 250;
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

  Onboarding.getStatusAsync().then(
    (status) => {
      emit(Constants.EVENT_ONBOARDING_STATUS_LOADED, status);
    },
    () => {
      console.error("Failed to loading onboarding status");
    },
  );

  on(Constants.EVENT_GENERATE, (config) => {
    runPlugin(config, Mode.GENERATE);
  });

  on(Constants.EVENT_LINK, (config) => {
    runPlugin(config, Mode.LINK);
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

  on(Constants.EVENT_FOCUS_OPTIONS_ONBOARDING_DISMISSED, () => {
    Onboarding.focusOptionsTooltipDismissed().then(
      () => undefined,
      () => {
        console.error("Failed to save focus options onboarding tooltip dismissal");
      },
    );
  });

  on(Constants.EVENT_REQUEST_STATS, () => {
    Stats.getStats().then((stats) =>
      emit(Constants.EVENT_RECEIVE_STATS, stats),
    );
  });

  on(Constants.EVENT_REQUEST_POINTER_ASSET, () => {
    PointerAssetStorage.getCustomAssets().then((assets) => {
      emit(Constants.EVENT_RECEIVE_POINTER_ASSET, assets);
    });
  });

  on(Constants.EVENT_SAVE_POINTER_ASSET, (asset) => {
    PointerAssetStorage.saveCustomAsset(asset).then(
      (assets) => emit(Constants.EVENT_RECEIVE_POINTER_ASSET, assets),
      (error) => {
        const message = normalizeErrorMessage(error);
        console.error('Failed to save custom pointer asset', {
          error: message
        });
        emit(Constants.EVENT_POINTER_ASSET_ERROR, message);
      },
    );
  });

  on(Constants.EVENT_DELETE_POINTER_ASSET, (id) => {
    PointerAssetStorage.deleteCustomAsset(id).then((assets) => {
      emit(Constants.EVENT_RECEIVE_POINTER_ASSET, assets);
    });
  });

  async function runPlugin(config: Config, mode: Mode) {
    try {
      saveConfig(config);
      if (mode === Mode.GENERATE) await doGeneratePrototype(config);
      if (mode === Mode.LINK) await doLinkFrames(config);
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

function postError(code: number, message: string, error?) {
  console.error(message);
  if (message === DEFAULT_ERROR_MESSAGE) {
    console.error(`Unknown plugin error type: ${getErrorType(error)}`);
  }
  emit(Constants.EVENT_ERROR, { code: code, message: message });
}
