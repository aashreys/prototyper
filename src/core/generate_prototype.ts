import { emit } from "@create-figma-plugin/utilities";
import { Config } from "../config";
import { Constants } from "../constants";
import { FocusOverlay } from "../focus_overlay";
import { isVariantFocusMode, NavigationFocusConfig } from "../navigation_focus";
import { PrototypeFrame } from "../prototype_frame";
import { PrototypeNode } from "../prototype_node";
import { Stats } from "../stats";
import { SwapVariant } from "../swap_variant";
import { Utils } from "../utils";
import { NearestNeighbor } from "./nearest_neighbor";
import { DEFAULT_PROTOTYPE_ALGORITHM, PrototypeAlgorithm } from "../prototype_algorithm";
import { DebugReport } from "../debug_report";

export async function doGeneratePrototype(config: Config, algorithm: PrototypeAlgorithm = DEFAULT_PROTOTYPE_ALGORITHM) {
  figma.commitUndo() // Undo entire prototype to avoid overloading user's undo stack
  let focus = config.focus
  let focusTargets: Array<SceneNode> = filterFocusTargetsFromSelection(figma.currentPage.selection, focus)

  // Validate focus targets
  if (isVariantFocusMode(focus)) {
    validateInstancesLength(focusTargets as Array<InstanceNode>)
    validateInstancesInSameTopLevelFrame(focusTargets)
    await validateInstanceProperties(focusTargets as Array<InstanceNode>, focus.variant)
  } else {
    validateFocusTargetsAreNotTopLevelFrames(focusTargets)
    validateFocusTargetsLength(focusTargets)
    validateFocusTargetsInSameTopLevelFrame(focusTargets)
  }

  // Sanitize focus targets
  removeFlowStaringPoints(focusTargets)
  resetFocus(focusTargets, config)

  let topLevelFrame: FrameNode = Utils.findTopLevelFrame(focusTargets[0])
  let parent = topLevelFrame.parent as PageNode | SectionNode // either a Page or Section

  let isLinked: boolean = topLevelFrame.reactions.length > 0
  
  let protoNodes: Array<PrototypeNode> = focusTargets.map(node => PrototypeNode.fromSceneNode(node));
  assignNodeNeighbors(protoNodes, algorithm);
  protoNodes = orderProtoNodesFromStart(protoNodes, NearestNeighbor.findStart(protoNodes))

  let protoFrames = createProtoFrames(protoNodes, parent);
  assignFrameNeighors(protoFrames, protoNodes);
  positionFrames(protoFrames);
  let statesChanged = setFocus(protoFrames, config);
  saveGenerateDebugReport(algorithm, focus, protoNodes, protoFrames, isLinked);
  let interactionsCreated = await createInteractions(protoFrames, config);
  DebugReport.update({
    phase: 'complete',
    interactionsCreated: interactionsCreated,
    framesDuplicated: protoFrames.length - 1,
    frames: getPrototypeFrameDebug(protoFrames)
  })

  if (!isLinked) addFlowStartingPoint(protoFrames);

  let framesDuped = protoFrames.length - 1

  Stats.addStats(1, framesDuped, statesChanged, interactionsCreated).then(
    (stats) => emit(Constants.EVENT_RECEIVE_STATS, stats)
  )
}

