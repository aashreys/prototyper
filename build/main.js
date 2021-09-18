(() => {
  var __defProp = Object.defineProperty;
  var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
  var __require = typeof require !== "undefined" ? require : (x) => {
    throw new Error('Dynamic require of "' + x + '" is not supported');
  };
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[Object.keys(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    __markAsModule(target);
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // node_modules/@create-figma-plugin/utilities/lib/events.js
  function on(name, handler) {
    const id = `${currentId}`;
    currentId += 1;
    eventHandlers[id] = { handler, name };
    return function() {
      delete eventHandlers[id];
    };
  }
  function invokeEventHandler(name, args) {
    for (const id in eventHandlers) {
      if (eventHandlers[id].name === name) {
        eventHandlers[id].handler.apply(null, args);
      }
    }
  }
  var eventHandlers, currentId, emit;
  var init_events = __esm({
    "node_modules/@create-figma-plugin/utilities/lib/events.js"() {
      eventHandlers = {};
      currentId = 0;
      emit = typeof window === "undefined" ? function(name, ...args) {
        figma.ui.postMessage([name, ...args]);
      } : function(name, ...args) {
        window.parent.postMessage({
          pluginMessage: [name, ...args]
        }, "*");
      };
      if (typeof window === "undefined") {
        figma.ui.onmessage = function([name, ...args]) {
          invokeEventHandler(name, args);
        };
      } else {
        window.onmessage = function(event) {
          const [name, ...args] = event.data.pluginMessage;
          invokeEventHandler(name, args);
        };
      }
    }
  });

  // node_modules/@create-figma-plugin/utilities/lib/ui.js
  function showUI(options, data) {
    if (typeof __html__ === "undefined") {
      throw new Error("No UI defined");
    }
    const html = `<div id="create-figma-plugin"></div><script>const __FIGMA_COMMAND__='${figma.command}';const __SHOW_UI_DATA__=${JSON.stringify(typeof data === "undefined" ? {} : data)};${__html__}<\/script>`;
    figma.showUI(html, options);
  }
  var init_ui = __esm({
    "node_modules/@create-figma-plugin/utilities/lib/ui.js"() {
    }
  });

  // node_modules/@create-figma-plugin/utilities/lib/index.js
  var init_lib = __esm({
    "node_modules/@create-figma-plugin/utilities/lib/index.js"() {
      init_events();
      init_ui();
    }
  });

  // src/controller.ts
  var Controller, InputScheme, Platform, Keycode;
  var init_controller = __esm({
    "src/controller.ts"() {
      Controller = class {
        static getLeftNavKeycode(platform, inputScheme) {
          switch (platform) {
            case Platform.XBOX:
              switch (inputScheme) {
                case InputScheme.DPAD:
                  return Keycode.XBX_DPAD_LEFT;
                case InputScheme.LEFT_STICK:
                  return Keycode.XBX_LS_LEFT;
                case InputScheme.SHOULDER_BUTTONS:
                  return Keycode.XBX_LB;
                case InputScheme.TRIGGER_BUTTONS:
                  return void 0;
              }
            case Platform.PLAYSTATION:
              switch (inputScheme) {
                case InputScheme.DPAD:
                  return void 0;
                case InputScheme.LEFT_STICK:
                  return void 0;
                case InputScheme.SHOULDER_BUTTONS:
                  return void 0;
                case InputScheme.TRIGGER_BUTTONS:
                  return void 0;
              }
          }
        }
        static getUpNavKeycode(platform, inputScheme) {
          switch (platform) {
            case Platform.XBOX:
              switch (inputScheme) {
                case InputScheme.DPAD:
                  return Keycode.XBX_DPAD_UP;
                case InputScheme.LEFT_STICK:
                  return Keycode.XBX_LS_UP;
                case InputScheme.SHOULDER_BUTTONS:
                  return void 0;
                case InputScheme.TRIGGER_BUTTONS:
                  return void 0;
              }
            case Platform.PLAYSTATION:
              switch (inputScheme) {
                case InputScheme.DPAD:
                  return void 0;
                case InputScheme.LEFT_STICK:
                  return void 0;
                case InputScheme.SHOULDER_BUTTONS:
                  return void 0;
                case InputScheme.TRIGGER_BUTTONS:
                  return void 0;
              }
          }
        }
        static getRightNavKeycode(platform, inputScheme) {
          switch (platform) {
            case Platform.XBOX:
              switch (inputScheme) {
                case InputScheme.DPAD:
                  return Keycode.XBX_DPAD_RIGHT;
                case InputScheme.LEFT_STICK:
                  return Keycode.XBX_LS_RIGHT;
                case InputScheme.SHOULDER_BUTTONS:
                  return Keycode.XBX_RB;
                case InputScheme.TRIGGER_BUTTONS:
                  return void 0;
              }
            case Platform.PLAYSTATION:
              switch (inputScheme) {
                case InputScheme.DPAD:
                  return void 0;
                case InputScheme.LEFT_STICK:
                  return void 0;
                case InputScheme.SHOULDER_BUTTONS:
                  return void 0;
                case InputScheme.TRIGGER_BUTTONS:
                  return void 0;
              }
          }
        }
        static getDownNavKeycode(platform, inputScheme) {
          switch (platform) {
            case Platform.XBOX:
              switch (inputScheme) {
                case InputScheme.DPAD:
                  return Keycode.XBX_DPAD_DOWN;
                case InputScheme.LEFT_STICK:
                  return Keycode.XBX_LS_DOWN;
                case InputScheme.SHOULDER_BUTTONS:
                  return void 0;
                case InputScheme.TRIGGER_BUTTONS:
                  return void 0;
              }
            case Platform.PLAYSTATION:
              switch (inputScheme) {
                case InputScheme.DPAD:
                  return void 0;
                case InputScheme.LEFT_STICK:
                  return void 0;
                case InputScheme.SHOULDER_BUTTONS:
                  return void 0;
                case InputScheme.TRIGGER_BUTTONS:
                  return void 0;
              }
          }
        }
      };
      (function(InputScheme2) {
        InputScheme2["DPAD"] = "D-Pad";
        InputScheme2["LEFT_STICK"] = "Left Stick";
        InputScheme2["SHOULDER_BUTTONS"] = "Shoulder Buttons";
        InputScheme2["TRIGGER_BUTTONS"] = "Trigger Buttons";
      })(InputScheme || (InputScheme = {}));
      (function(Platform2) {
        Platform2["XBOX"] = "Xbox";
        Platform2["PLAYSTATION"] = "PlayStation";
      })(Platform || (Platform = {}));
      (function(Keycode2) {
        Keycode2[Keycode2["XBX_DPAD_DOWN"] = 13] = "XBX_DPAD_DOWN";
        Keycode2[Keycode2["XBX_DPAD_UP"] = 12] = "XBX_DPAD_UP";
        Keycode2[Keycode2["XBX_DPAD_LEFT"] = 14] = "XBX_DPAD_LEFT";
        Keycode2[Keycode2["XBX_DPAD_RIGHT"] = 15] = "XBX_DPAD_RIGHT";
        Keycode2[Keycode2["XBX_LS_DOWN"] = 1003] = "XBX_LS_DOWN";
        Keycode2[Keycode2["XBX_LS_UP"] = 1002] = "XBX_LS_UP";
        Keycode2[Keycode2["XBX_LS_LEFT"] = 1e3] = "XBX_LS_LEFT";
        Keycode2[Keycode2["XBX_LS_RIGHT"] = 1001] = "XBX_LS_RIGHT";
        Keycode2[Keycode2["XBX_LB"] = 4] = "XBX_LB";
        Keycode2[Keycode2["XBX_RB"] = 5] = "XBX_RB";
      })(Keycode || (Keycode = {}));
    }
  });

  // src/config.ts
  var _Config, Config;
  var init_config = __esm({
    "src/config.ts"() {
      init_controller();
      _Config = class {
        constructor(platform, inputScheme, leftInput, upInput, rightInput, downInput, variantProperty, variantFromValue, variantToValue) {
          this.platform = platform;
          this.inputScheme = inputScheme;
          this.leftInput = leftInput;
          this.upInput = upInput;
          this.rightInput = rightInput;
          this.downInput = downInput;
          this.variantProperty = variantProperty;
          this.variantFromValue = variantFromValue, this.variantToValue = variantToValue;
        }
        static assignInputs(config, leftInput, upInput, rightInput, downInput) {
          return new _Config(config.platform, config.inputScheme, leftInput, upInput, rightInput, downInput, config.variantProperty, config.variantFromValue, config.variantToValue);
        }
        static isConfigSaved() {
          let configString = figma.root.getPluginData(_Config.CONFIG_KEY);
          return configString && configString.length > 0;
        }
        static getSavedConfig() {
          return JSON.parse(figma.root.getPluginData(_Config.CONFIG_KEY));
        }
        static clear() {
          figma.root.setPluginData(_Config.CONFIG_KEY, "");
        }
        static save(config) {
          figma.root.setPluginData(_Config.CONFIG_KEY, JSON.stringify(config));
        }
        static getDefaultConfig() {
          return new _Config(Platform.XBOX, InputScheme.DPAD, Keycode.XBX_DPAD_LEFT, Keycode.XBX_DPAD_UP, Keycode.XBX_DPAD_RIGHT, Keycode.XBX_DPAD_DOWN, "", "", "");
        }
      };
      Config = _Config;
      Config.CONFIG_KEY = "config";
      Config.ANIM_DURATION = 0.2;
      Config.GAP = 100;
    }
  });

  // src/constants.ts
  var Constants;
  var init_constants = __esm({
    "src/constants.ts"() {
      Constants = class {
      };
      Constants.EVENT_DONE = "DONE";
      Constants.EVENT_ERROR = "ERROR";
      Constants.EVENT_UI_RESIZE = "UI_RESIZE";
      Constants.EVENT_SUBMIT = "SUBMIT";
      Constants.ERROR_NOTHING_SELECTED = "Nothing selected. Select component instances to link and try again.";
      Constants.ERROR_NO_INSTANCES = "Selection does not contain any component instance with your variant property.";
    }
  });

  // src/main.ts
  var main_exports = {};
  __export(main_exports, {
    default: () => main_default
  });
  function main_default() {
    const WIDTH = 240;
    const MIN_HEIGHT = 412;
    var Direction;
    (function(Direction2) {
      Direction2[Direction2["LEFT"] = 0] = "LEFT";
      Direction2[Direction2["TOP"] = 1] = "TOP";
      Direction2[Direction2["RIGHT"] = 2] = "RIGHT";
      Direction2[Direction2["BOTTOM"] = 3] = "BOTTOM";
    })(Direction || (Direction = {}));
    class PrototypeNode {
      constructor(instance, x, y, width, height) {
        if (instance) {
          this.instance = instance;
          this.nodeMap = this.buildNodeMap(instance);
          this.x = x;
          this.y = y;
          this.centerX = x + width / 2;
          this.centerY = y + height / 2;
          this.width = width;
          this.height = height;
        } else {
          throw new Error("Instance Node cannot be null");
        }
      }
      buildNodeMap(instance) {
        let nodeMap = new Array();
        let currentNode = instance;
        if (!isPage(currentNode.parent)) {
          while (!isPage(currentNode.parent)) {
            nodeMap.unshift(currentNode.parent.children.indexOf(currentNode));
            currentNode = currentNode.parent;
          }
        }
        return nodeMap;
      }
      id() {
        return this.instance.id;
      }
      offset(x, y) {
        return new PrototypeNode(this.instance, this.x - x, this.y - y, this.width, this.height);
      }
      static fromInstance(node) {
        return new PrototypeNode(node, node.absoluteTransform[0][2], node.absoluteTransform[1][2], node.width, node.height);
      }
    }
    class PrototypeFrame {
      constructor(node, parent) {
        this.node = node;
        this.parent = parent;
      }
      moveTo(x, y) {
        this.parent.x = x;
        this.parent.y = y;
      }
    }
    let config;
    showUI({ width: WIDTH, height: MIN_HEIGHT }, { config: Config.isConfigSaved() ? Config.getSavedConfig() : Config.getDefaultConfig() });
    on(Constants.EVENT_SUBMIT, (data) => {
      runPlugin(data);
    });
    on(Constants.EVENT_UI_RESIZE, (height) => {
      figma.ui.resize(WIDTH, height);
    });
    function runPlugin(config2) {
      try {
        initializeConfig(config2);
        let selection = figma.currentPage.selection;
        if (selection.length > 0) {
          if (selection.length === 1) {
            processSingleSelection(selection[0]);
          } else {
            processMultiSelection(selection);
          }
        } else {
          postError(0, Constants.ERROR_NOTHING_SELECTED);
        }
      } catch (error) {
        postError(0, JSON.stringify(error));
      } finally {
        emit(Constants.EVENT_DONE);
      }
    }
    function assignInputKeycodes(config2) {
      return Config.assignInputs(config2, Controller.getLeftNavKeycode(config2.platform, config2.inputScheme), Controller.getUpNavKeycode(config2.platform, config2.inputScheme), Controller.getRightNavKeycode(config2.platform, config2.inputScheme), Controller.getDownNavKeycode(config2.platform, config2.inputScheme));
    }
    function initializeConfig(configData) {
      config = assignInputKeycodes(configData);
      Config.save(config);
    }
    function processSingleSelection(node) {
      if (hasChildren(node)) {
        processMultiSelection(node.children);
      } else {
        postError(0, Constants.ERROR_NO_INSTANCES);
      }
    }
    function processMultiSelection(selection) {
      selection = selection.filter((node) => isInstance(node) && hasVariantProperty(node, config.variantProperty));
      if (selection.length > 0) {
        let nodes = selection.map((node) => PrototypeNode.fromInstance(node));
        sanitizeNodes(nodes);
        sortNodes(nodes);
        let frames = createFrames(nodes);
        assignNeighbors(frames, nodes);
        arrangeFrames(frames);
        swapVariants(frames);
        createInteractions(frames);
        postProcessFrames(frames);
      } else {
        postError(0, Constants.ERROR_NO_INSTANCES);
      }
    }
    function postProcessFrames(frames) {
      addFlowStartingPoint(frames[0].parent, "Generated Prototype");
    }
    function sortNodes(nodes) {
      nodes.sort(function(node1, node2) {
        let result = 0;
        if (node1.y < node2.y) {
          result = -1;
        } else if (node1.y === node2.y) {
          if (node1.x < node2.x) {
            result = -1;
          } else if (node1.x === node2.x) {
            result = 0;
          } else {
            result = 1;
          }
        } else {
          result = 1;
        }
        return result;
      });
    }
    function createInteractions(frames) {
      for (let frame of frames) {
        let reactions = clone(frame.parent.reactions);
        if (frame.leftNeighbor)
          reactions.push(createReaction(frame.leftNeighbor.parent, config.leftInput));
        if (frame.topNeighbor)
          reactions.push(createReaction(frame.topNeighbor.parent, config.upInput));
        if (frame.rightNeighbor)
          reactions.push(createReaction(frame.rightNeighbor.parent, config.rightInput));
        if (frame.bottomNeighbor)
          reactions.push(createReaction(frame.bottomNeighbor.parent, config.downInput));
        frame.parent.reactions = reactions;
      }
    }
    function createReaction(toNode, keycode) {
      let reaction = {
        action: {
          type: "NODE",
          destinationId: toNode.id,
          navigation: "NAVIGATE",
          transition: {
            type: "SMART_ANIMATE",
            easing: { type: "EASE_OUT" },
            duration: Config.ANIM_DURATION
          },
          preserveScrollPosition: false
        },
        trigger: {
          type: "ON_KEY_DOWN",
          device: "XBOX_ONE",
          keyCodes: [keycode]
        }
      };
      return reaction;
    }
    function swapVariants(frames) {
      for (let frame of frames) {
        if (hasVariantProperty(frame.node, config.variantProperty)) {
          setVariantProperty(frame.node, config.variantProperty, config.variantToValue);
        }
      }
    }
    function hasVariantProperty(node, property) {
      let properties = node.variantProperties;
      if (properties === null)
        console.warn("Variant property not found");
      return properties !== null && property in properties;
    }
    function sanitizeNodes(nodes) {
      let parent = findParentFrame(nodes[0].instance);
      removeFlowStartingPoint(parent);
      for (let node of nodes) {
        if (hasVariantProperty(node.instance, config.variantProperty)) {
          setVariantProperty(node.instance, config.variantProperty, config.variantFromValue);
        }
      }
    }
    function setVariantProperty(node, propertyName, propertyValue) {
      let variantProperties = node.variantProperties;
      variantProperties[propertyName] = propertyValue;
      node.setProperties(variantProperties);
    }
    function arrangeFrames(frames) {
      let width = frames[0].parent.width;
      let height = frames[0].parent.height;
      let gap = Config.GAP;
      let framesToLayout = frames.map((frame) => frame);
      framesToLayout.splice(0, 1);
      for (let frame of frames) {
        if (frame.leftNeighbor && framesToLayout.indexOf(frame.leftNeighbor) !== -1) {
          frame.leftNeighbor.moveTo(frame.parent.x - width - gap, frame.parent.y);
          framesToLayout.splice(framesToLayout.indexOf(frame.leftNeighbor), 1);
        }
        if (frame.topNeighbor && framesToLayout.indexOf(frame.topNeighbor) !== -1) {
          frame.topNeighbor.moveTo(frame.parent.x, frame.parent.y - height - gap);
          framesToLayout.splice(framesToLayout.indexOf(frame.topNeighbor), 1);
        }
        if (frame.rightNeighbor && framesToLayout.indexOf(frame.rightNeighbor) !== -1) {
          frame.rightNeighbor.moveTo(frame.parent.x + width + gap, frame.parent.y);
          framesToLayout.splice(framesToLayout.indexOf(frame.rightNeighbor), 1);
        }
        if (frame.bottomNeighbor && framesToLayout.indexOf(frame.bottomNeighbor) !== -1) {
          frame.bottomNeighbor.moveTo(frame.parent.x, frame.parent.y + height + gap);
          framesToLayout.splice(framesToLayout.indexOf(frame.bottomNeighbor), 1);
        }
      }
    }
    function createFrames(nodes) {
      let prototypeFrames = new Array();
      let node = nodes[0].instance;
      let parent = findParentFrame(node);
      prototypeFrames.push(new PrototypeFrame(node, parent));
      for (let i = 1; i < nodes.length; i++) {
        parent = parent.clone();
        node = findNodeInParent(nodes[i].nodeMap, parent);
        prototypeFrames.push(new PrototypeFrame(node, parent));
      }
      return prototypeFrames;
    }
    function findNodeInParent(nodeMap, parent) {
      let node = parent;
      for (let i in nodeMap) {
        node = node.children[nodeMap[i]];
      }
      return node;
    }
    function assignNeighbors(frames, nodes) {
      for (let i in nodes) {
        let origin = nodes[i];
        let leftNode, topNode, rightNode, bottomNode;
        for (let j in nodes) {
          let node = nodes[j];
          if (i !== j) {
            let direction = computeRelativeDirection(node, origin);
            let distance = computeDistanceBetweenCenters(node, origin);
            switch (direction) {
              case 0: {
                if (leftNode === void 0 || distance < computeDistanceBetweenCenters(leftNode, origin)) {
                  leftNode = node;
                }
                break;
              }
              case 1: {
                if (topNode === void 0 || distance < computeDistanceBetweenCenters(topNode, origin)) {
                  topNode = node;
                }
                break;
              }
              case 2: {
                if (rightNode === void 0 || distance < computeDistanceBetweenCenters(rightNode, origin)) {
                  rightNode = node;
                }
                break;
              }
              case 3: {
                if (bottomNode === void 0 || distance < computeDistanceBetweenCenters(bottomNode, origin)) {
                  bottomNode = node;
                }
                break;
              }
            }
          }
        }
        frames[i].leftNeighbor = frames[nodes.indexOf(leftNode)];
        frames[i].topNeighbor = frames[nodes.indexOf(topNode)];
        frames[i].rightNeighbor = frames[nodes.indexOf(rightNode)];
        frames[i].bottomNeighbor = frames[nodes.indexOf(bottomNode)];
      }
    }
    function computeRelativeDirection(target, origin) {
      target = target.offset(origin.centerX, origin.centerY);
      let angle = (Math.atan2(target.centerY, target.centerX) * 180 / Math.PI + 360) % 360;
      let direction;
      if (angle > 150 && angle <= 210) {
        direction = 0;
      } else if (angle > 210 && angle <= 330) {
        direction = 1;
      } else if (angle > 330 && angle < 360 || angle >= 0 && angle <= 30) {
        direction = 2;
      } else {
        direction = 3;
      }
      return direction;
    }
    function computeDistanceBetweenCenters(node1, node2) {
      const a = node2.centerX - node1.centerX;
      const b = node2.centerY - node1.centerY;
      return Math.sqrt(a * a + b * b);
    }
    function findParentFrame(node) {
      let currentNode = node;
      let parentFrame;
      if (!isPage(currentNode.parent)) {
        while (!isPage(currentNode.parent)) {
          parentFrame = currentNode.parent;
          currentNode = parentFrame;
        }
      } else {
        parentFrame = currentNode;
      }
      return parentFrame;
    }
    function isInstance(node) {
      return node.type === "INSTANCE";
    }
    function isFrame(node) {
      return node.type === "FRAME";
    }
    function isGroup(node) {
      return node.type === "GROUP";
    }
    function isPage(node) {
      return node.type === "PAGE";
    }
    function hasChildren(node) {
      return "children" in node;
    }
    function removeFlowStartingPoint(node) {
      let flows = clone(figma.currentPage.flowStartingPoints);
      for (let i in flows) {
        if (flows[i].nodeId === node.id)
          flows.splice(i, 1);
      }
      figma.currentPage.flowStartingPoints = flows;
    }
    function addFlowStartingPoint(node, flowName) {
      let flows = clone(figma.currentPage.flowStartingPoints);
      flows.push({
        nodeId: node.id,
        name: flowName
      });
      figma.currentPage.flowStartingPoints = flows;
    }
    function postError(code, message) {
      emit(Constants.EVENT_ERROR, { code, message });
    }
    function clone(val) {
      const type = typeof val;
      if (val === null) {
        return null;
      } else if (type === "undefined" || type === "number" || type === "string" || type === "boolean") {
        return val;
      } else if (type === "object") {
        if (val instanceof Array) {
          return val.map((x) => clone(x));
        } else if (val instanceof Uint8Array) {
          return new Uint8Array(val);
        } else {
          let o = {};
          for (const key in val) {
            o[key] = clone(val[key]);
          }
          return o;
        }
      }
      throw "unknown";
    }
  }
  var init_main = __esm({
    "src/main.ts"() {
      init_lib();
      init_config();
      init_controller();
      init_constants();
    }
  });

  // <stdin>
  var modules = { "src/main.ts--default": (init_main(), main_exports)["default"] };
  var commandId = true ? "src/main.ts--default" : figma.command;
  modules[commandId]();
})();
