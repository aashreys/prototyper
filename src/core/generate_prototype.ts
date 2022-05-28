import { Config } from "../config";
import { PrototypeFrame } from "../prototype_frame";
import { PrototypeNode } from "../prototype_node";
import { SwapVariant } from "../swap_variant";
import { Utils } from "../utils";
import { NearestNeighbor } from "./nearest_neighbor";

export function doGeneratePrototype(config: Config) {
  let instances: Array<InstanceNode> = filterInstancesFromSelection(figma.currentPage.selection)
  validateInstances(instances, config)
  sanitizeInstances(instances, config);

  let isLinked: boolean = Utils.findTopLevelFrame(instances[0]).reactions.length > 0
  
  let protoNodes: Array<PrototypeNode> = instances.map(node => PrototypeNode.fromInstance(node));
  sortProtoNodes(protoNodes);
  assignNodeNeighbors(protoNodes);

  let protoFrames = createProtoFrames(protoNodes);
  assignFrameNeighors(protoFrames, protoNodes);
  layoutFrames(protoFrames);
  swapVariants(protoFrames, config);
  createInteractions(protoFrames, config);

  if (!isLinked) addFlowStartingPoint(protoFrames);
}

function filterInstancesFromSelection(selection: ReadonlyArray<SceneNode>): Array<InstanceNode> {
  let instances: Array<InstanceNode> = [];
  if (selection.length > 1) {
    instances = selection.filter(node => Utils.isInstance(node)) as Array<InstanceNode>;
  }
  else if (selection.length === 1) {
    if (Utils.hasChildren(selection[0]) && (selection[0] as any).children.length > 1) {
      instances = filterInstancesFromSelection((selection[0] as any).children);
    }
  }
  return instances;
}

function validateInstances(instances: Array<InstanceNode>, config: Config) {
  validateInstancesLength(instances)
  validateVariantProperties(instances, config.swapVariant)
}

function validateInstancesLength(instances: Array<InstanceNode>) {
  if (instances.length < 2) {
    throw new Error('Please select 2 or more component instances and try again.')
  }
}

function validateVariantProperties(instances: Array<InstanceNode>, swapVariant: SwapVariant) {
  let property = swapVariant.property;
  let from = swapVariant.from;
  let to = swapVariant.to;
  for (let instance of instances) {
    if (Utils.hasVariantErrors(instance)) {
      throw new Error(`Found errors in the component set for layer "${instance.name}". Please resolve the errors and try again.`)
    }
    if (!Utils.hasVariantProperty(instance, property)) {
      throw new Error(`Cannot find variant property "${property}" on layer "${instance.name}". Please type it exactly as it appears in the Variants Panel.`);
    }
    if (from.length > 0 && !Utils.hasVariantValue(instance, property, from)) {
      throw new Error(`Cannot find variant value "${from}" on layer "${instance.name}". Please type it exactly as it appears in the Variants Panel.`);
    }
    if (!Utils.hasVariantValue(instance, property, to)) {
      throw new Error(`Cannot find variant value "${to}" on layer "${instance.name}". Please type it exactly as it appears in the Variants Panel.`);
    }
  }
}

function sanitizeInstances(instances: Array<InstanceNode>, config: Config) {
  // Remove flow staring point on parent node else it will be duplicated in the prototype
  let topLevelFrame = Utils.findTopLevelFrame(instances[0]);
  Utils.removeFlowStartingPoint(topLevelFrame);

  // If variant from value is defined, reset all variants to their from value
  let fromVariant = config.swapVariant.from
  let property = config.swapVariant.property
  if (fromVariant.length > 0) {
    for (let instance of instances) {
      Utils.setVariantProperty(instance, property, fromVariant);
    }
  }
}

function sortProtoNodes(protoNodes: Array<PrototypeNode>) {
  protoNodes.sort(function (node1, node2) {
    return Utils.sortCoordinates(node1.x, node1.y, node2.x, node2.y)
  });
}

function assignNodeNeighbors(protoNodes: Array<PrototypeNode>) {
  NearestNeighbor.assignNeigbors(protoNodes);
}

