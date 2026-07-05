import { emit } from "@create-figma-plugin/utilities";
import { Config } from "../config";
import { Constants } from "../constants";
import { Stats } from "../stats";
import { Utils } from "../utils";
import { Navigable, NearestNeighbor, Neighbors } from "./nearest_neighbor";

export async function doLinkFrames(config: Config) {
  figma.commitUndo() // Undo entire prototype to avoid overloading user's undo stack
  let selection = figma.currentPage.selection
  validateSelection(selection)

  let linkableFrames = selection.map(frame => new LinkableFrame(frame))

  let isLinked = isLinkedToPrototype(linkableFrames)

  assignNeighbors(linkableFrames)
  linkableFrames = orderLinkableFramesFromStart(linkableFrames, NearestNeighbor.findStart(linkableFrames))
  let interactionsCreated = await createInteractions(linkableFrames, config)

  if (!isLinked) addStartingPoint(linkableFrames)
  
  Stats.addStats(1, 0, 0, interactionsCreated).then(
    (stats) => emit(Constants.EVENT_RECEIVE_STATS, stats)
  )
}

function isLinkedToPrototype(linkableFrames: LinkableFrame[]) {
  for (let linkableFrame of linkableFrames) {
    if (linkableFrame.frame.reactions.length > 0) return true
  } 
  return false;
}

export function validateSelection(selection: readonly SceneNode[]) {
  validateSelectionLength(selection)
  validateTopLevelFrames(selection)  
}

export function validateSelectionLength(selection: readonly SceneNode[]) {
  if (selection.length < 2) {
    throw new Error('Please select 2 or more top-level frames and try again.')
  }
}

export function validateTopLevelFrames(selection: readonly SceneNode[]) {
  for (let node of selection) {
    if(!Utils.isTopLevelFrame(node)) {
      throw new Error(`Layer "${node.name}" is not a top-level frame. Please only select top-level frames and try again.`)
    }
  }
}

export class LinkableFrame implements Navigable {

  readonly frame: FrameNode

  neighbors: Neighbors<LinkableFrame>

  constructor(frame) {
    this.frame = frame;
  }

  getX(): number {
    return Utils.getAbsoluteBounds(this.frame).x
  }

  getY(): number {
    return Utils.getAbsoluteBounds(this.frame).y
  }

  getWidth(): number {
    return Utils.getAbsoluteBounds(this.frame).width
  }

  getHeight(): number {
    return Utils.getAbsoluteBounds(this.frame).height
  }

  setNeighbors(neighbors: Neighbors<any>) {
    this.neighbors = neighbors
  }
  
}

function assignNeighbors(linkableFrames: LinkableFrame[]) {
  NearestNeighbor.assignNeigbors(linkableFrames)
}

function orderLinkableFramesFromStart(linkableFrames: Array<LinkableFrame>, startFrame: LinkableFrame): Array<LinkableFrame> {
  return [
    startFrame,
    ...linkableFrames.filter(frame => frame !== startFrame)
  ]
}

async function createInteractions(linkableFrames: Array<LinkableFrame>, config: Config): Promise<number> {
   let totalInteractions = 0
  for (let linkableFrame of linkableFrames) {
    let interactions = await Utils.addInteractions(
      linkableFrame.frame,
      linkableFrame.neighbors.left?.frame,
      linkableFrame.neighbors.right?.frame,
      linkableFrame.neighbors.top?.frame,
      linkableFrame.neighbors.bottom?.frame,
      config
    )
    totalInteractions = totalInteractions + interactions
  }
  return totalInteractions
}

function addStartingPoint(linkableFrames: Array<LinkableFrame>) {
  if(!Utils.hasStartingPoint(linkableFrames[0].frame)) {
    let numFlows = figma.currentPage.flowStartingPoints.length
    Utils.addFlowStartingPoint(linkableFrames[0].frame, 'Flow ' + (numFlows + 1));
  }
}
