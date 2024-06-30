import { emit } from "@create-figma-plugin/utilities";
import { Config } from "../config";
import { Constants } from "../constants";
import { PrototypeFrame } from "../prototype_frame";
import { PrototypeNode } from "../prototype_node";
import { Stats } from "../stats";
import { SwapVariant } from "../swap_variant";
import { Utils } from "../utils";
import { NearestNeighbor } from "./nearest_neighbor";

export async function doGeneratePrototype(config: Config) {
  figma.commitUndo() // Undo entire prototype to avoid overloading user's undo stack
  let instances: Array<InstanceNode> = filterInstancesFromSelection(figma.currentPage.selection)

  // Validate instances
  validateInstancesLength(instances)
  await validateInstanceProperties(instances, config.swapVariant)

  // Sanitize instances
  removeFlowStaringPoints(instances)
  resetInstanceFocus(instances, config)

  let topLevelFrame: FrameNode = Utils.findTopLevelFrame(instances[0])
  let parent = topLevelFrame.parent as PageNode | SectionNode // either a Page or Section

  let isLinked: boolean = topLevelFrame.reactions.length > 0
  
  let protoNodes: Array<PrototypeNode> = instances.map(node => PrototypeNode.fromInstance(node));
  sortProtoNodes(protoNodes);
  assignNodeNeighbors(protoNodes);

  let protoFrames = createProtoFrames(protoNodes, parent);
  assignFrameNeighors(protoFrames, protoNodes);
  positionFrames(protoFrames);
  let statesChanged = setInstanceFocus(protoFrames, config);
  let interactionsCreated = await createInteractions(protoFrames, config);

  if (!isLinked) addFlowStartingPoint(protoFrames);

  let framesDuped = protoFrames.length - 1

  Stats.addStats(1, framesDuped, statesChanged, interactionsCreated).then(
    (stats) => emit(Constants.EVENT_RECEIVE_STATS, stats)
  )
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

function validateInstancesLength(instances: Array<InstanceNode>) {
  if (instances.length < 2) {
    throw new Error('Please select 2 or more component instances and try again.')
  }
}

async function validateInstanceProperties(instances: Array<InstanceNode>, swapVariant: SwapVariant) {
  let property = swapVariant.property;
  let from = swapVariant.from;
  let to = swapVariant.to;
  for (let instance of instances) {

    /* Check for general component property errors */
    if (Utils.hasComponentPropertyErrors(instance)) {
      throw new Error(`Found errors in the component set for layer "${instance.name}". Please resolve the errors and try again.`)
    }

    /* Check if a unique component property exists on this instance */
    let properties = Utils.getMatchingComponentPropertyNames(instance, property)
    if (properties.length === 0) {
      throw new Error(`Cannot find component property "${property}" on layer "${instance.name}". Please type it exactly as it appears in the Properties Panel.`);
    }
    else if (properties.length > 1) {
      throw new Error(`Found ${properties.length} component properties with the name "${property}" on layer "${instance.name}". Please rename them to be unique.`);
    }

    /* Check if the component property type is supported */
    let propertyType = instance.componentProperties[properties[0]].type
    if (propertyType !== 'BOOLEAN' && propertyType !== 'TEXT' && propertyType !== 'VARIANT') {
      throw new Error(`Cannot set focus on an ${propertyType} property like "${property}". Please select a different property.`);
    }
    
    /* Check if the unique component property can accept the values supplied by the user */
    if (from.length > 0 && !await Utils.canAcceptComponentPropertyValue(instance, property, from)) {
      throw new Error(`Cannot find value "${from}" for component property "${property}" on layer "${instance.name}". Please type it exactly as it appears in the Properties Panel.`);
    }
    if (!await Utils.canAcceptComponentPropertyValue(instance, property, to)) {
      throw new Error(`Cannot find value "${to}" for component property "${property}" on layer "${instance.name}". Please type it exactly as it appears in the Properties Panel.`);
    }

  }
}

function removeFlowStaringPoints(instances: Array<InstanceNode>) {
  let topLevelFrame = Utils.findTopLevelFrame(instances[0]);
  Utils.removeFlowStartingPoint(topLevelFrame);
}

function resetInstanceFocus(instances: Array<InstanceNode>, config: Config) {
  // If variant from value is defined, reset all variants to their from value
  let fromVariant = config.swapVariant.from
  let property = config.swapVariant.property
  if (fromVariant.length > 0) {
    for (let instance of instances) {
      Utils.setComponentProperty(instance, property, fromVariant);
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

function createProtoFrames(protoNodes: Array<PrototypeNode>, page: PageNode | SectionNode): Array<PrototypeFrame> {
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
    // TODO: DYNAMIC
    page.appendChild(topLevelFrame)
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

function positionFrames(frames: Array<PrototypeFrame>) {
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

function setInstanceFocus(protoFrames: Array<PrototypeFrame>, config: Config): number {
  let property = config.swapVariant.property
  let toVariant = config.swapVariant.to
  let numStatesChanged = 0
  for (let protoFrame of protoFrames) {
    Utils.setComponentProperty(protoFrame.instance, property, toVariant)
    numStatesChanged++
  }
  return numStatesChanged
}

async function createInteractions(protoFrames: Array<PrototypeFrame>, config: Config): Promise<number> {
  let totalInteractions = 0
  for (let protoFrame of protoFrames) {
    let interactions = await Utils.addInteractions(
      protoFrame.topLevelFrame,
      protoFrame.neighbors.left?.topLevelFrame,
      protoFrame.neighbors.right?.topLevelFrame,
      protoFrame.neighbors.top?.topLevelFrame,
      protoFrame.neighbors.bottom?.topLevelFrame,
      config
    )
    totalInteractions = totalInteractions + interactions
  }
  return totalInteractions
}

function addFlowStartingPoint(protoFrames: Array<PrototypeFrame>) {
  if(!Utils.hasStartingPoint(protoFrames[0].topLevelFrame)) {
    let numFlows = figma.currentPage.flowStartingPoints.length
    Utils.addFlowStartingPoint(protoFrames[0].topLevelFrame, 'Flow ' + (numFlows + 1));
  }
}