function createProtoFrames(protoNodes: Array<PrototypeNode>) {
  let protoFrames = new Array();
  let node = protoNodes[0].instance;
  let topLevelFrame = Utils.findTopLevelFrame(node);

  protoFrames.push(new PrototypeFrame(node, topLevelFrame));

  let numberAtEndRegex: RegExp = /\d+$/; // https://stackoverflow.com/questions/6340180/regex-to-get-the-number-from-the-end-of-a-string
  if (!topLevelFrame.name.match(numberAtEndRegex)) topLevelFrame.name = topLevelFrame.name + " 1";
  let suffix: any = topLevelFrame.name.match(numberAtEndRegex)[0]
  let baseName = topLevelFrame.name.substring(0, topLevelFrame.name.lastIndexOf(suffix))
  suffix = Number(suffix)

  for (let i = 1; i < protoNodes.length; i++) {
    topLevelFrame = topLevelFrame.clone();
    topLevelFrame.name = baseName + (suffix + i);
    node = Utils.findNodeFromNodePath(protoNodes[i].nodePath, topLevelFrame);
    protoFrames.push(new PrototypeFrame(node, topLevelFrame));
  }

  return protoFrames;
}

function assignFrameNeighors(protoFrames: Array<PrototypeFrame>, protoNodes: Array<PrototypeNode>) {
  for (let i in protoFrames) {
    let nodeNeighbors = protoNodes[i].neighbors;
    if (nodeNeighbors.left) protoFrames[i].neighbors.left = protoFrames[protoNodes.indexOf(nodeNeighbors.left)];
    if (nodeNeighbors.right) protoFrames[i].neighbors.right = protoFrames[protoNodes.indexOf(nodeNeighbors.right)];
    if (nodeNeighbors.top) protoFrames[i].neighbors.top = protoFrames[protoNodes.indexOf(nodeNeighbors.top)];
    if (nodeNeighbors.bottom) protoFrames[i].neighbors.bottom = protoFrames[protoNodes.indexOf(nodeNeighbors.bottom)];
  }
}

function layoutFrames(frames: Array<PrototypeFrame>) {
  // Since the first frame is the user's reference and already on the canvas, use it as the starting point
  let width = frames[0].topLevelFrame.width;
  let height = frames[0].topLevelFrame.height;
  let gap = Config.GAP;

  // Create a duplicate array to track what frames need to be laid out
  let framesToLayout: Array<PrototypeFrame> = frames.map(frame => frame);
  // Remove the first frame since it was already laid out on the canvas
  framesToLayout.splice(0, 1);

  // Use relative position of frames to arrange them on the canvas
  for (let frame of frames) {
    let neighbors = frame.neighbors;
    if (neighbors.left && framesToLayout.indexOf(neighbors.left) !== -1) {
      neighbors.left.moveTo(frame.topLevelFrame.x - width - gap, frame.topLevelFrame.y);
      framesToLayout.splice(framesToLayout.indexOf(neighbors.left), 1);
    }

    if (neighbors.right && framesToLayout.indexOf(neighbors.right) !== -1) {
      neighbors.right.moveTo(frame.topLevelFrame.x + width + gap, frame.topLevelFrame.y);
      framesToLayout.splice(framesToLayout.indexOf(neighbors.right), 1);
    }

    if (neighbors.top && framesToLayout.indexOf(neighbors.top) !== -1) {
      neighbors.top.moveTo(frame.topLevelFrame.x, frame.topLevelFrame.y - height - gap);
      framesToLayout.splice(framesToLayout.indexOf(neighbors.top), 1);
    }

    if (neighbors.bottom && framesToLayout.indexOf(neighbors.bottom) !== -1) {
      neighbors.bottom.moveTo(frame.topLevelFrame.x, frame.topLevelFrame.y + height + gap);
      framesToLayout.splice(framesToLayout.indexOf(neighbors.bottom), 1);
    }
  }
}

function swapVariants(protoFrames: Array<PrototypeFrame>, config: Config) {
  let property = config.swapVariant.property
  let toVariant = config.swapVariant.to
  for (let protoFrame of protoFrames) {
    if (Utils.hasVariantProperty(protoFrame.instance, property)) {
      Utils.setVariantProperty(protoFrame.instance, property, toVariant)
    }
  }
}

function createInteractions(protoFrames: Array<PrototypeFrame>, config: Config) {
  for (let protoFrame of protoFrames) {
    Utils.addInteractions(
      protoFrame.topLevelFrame,
      protoFrame.neighbors.left?.topLevelFrame,
      protoFrame.neighbors.right?.topLevelFrame,
      protoFrame.neighbors.top?.topLevelFrame,
      protoFrame.neighbors.bottom?.topLevelFrame,
      config
    )
  }
}

function addFlowStartingPoint(protoFrames: Array<PrototypeFrame>) {
  if(!Utils.hasStartingPoint(protoFrames[0].topLevelFrame)) {
    let numFlows = figma.currentPage.flowStartingPoints.length
    Utils.addFlowStartingPoint(protoFrames[0].topLevelFrame, 'Flow ' + (numFlows + 1));
  }
}