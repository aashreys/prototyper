import { emit } from "@create-figma-plugin/utilities";
import { Config } from "../config";
import { Constants } from "../constants";
import { FocusOverlay } from "../focus_overlay";
import {
  ComponentFocusMapping,
  getComponentFocusMappings,
  isVariantFocusMode,
  NavigationFocusConfig
} from "../navigation_focus";
import { PrototypeFrame } from "../prototype_frame";
import { PrototypeNode } from "../prototype_node";
import { Stats } from "../stats";
import { Utils } from "../utils";
import { NearestNeighbor } from "./nearest_neighbor";
import { DebugReport } from "../debug_report";

export async function doGeneratePrototype(config: Config) {
  figma.commitUndo() // Undo entire prototype to avoid overloading user's undo stack
  let focus = config.focus
  let focusTargets: Array<SceneNode> = filterFocusTargetsFromSelection(figma.currentPage.selection, focus)

  // Validate focus targets
  if (isVariantFocusMode(focus)) {
    validateInstancesLength(focusTargets as Array<InstanceNode>)
    validateInstancesInSameTopLevelFrame(focusTargets)
    await validateInstanceProperties(focusTargets as Array<InstanceNode>, getComponentFocusMappings(focus))
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
  assignNodeNeighbors(protoNodes);
  protoNodes = orderProtoNodesFromStart(protoNodes, NearestNeighbor.findStart(protoNodes))

  let protoFrames = createProtoFrames(protoNodes, parent);
  assignFrameNeighors(protoFrames, protoNodes);
  positionFrames(protoFrames);
  let statesChanged = setFocus(protoFrames, config);
  saveGenerateDebugReport(focus, protoNodes, protoFrames, isLinked);
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

export async function validateInstanceProperties(instances: Array<InstanceNode>, mappings: Array<ComponentFocusMapping>) {
  validateComponentFocusMappings(mappings)
  for (let instance of instances) {

    /* Check for general component property errors */
    if (Utils.hasComponentPropertyErrors(instance)) {
      throw new Error(`Found errors in the component set for layer "${instance.name}". Please resolve the errors and try again.`)
    }

    let matchedMappings = 0
    for (let mapping of mappings) {
      let properties = Utils.getMatchingComponentPropertyNames(instance, mapping.property)
      if (properties.length === 0) continue
      if (properties.length > 1) {
        throw new Error(`Found ${properties.length} component properties with the name "${mapping.property}" on layer "${instance.name}". Please rename them to be unique.`);
      }

      let propertyType = instance.componentProperties[properties[0]].type
      let expectedType = mapping.type === 'boolean' ? 'BOOLEAN' : 'VARIANT'
      if (propertyType !== expectedType) {
        throw new Error(`Cannot set ${mapping.type} focus on a ${propertyType} property like "${mapping.property}". Please select a different property.`);
      }

      if (mapping.type === 'variant') {
        if (mapping.from.length > 0 && !await Utils.canAcceptComponentPropertyValue(instance, mapping.property, mapping.from)) {
          throw new Error(`Cannot find value "${mapping.from}" for component property "${mapping.property}" on layer "${instance.name}". Please type it exactly as it appears in the Properties Panel.`);
        }
        if (!await Utils.canAcceptComponentPropertyValue(instance, mapping.property, mapping.to)) {
          throw new Error(`Cannot find value "${mapping.to}" for component property "${mapping.property}" on layer "${instance.name}". Please type it exactly as it appears in the Properties Panel.`);
        }
      }
      matchedMappings++
    }

    if (matchedMappings === 0) {
      throw new Error(`Cannot find specified component properties on layer "${instance.name}". Please add a matching property for this component.`);
    }

  }
}

function validateComponentFocusMappings(mappings: Array<ComponentFocusMapping>) {
  if (!Array.isArray(mappings) || mappings.length === 0) {
    throw new Error('Please add at least one component property for Components focus.')
  }
  for (let mapping of mappings) {
    if (!mapping.property || mapping.property.length === 0) {
      throw new Error('Please add a component property name for each Components focus row.')
    }
    if (mapping.type !== 'variant' && mapping.type !== 'boolean') {
      throw new Error('Components focus only supports Variant and Boolean properties.')
    }
    if (mapping.type === 'variant' && (!mapping.from || mapping.from.length === 0 || !mapping.to || mapping.to.length === 0)) {
      throw new Error('Please add default and focused values for each Variant focus row.')
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

export function resetInstanceFocus(instances: Array<InstanceNode>, config: Config) {
  let mappings = getComponentFocusMappings(config.focus)
  for (let instance of instances) {
    for (let mapping of mappings) {
      if (!hasComponentFocusMapping(instance, mapping)) continue
      Utils.setComponentProperty(instance, mapping.property, mapping.from);
    }
  }
}

function assignNodeNeighbors(protoNodes: Array<PrototypeNode>) {
  NearestNeighbor.assignNeigbors(protoNodes);
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

export function setInstanceFocus(protoFrames: Array<PrototypeFrame>, config: Config): number {
  let mappings = getComponentFocusMappings(config.focus)
  let numStatesChanged = 0
  for (let protoFrame of protoFrames) {
    for (let mapping of mappings) {
      if (!hasComponentFocusMapping(protoFrame.instance as InstanceNode, mapping)) continue
      Utils.setComponentProperty(protoFrame.instance as InstanceNode, mapping.property, mapping.to)
      numStatesChanged++
    }
  }
  return numStatesChanged
}

function hasComponentFocusMapping(instance: InstanceNode, mapping: ComponentFocusMapping): boolean {
  const properties = Utils.getMatchingComponentPropertyNames(instance, mapping.property)
  if (properties.length !== 1) return false
  const expectedType = mapping.type === 'boolean' ? 'BOOLEAN' : 'VARIANT'
  return instance.componentProperties[properties[0]].type === expectedType
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
  focus: NavigationFocusConfig,
  protoNodes: Array<PrototypeNode>,
  protoFrames: Array<PrototypeFrame>,
  isLinked: boolean
) {
  DebugReport.start({
    mode: 'GENERATE',
    phase: 'before-reactions',
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
