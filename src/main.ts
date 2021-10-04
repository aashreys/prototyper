import { emit, on, showUI } from '@create-figma-plugin/utilities'
import { Config } from './config.js'
import { Constants } from './constants';
import { Animation, AnimationType } from './animation';
import { Navigation, NavScheme } from './navigation.js';
import { Device } from './device.js';
import { SwapVariant } from './swap_variant.js';
import { PrototypeNode } from './prototype_node';
import { PrototypeFrame } from './prototype_frame.js';
import { Utils } from './utils.js';
import { NearestNeighbor, NeighborIndex, Point } from './core/nearest_neighbor.js';

export default function () {

  const TITLE = 'Prototyper (BETA)';
  const WIDTH = 240;
  const MIN_HEIGHT = 428;
  const STARTING_POINT_NAME = 'Generated Prototype';

  enum Mode {
    GENERATE,
    LINK
  }

  let config: Config

  /* Main Program */
  Config.migrateConfig();

  showUI(
    { title: TITLE, width: WIDTH, height: MIN_HEIGHT },
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

  function initializeConfig(configData: Config) {
    config = configData
    Config.save(config)
  }

  function runPlugin(config: Config, mode: Mode) {
    initializeConfig(config);
    try {
      let selection = figma.currentPage.selection;

      if (mode === Mode.GENERATE) {
        if (selection.length > 1) processMultiSelection(selection);
        else if (selection.length === 1 )processSingleSelection(selection[0]);
        else postError(0, Constants.ERROR_NOTHING_SELECTED);
      }

      if (mode === Mode.LINK) {
        if (selection.length > 1) doLinkFrames(config, selection);
        else if (selection.length === 1) postError(0, 'Please select more than one frame to link together.');
        else postError(0, 'Nothing selected. Please select the frames you would like to link together.');
      }

    } catch (error) {
      postError(0, error.message);
    } finally {
      emit(Constants.EVENT_DONE);
    }
  }

  function processSingleSelection(node) {
    // Only allow Frames or Groups to be processed since other nodes cannot have children nodes
    if (Utils.hasChildren(node) && node.children.length > 1) {
      processMultiSelection(node.children);
    } else {
      postError(0, Constants.ERROR_MORE_THAN_1_CHILD);
    }
  }

  function processMultiSelection(selection) {

    // Filter selection to only contain component instances
    let instances = selection.filter(node => Utils.isInstance(node));
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

        // Swap variants
        swapVariants(protoFrames, config.swapVariant);
  
        // Assign left, top, right and bottom neighbors for wiring the prototype
        assignNeighbors(protoFrames, protoNodes.map(node => ({x: node.centerX, y: node.centerY})));
        

        // Layout frames on the canvas based on their relative position
        layoutFrames(protoFrames);
          
        // Create Interactions
        createInteractions(protoFrames);

        // Post process frames
        postProcessFrames(protoFrames);
        
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

  function doLinkFrames(config, selection) {
    let frames = selection;
    
    // Validate that selection is top level frames
    validateFramesToLink(frames);

    // Create proto frames to link layer
    let protoFrames: Array<PrototypeFrame> = frames.map(frame => new PrototypeFrame(null, frame));

    // Sort proto frames
    sortProtoFrames(protoFrames);

    // assign neighbors
    assignNeighbors(protoFrames, protoFrames.map(frame => ({x: frame.parent.x, y: frame.parent.y})))

    // Create Interactions
    createInteractions(protoFrames);

    // Post process frames
    postProcessFrames(protoFrames);
  }

  function sortProtoFrames(protoFrames: Array<PrototypeFrame>) {
    protoFrames.sort(function (frame1, frame2) {
      let result = 0;
      let parent1 = frame1.parent;
      let parent2 = frame2.parent;
      if (parent1.y < parent2.y) {
        result = -1;
      }
      else if (parent1.y === parent2.y) {
        if (parent1.x < parent2.x) {
          result = -1;
        } else if (parent1.x === parent2.x) {
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

  function validateFramesToLink(frames: Array<SceneNode>) {
    for (let frame of frames) {
      if(!Utils.isTopLevelFrame(frame)) {
        throw new Error(`Layer "${frame.name}" is not a top-level frame. Please select only top-level frames to link.`)
      }
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

  function postProcessFrames(frames: Array<PrototypeFrame>) {
    if(!Utils.hasStartingPoint(frames[0].parent)) {
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
      let reactions: Array<Reaction> = Utils.clone(frame.parent.reactions);
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
    if (Utils.isComponent(instance.mainComponent) && Utils.isComponentSet(instance.mainComponent.parent)) {
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

  function layoutFrames(frames: Array<PrototypeFrame>) {
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

      if (frame.rightNeighbor && framesToLayout.indexOf(frame.rightNeighbor) !== -1) {
        frame.rightNeighbor.moveTo(frame.parent.x + width + gap, frame.parent.y);
        framesToLayout.splice(framesToLayout.indexOf(frame.rightNeighbor), 1);
      }

      if (frame.topNeighbor && framesToLayout.indexOf(frame.topNeighbor) !== -1) {
        frame.topNeighbor.moveTo(frame.parent.x, frame.parent.y - height - gap);
        framesToLayout.splice(framesToLayout.indexOf(frame.topNeighbor), 1);
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

  function assignNeighbors(frames: Array<PrototypeFrame>, points: Array<Point>) {
    let neighbors: Array<NeighborIndex> = NearestNeighbor.computeNeighbors(points);
    for (let i in frames) {
      frames[i].leftNeighbor = frames[neighbors[i].left];
      frames[i].rightNeighbor = frames[neighbors[i].right];
      frames[i].topNeighbor = frames[neighbors[i].top];
      frames[i].bottomNeighbor = frames[neighbors[i].bottom];
      if (isHorizontalOnlyNav(config)) {
        if (frames[i].topNeighbor || frames[i].bottomNeighbor) {
          throw new Error('Please only select layers that are arranged horizontally because your current navigation choice does not support vertical navigation')
        }
      }
    }
  }

  function isHorizontalOnlyNav(config: Config) {
    let scheme = config.navigation.scheme
    return scheme === NavScheme.SHOULDER_BUTTONS || scheme === NavScheme.TRIGGER_BUTTONS

  }

  function findParentFrame(node: InstanceNode) {
    let currentNode = node;
    let parentFrame;
    if (!Utils.isPage(currentNode.parent)) {
      while (!Utils.isPage(currentNode.parent)) {
        parentFrame = currentNode.parent;
        currentNode = parentFrame;
      }
    } else {
      parentFrame = currentNode;
    }
    return parentFrame;
  }

  function removeFlowStartingPoint(node) {
    let flows = Utils.clone((figma.currentPage as any).flowStartingPoints);
    for (let i in flows) {
      if (flows[i].nodeId === node.id) flows.splice(i, 1);
    }
    (figma.currentPage as any).flowStartingPoints = flows;
  }

  function addFlowStartingPoint(node, flowName) {
    let flows = Utils.clone((figma.currentPage as any).flowStartingPoints);
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
}