import { emit, on, showUI } from '@create-figma-plugin/utilities'
import { Config } from './config.js'
import { Constants } from './constants';
import { Animation, AnimationType } from './animation';
import { Navigation, NavScheme } from './navigation.js';
import { Device } from './device.js';
import { SwapVariant } from './swap_variant.js';

export default function () {

  const TITLE = 'Prototyper (BETA)';
  const WIDTH = 240;
  const MIN_HEIGHT = 428;
  const STARTING_POINT_NAME = 'Generated Prototype';

  enum Direction {
    LEFT = 0,
    TOP, // 1
    RIGHT, // 2
    BOTTOM // 3
  }

  class PrototypeNode {
    readonly instance; InstanceNode
    readonly nodeMap: Array<Number> // A map describing this nodes position in it's parent frame

    readonly x;
    readonly y;
    readonly centerX;
    readonly centerY;
    readonly width;
    readonly height;

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
        throw new Error('Instance Node cannot be null');
      }
    }

    private buildNodeMap(instance) {
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

    static fromInstance(node: InstanceNode) {
      return new PrototypeNode(node, node.absoluteTransform[0][2], node.absoluteTransform[1][2], node.width, node.height);
    }

  }

  class PrototypeFrame {
    readonly instance: InstanceNode
    readonly parent: FrameNode

    leftNeighbor: PrototypeFrame
    topNeighbor: PrototypeFrame
    rightNeighbor: PrototypeFrame
    bottomNeighbor: PrototypeFrame

    constructor(instance, parent) {
      this.instance = instance;
      this.parent = parent;
    }

    moveTo(x, y) {
      this.parent.x = x;
      this.parent.y = y;
    }
  }

  let config: Config;


  /* Main Program */
  Config.migrateConfig();

  showUI(
    { title: TITLE, width: WIDTH, height: MIN_HEIGHT },
    { config: Config.isConfigSaved() ? Config.getSavedConfig() : Config.getDefaultConfig() }
  )

  on(Constants.EVENT_SUBMIT, (data) => {
    runPlugin(data);
  });

  on(Constants.EVENT_UI_RESIZE, (height) => {
    figma.ui.resize(WIDTH, height);
  })

  function runPlugin(config: Config) {
    try {
      initializeConfig(config);
      let selection = figma.currentPage.selection;
      if (selection.length > 0) {
        // User has selected something to link, handle selection appropriately
        if (selection.length === 1) {
          processSingleSelection(selection[0]);
        } else {
          processMultiSelection(selection);
        }
      } else {
        postError(0, Constants.ERROR_NOTHING_SELECTED);
      }
    } catch (error) {
      postError(0, error.message);
    } finally {
      emit(Constants.EVENT_DONE);
    }
  }

  function initializeConfig(configData: Config) {
    config = configData
    Config.save(config)
  }

  function processSingleSelection(node) {
    // Only allow Frames or Groups to be processed since other nodes cannot have children nodes
    if (hasChildren(node) && node.children.length > 1) {
      processMultiSelection(node.children);
    } else {
      postError(0, Constants.ERROR_MORE_THAN_1_CHILD);
    }
  }

  function processMultiSelection(selection) {

    // Filter selection to only contain component instances
    let instances = selection.filter(node => isInstance(node));
    let protoFrames;

    try {
      if (instances.length > 0) {
        console.log(instances);
        // Validate selected instances and notify user of errors before we begin
        validateInstances(instances, config.swapVariant);
  
        // Perform general cleanup like reverting all variants to from value, if specifies
        sanitizeNodes(instances, config.swapVariant);
  
        // Map component instance nodes to our prototype node wrapper object
        let protoNodes: Array<PrototypeNode> = instances.map(node => PrototypeNode.fromInstance(node));
  
        // Sort nodes left -> right & top -> bottom regardless of canvas layer order
        sortNodes(protoNodes);
  
        // Create prototype frames to wire later
        protoFrames = createFrames(protoNodes);
  
        // Assign left, top, right and bottom neighbors for wiring the prototype
        assignNeighbors(protoFrames, protoNodes);
  
        // Arrange the frames on the canvas based on their relative position
        arrangeFrames(protoFrames);
  
        // Swap variants
        swapVariants(protoFrames, config.swapVariant);
  
        let isFrameAlreadyLinked = hasReactions(protoFrames[0].parent);
  
        // Create Interactions
        createInteractions(protoFrames);
  
        // Post process frames
        postProcessFrames(protoFrames, isFrameAlreadyLinked);
      }
      else {
        throw Error(Constants.ERROR_NO_INSTANCES);
      }
    }
    catch (error) {
      cleanup(protoFrames)
      throw error;
    }
  }

  function cleanup(protoFrames: Array<PrototypeFrame>) {
    if (protoFrames) {
      for (let i = 1; i < protoFrames.length; i++) {
        protoFrames[i].parent.remove();
      }
    }
  }

  function validateInstances(instances: Array<InstanceNode>, swapVariant: SwapVariant) {
    let property = swapVariant.property;
    let from = swapVariant.from;
    let to = swapVariant.to;
    for (let instance of instances) {
      if (!hasVariantProperty(instance, property)) {
        throw new Error(`Cannot find the property "${property}" on layer "${instance.name}". Please type it exactly as it appears in the Variants Panel.`);
      }
      if (from.length > 0 && !hasVariantValue(instance, property, from)) {
        throw new Error(`Cannot find the value "${from}" on layer "${instance.name}". Please type it exactly as it appears in the Variants Panel.`);
      }
      if (!hasVariantValue(instance, property, to)) {
        throw new Error(`Cannot find the value "${to}" on layer "${instance.name}". Please type it exactly as it appears in the Variants Panel.`);
      }
    }
  }

  function postProcessFrames(frames: Array<PrototypeFrame>, isAlreadyLinked) {
    if (!isAlreadyLinked) {
      addFlowStartingPoint(frames[0].parent, STARTING_POINT_NAME);
    }
  }

  function sortNodes(nodes: Array<PrototypeNode>) {
    nodes.sort(function (node1, node2) {
      let result = 0;
      if (node1.y < node2.y) {
        result = -1;
      }
      else if (node1.y === node2.y) {
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

  function createInteractions(frames: Array<PrototypeFrame>) {
    let device: Device = config.device;
    let animation: Animation = config.animation;
    let nav: Navigation = config.navigation;
    for (let frame of frames) {
      let reactions: Array<Reaction> = clone(frame.parent.reactions);
      if (frame.leftNeighbor) reactions.push(createReaction(frame.leftNeighbor.parent, device, animation, nav.left));
      if (frame.topNeighbor) reactions.push(createReaction(frame.topNeighbor.parent, device, animation, nav.up));
      if (frame.rightNeighbor) reactions.push(createReaction(frame.rightNeighbor.parent, device, animation, nav.right));
      if (frame.bottomNeighbor) reactions.push(createReaction(frame.bottomNeighbor.parent, device, animation, nav.down));
      frame.parent.reactions = reactions;
    }
  }

  function createReaction(toNode: FrameNode, device: Device, animation: Animation, keycode: number) {
    let reaction: Reaction = {
      action: {
        type: "NODE",
        destinationId: toNode.id,
        navigation: "NAVIGATE",
        transition: createTransition(animation),
        preserveScrollPosition: false,
      },
      trigger: {
        type: "ON_KEY_DOWN",
        device: device,
        keyCodes: [keycode],
      }
    };
    return reaction;
  }

  function createTransition(animation: Animation) {
    let transition;
    if (animation.animType === AnimationType.INSTANT) {
      transition = null;
    } else {
      transition = {
        type: "SMART_ANIMATE",
        easing: { type: animation.animType },
        duration: animation.duration / 1000, // Figma expects duration in seconds
      }
    }
    return transition;
  }

  function swapVariants(frames: Array<PrototypeFrame>, swapVariant: SwapVariant) {
    let property = swapVariant.property
    let toVariant = swapVariant.to
    for (let frame of frames) {
      if (hasVariantProperty(frame.instance, property)) {
        setVariantProperty(frame.instance, property, toVariant)
      }
    }
  }

  function hasVariantProperty(instance, property) {
    let properties = instance.variantProperties;
    return properties !== null && property in properties;
  }

  function hasVariantValue(instance, property, value) {
    if (isComponent(instance.mainComponent) && isComponentSet(instance.mainComponent.parent)) {
      let componentSet = instance.mainComponent.parent;
      return componentSet.variantGroupProperties[property].values.indexOf(value) >= 0;
    }
    else {
      return false;
    }
  }

  function sanitizeNodes(instances: Array<InstanceNode>, swapVariant: SwapVariant) {
    // Remove flow staring point on parent node else it will be duplicated in the prototype
    let parent = findParentFrame(instances[0]);
    removeFlowStartingPoint(parent);

    // If variant from value is defined, reset all variants to their from value
    console.log(swapVariant);
    let fromVariant = swapVariant.from
    let property = swapVariant.property
    if (fromVariant.length > 0) {
      for (let instance of instances) {
        setVariantProperty(instance, property, fromVariant);
      }
    }
  }

  function setVariantProperty(node, propertyName, propertyValue) {
    let variantProperties = node.variantProperties;
    variantProperties[propertyName] = propertyValue;
    node.setProperties(variantProperties);
  }

  function arrangeFrames(frames: Array<PrototypeFrame>) {
    // Since the first frame is the user's reference, use it as the starting point
    let width = frames[0].parent.width;
    let height = frames[0].parent.height;
    let gap = Config.GAP;

    // Create a duplicate array to track what frames are left to layout
    let framesToLayout: Array<PrototypeFrame> = frames.map(frame => frame);
    // Remove the first frame since it was already arranged by the user
    framesToLayout.splice(0, 1);

    // Use relative position of frames to arrange them on the canvas
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

  function createFrames(nodes: Array<PrototypeNode>) {
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

  function findNodeInParent(nodeMap, parent: FrameNode) {
    let node: any = parent;
    for (let i in nodeMap) {
      node = node.children[nodeMap[i]];
    }
    return node;
  }

  function assignNeighbors(frames: Array<PrototypeFrame>, nodes: Array<PrototypeNode>) {
    // For each node (let's call it origin), find neighbors and assign it to the respective prototype frame
    for (let i in nodes) {
      let origin = nodes[i];
      let leftNode, topNode, rightNode, bottomNode;
      // Check each node's relative position against the origin node
      for (let j in nodes) {
        let node = nodes[j];
        if (i !== j) {
          let direction = computeRelativeDirection(node, origin);
          let distance = computeDistanceBetweenCenters(node, origin);
          // Update closest node for each direction
          switch (direction) {
            case Direction.LEFT: {
              if (leftNode === undefined || distance < computeDistanceBetweenCenters(leftNode, origin)) {
                leftNode = node;
              }
              break;
            }

            case Direction.TOP: {
              if (topNode === undefined || distance < computeDistanceBetweenCenters(topNode, origin)) {
                topNode = node;
              }
              break;
            }

            case Direction.RIGHT: {
              if (rightNode === undefined || distance < computeDistanceBetweenCenters(rightNode, origin)) {
                rightNode = node;
              }
              break;
            }

            case Direction.BOTTOM: {
              if (bottomNode === undefined || distance < computeDistanceBetweenCenters(bottomNode, origin)) {
                bottomNode = node;
              }
              break;
            }
          }
        }
      }

      console.log(`Left: ${leftNode}, Right: ${rightNode}, Top: ${topNode}, Bottom: ${bottomNode}`);
      // Only assign neighbors if current navigation scheme supports it, else throw error

      if (is4DNav(config)) {
        frames[i].leftNeighbor = frames[nodes.indexOf(leftNode)];
        frames[i].rightNeighbor = frames[nodes.indexOf(rightNode)];
        frames[i].topNeighbor = frames[nodes.indexOf(topNode)];
        frames[i].bottomNeighbor = frames[nodes.indexOf(bottomNode)];
      }

      if (isHorizontalOnlyNav(config)) {
        if (topNode || bottomNode) {
          throw new Error('Please only select layers that are arranged horizontally because your current navigation choice does not support vertical navigation')
        }
        frames[i].leftNeighbor = frames[nodes.indexOf(leftNode)];
        frames[i].rightNeighbor = frames[nodes.indexOf(rightNode)];
      }

    }
  }

  function is4DNav(config: Config) {
    let scheme = config.navigation.scheme
    return scheme === NavScheme.DPAD || scheme === NavScheme.LEFT_STICK || scheme === NavScheme.RIGHT_STICK
  }

  function isHorizontalOnlyNav(config: Config) {
    let scheme = config.navigation.scheme
    return scheme === NavScheme.SHOULDER_BUTTONS || scheme === NavScheme.TRIGGER_BUTTONS

  }

  function computeRelativeDirection(target: PrototypeNode, origin: PrototypeNode) {
    // Offset coordinates to be relative to origin node
    target = target.offset(origin.centerX, origin.centerY);
    // Calculate angle in degrees between 0 to 360
    let angle = ((Math.atan2(target.centerY, target.centerX) * 180 / Math.PI) + 360) % 360;

    // Map angle to direction and return
    let direction;
    if (angle > 150 && angle <= 210) {
      direction = Direction.LEFT;
    }
    else if (angle > 210 && angle <= 330) {
      direction = Direction.TOP;
    }
    else if ((angle > 330 && angle < 360) || (angle >= 0 && angle <= 30)) {
      direction = Direction.RIGHT
    } else {
      direction = Direction.BOTTOM;
    }
    return direction;
  }

  function computeDistanceBetweenCenters(node1: PrototypeNode, node2: PrototypeNode) {
    // Calculate distance between center points with Pythagoras Theorem
    const a = node2.centerX - node1.centerX;
    const b = node2.centerY - node1.centerY;
    return Math.sqrt(a * a + b * b);
  }

  function findParentFrame(node: InstanceNode) {
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
    return node && node.type === 'INSTANCE';
  }

  function isFrame(node) {
    return node && node.type === 'FRAME';
  }

  function isGroup(node) {
    return node && node.type === 'GROUP';
  }

  function isPage(node) {
    return node && node.type === 'PAGE';
  }

  function hasChildren(node) {
    return node && 'children' in node;
  }

  function isComponent(node) {
    return node && node.type === 'COMPONENT';
  }

  function isComponentSet(node) {
    return node && node.type === 'COMPONENT_SET';
  }

  function hasReactions(frame) {
    return frame.reactions && frame.reactions.length > 0;
  }

  function removeFlowStartingPoint(node) {
    let flows = clone((figma.currentPage as any).flowStartingPoints);
    for (let i in flows) {
      if (flows[i].nodeId === node.id) flows.splice(i, 1);
    }
    (figma.currentPage as any).flowStartingPoints = flows;
  }

  function addFlowStartingPoint(node, flowName) {
    let flows = clone((figma.currentPage as any).flowStartingPoints);
    flows.push(
      {
        nodeId: node.id,
        name: flowName
      }
    );
    (figma.currentPage as any).flowStartingPoints = flows;
  }

  function postError(code: number, message: string) {
    console.error(message);
    emit(Constants.EVENT_ERROR, { code: code, message: message });
  }

  function clone(val) {
    const type = typeof val
    if (val === null) {
      return null
    } else if (type === 'undefined' || type === 'number' ||
      type === 'string' || type === 'boolean') {
      return val
    } else if (type === 'object') {
      if (val instanceof Array) {
        return val.map(x => clone(x))
      } else if (val instanceof Uint8Array) {
        return new Uint8Array(val)
      } else {
        let o = {}
        for (const key in val) {
          o[key] = clone(val[key])
        }
        return o
      }
    }
    throw 'unknown'
  }
}