export function filterInstancesFromSelection(selection: ReadonlyArray<SceneNode>): Array<InstanceNode> {
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

export function filterFocusTargetsFromSelection(selection: ReadonlyArray<SceneNode>, focus: NavigationFocusConfig): Array<SceneNode> {
  if (isVariantFocusMode(focus)) return filterInstancesFromSelection(selection)

  if (selection.length > 1) {
    return selection.slice()
  }

  if (selection.length === 1) {
    if (Utils.isTopLevelFrame(selection[0])) return selection.slice()
    if (Utils.hasChildren(selection[0]) && (selection[0] as any).children.length > 1) {
      return (selection[0] as any).children.slice()
    }
    return selection.slice()
  }

  return []
}

export function validateInstancesLength(instances: Array<InstanceNode>) {
  if (instances.length < 2) {
    console.error('Invalid generate selection', {
      selectedNodes: figma.currentPage.selection.length,
      resolvedInstances: instances.length
    })
    throw new Error('Please select 2 or more component instances and try again.')
  }
}

export function validateFocusTargetsLength(focusTargets: Array<SceneNode>) {
  if (focusTargets.length < 2) {
    console.error('Invalid generate selection', {
      selectedNodes: figma.currentPage.selection.length,
      resolvedFocusTargets: focusTargets.length
    })
    throw new Error('Please select 2 or more layers and try again.')
  }
}

export function validateFocusTargetsAreNotTopLevelFrames(focusTargets: Array<SceneNode>) {
  const topLevelTargets = focusTargets.filter(node => Utils.isTopLevelFrame(node))
  if (topLevelTargets.length > 0) {
    console.error('Invalid generate selection', {
      selectedNodes: figma.currentPage.selection.length,
      topLevelTargets: topLevelTargets.length
    })
    throw new Error('Please select layers inside one top-level frame and try again.')
  }
}

export function validateInstancesInSameTopLevelFrame(instances: Array<SceneNode>) {
  validateFocusTargetsShareTopLevelFrame(
    instances,
    'resolvedInstances',
    'Please select component instances from one top-level frame and try again.'
  )
}

export function validateFocusTargetsInSameTopLevelFrame(focusTargets: Array<SceneNode>) {
  validateFocusTargetsShareTopLevelFrame(
    focusTargets,
    'resolvedFocusTargets',
    'Please select layers inside one top-level frame and try again.'
  )
}

function validateFocusTargetsShareTopLevelFrame(
  focusTargets: Array<SceneNode>,
  countLabel: string,
  message: string
) {
  let topLevelFrame = Utils.findTopLevelFrame(focusTargets[0])
  let invalidTargets = focusTargets.filter(focusTarget => {
    let targetTopLevelFrame = Utils.findTopLevelFrame(focusTarget)
    return !Utils.isTopLevelFrame(targetTopLevelFrame) || targetTopLevelFrame.id !== topLevelFrame.id
  })

  if (!Utils.isTopLevelFrame(topLevelFrame) || invalidTargets.length > 0) {
    console.error('Invalid generate selection', {
      selectedNodes: figma.currentPage.selection.length,
      [countLabel]: focusTargets.length,
      topLevelFrames: getUniqueTopLevelFrameIds(focusTargets).length
    })
    throw new Error(message)
  }
}

function getUniqueTopLevelFrameIds(instances: Array<SceneNode>): Array<string> {
  let topLevelFrameIds = []
  for (let instance of instances) {
    let topLevelFrameId = Utils.findTopLevelFrame(instance).id
    if (topLevelFrameIds.indexOf(topLevelFrameId) === -1) topLevelFrameIds.push(topLevelFrameId)
  }
  return topLevelFrameIds
}

export async function validateInstanceProperties(instances: Array<InstanceNode>, swapVariant: SwapVariant) {
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

function removeFlowStaringPoints(focusTargets: Array<SceneNode>) {
  let topLevelFrame = Utils.findTopLevelFrame(focusTargets[0]);
  Utils.removeFlowStartingPoint(topLevelFrame);
}

function resetFocus(focusTargets: Array<SceneNode>, config: Config) {
  if (!isVariantFocusMode(config.focus)) {
    FocusOverlay.resetManagedFocus(Utils.findTopLevelFrame(focusTargets[0]))
    return
  }
  resetInstanceFocus(focusTargets as Array<InstanceNode>, config)
}

function resetInstanceFocus(instances: Array<InstanceNode>, config: Config) {
  // If variant from value is defined, reset all variants to their from value
  let fromVariant = config.focus.variant.from
  let property = config.focus.variant.property
  if (fromVariant.length > 0) {
    for (let instance of instances) {
      Utils.setComponentProperty(instance, property, fromVariant);
    }
  }
}

function assignNodeNeighbors(protoNodes: Array<PrototypeNode>, algorithm: PrototypeAlgorithm) {
  NearestNeighbor.assignNeigbors(protoNodes, algorithm);
}

function orderProtoNodesFromStart(protoNodes: Array<PrototypeNode>, startNode: PrototypeNode): Array<PrototypeNode> {
  return [
    startNode,
    ...protoNodes.filter(node => node !== startNode)
  ]
}

function createProtoFrames(protoNodes: Array<PrototypeNode>, page: PageNode | SectionNode): Array<PrototypeFrame> {
  let protoFrames = new Array();
  let node = protoNodes[0].instance;
  const sourceTopLevelFrame = Utils.findTopLevelFrame(node);
  let topLevelFrame = sourceTopLevelFrame;

  protoFrames.push(new PrototypeFrame(node, topLevelFrame));

  let numberAtEndRegex: RegExp = /\d+$/; // https://stackoverflow.com/questions/6340180/regex-to-get-the-number-from-the-end-of-a-string
  if (!topLevelFrame.name.match(numberAtEndRegex)) topLevelFrame.name = topLevelFrame.name + " 1";
  let suffix: any = topLevelFrame.name.match(numberAtEndRegex)[0]
  let baseName = topLevelFrame.name.substring(0, topLevelFrame.name.lastIndexOf(suffix))
  suffix = Number(suffix)

  for (let i = 1; i < protoNodes.length; i++) {
    topLevelFrame = sourceTopLevelFrame.clone();
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

  let framesToLayout: Array<PrototypeFrame> = frames.filter(frame => frame !== frames[0]);
  let framesToVisit: Array<PrototypeFrame> = [frames[0]];

  while (framesToVisit.length > 0) {
    let frame = framesToVisit.shift()
    let neighbors = frame.neighbors;
    if (neighbors.left && framesToLayout.indexOf(neighbors.left) !== -1) {
      neighbors.left.moveTo(frame.topLevelFrame.x - width - gap, frame.topLevelFrame.y);
      framesToLayout.splice(framesToLayout.indexOf(neighbors.left), 1);
      framesToVisit.push(neighbors.left)
    }

    if (neighbors.right && framesToLayout.indexOf(neighbors.right) !== -1) {
      neighbors.right.moveTo(frame.topLevelFrame.x + width + gap, frame.topLevelFrame.y);
      framesToLayout.splice(framesToLayout.indexOf(neighbors.right), 1);
      framesToVisit.push(neighbors.right)
    }

    if (neighbors.top && framesToLayout.indexOf(neighbors.top) !== -1) {
      neighbors.top.moveTo(frame.topLevelFrame.x, frame.topLevelFrame.y - height - gap);
      framesToLayout.splice(framesToLayout.indexOf(neighbors.top), 1);
      framesToVisit.push(neighbors.top)
    }

    if (neighbors.bottom && framesToLayout.indexOf(neighbors.bottom) !== -1) {
      neighbors.bottom.moveTo(frame.topLevelFrame.x, frame.topLevelFrame.y + height + gap);
      framesToLayout.splice(framesToLayout.indexOf(neighbors.bottom), 1);
      framesToVisit.push(neighbors.bottom)
    }
  }

  if (framesToLayout.length > 0) {
    console.warn('Prototype layout contains disconnected frames', {
      disconnectedFrames: framesToLayout.length
    })
  }
}

function setFocus(protoFrames: Array<PrototypeFrame>, config: Config): number {
  if (!isVariantFocusMode(config.focus)) return setOverlayFocus(protoFrames, config.focus)
  return setInstanceFocus(protoFrames, config)
}

function setInstanceFocus(protoFrames: Array<PrototypeFrame>, config: Config): number {
  let property = config.focus.variant.property
  let toVariant = config.focus.variant.to
  let numStatesChanged = 0
  for (let protoFrame of protoFrames) {
    Utils.setComponentProperty(protoFrame.instance as InstanceNode, property, toVariant)
    numStatesChanged++
  }
  return numStatesChanged
}

function setOverlayFocus(protoFrames: Array<PrototypeFrame>, focus: NavigationFocusConfig): number {
  let numStatesChanged = 0
  for (let protoFrame of protoFrames) {
    FocusOverlay.resetManagedFocus(protoFrame.topLevelFrame)
    FocusOverlay.create(protoFrame.topLevelFrame, protoFrame.instance, focus)
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

function saveGenerateDebugReport(
  algorithm: PrototypeAlgorithm,
  focus: NavigationFocusConfig,
  protoNodes: Array<PrototypeNode>,
  protoFrames: Array<PrototypeFrame>,
  isLinked: boolean
) {
  DebugReport.start({
    mode: 'GENERATE',
    phase: 'before-reactions',
    algorithm: algorithm,
    focusMode: focus.mode,
    topLevelFrame: DebugReport.getNodeRef(protoFrames[0].topLevelFrame),
    wasLinkedBeforeRun: isLinked,
    selection: figma.currentPage.selection.map(node => DebugReport.getNodeRef(node)),
    startNode: getPrototypeNodeRef(protoNodes[0]),
    nodes: protoNodes.map(node => getPrototypeNodeDebug(node)),
    frames: getPrototypeFrameDebug(protoFrames)
  })
}

function getPrototypeNodeDebug(node: PrototypeNode): Record<string, any> {
  return {
    ...getPrototypeNodeRef(node),
    nodePath: node.nodePath,
    bounds: DebugReport.getNavigableBounds(node),
    neighbors: DebugReport.getNeighborRefs(node.neighbors, neighbor => getPrototypeNodeRef(neighbor))
  }
}

function getPrototypeNodeRef(node: PrototypeNode): Record<string, any> {
  return {
    id: node.id(),
    name: node.instance.name,
    type: node.instance.type
  }
}

function getPrototypeFrameDebug(protoFrames: Array<PrototypeFrame>): Array<Record<string, any>> {
  return protoFrames.map(protoFrame => ({
    frame: DebugReport.getNodeRef(protoFrame.topLevelFrame),
    frameBounds: {
      x: protoFrame.topLevelFrame.x,
      y: protoFrame.topLevelFrame.y,
      width: protoFrame.topLevelFrame.width,
      height: protoFrame.topLevelFrame.height
    },
    instance: DebugReport.getNodeRef(protoFrame.instance),
    neighbors: DebugReport.getNeighborRefs(protoFrame.neighbors, neighbor => DebugReport.getNodeRef(neighbor.topLevelFrame))
  }))
}
