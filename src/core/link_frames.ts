import { Config } from "../config";
import { Constants } from "../constants";
import { Utils } from "../utils";
import { Navigable, NearestNeighbor, Neighbors } from "./nearest_neighbor";

export function doLinkFrames(config: Config) {
  let selection = figma.currentPage.selection
  validateSelection(selection)
  let linkableFrames = selection.map(frame => new LinkableFrame(frame))
  sortFrames(linkableFrames)
  assignNeighbors(linkableFrames)
  createInteractions(linkableFrames, config)
  postProcessFrames(linkableFrames)
}

function validateSelection(selection: readonly SceneNode[]) {
  validateSelectionLength(selection)
  validateTopLevelFrames(selection)  
}

function validateSelectionLength(selection: readonly SceneNode[]) {
  if (selection.length < 2) {
    throw new Error('Please select 2 or more top-level frames and try again.')
  }
}

function validateTopLevelFrames(selection: readonly SceneNode[]) {
  for (let node of selection) {
    if(!Utils.isTopLevelFrame(node)) {
      throw new Error(`Layer "${node.name}" is not a top-level frame. Please only select top-level frames and try again.`)
    }
  }
}

function sortFrames(linkableFrames: Array<LinkableFrame>) {
  linkableFrames.sort(function (frame1, frame2) {
    let result = 0;
    let f1 = frame1.frame
    let f2 = frame2.frame
    if (f1.y < f2.y) {
      result = -1
    }
    else if (f1.y === f2.y) {
      if (f1.x < f2.x) {
        result = -1
      } else if (f1.x === f2.x) {
        result = 0
      } else {
        result = 1
      }
    } else {
      result = 1
    }
    return result
  });
}

class LinkableFrame implements Navigable {

  readonly frame: FrameNode

  neighbors: Neighbors<LinkableFrame>

  constructor(frame) {
    this.frame = frame;
  }

  getX(): number {
    return Utils.getAbsoluteX(this.frame)
  }

  getY(): number {
    return Utils.getAbsoluteY(this.frame)
  }

  getWidth(): number {
    return this.frame.width
  }

  getHeight(): number {
    return this.frame.height
  }

  setNeighbors(neighbors: Neighbors<any>) {
    this.neighbors = neighbors
  }
  
}

function assignNeighbors(linkableFrames: LinkableFrame[]) {
  NearestNeighbor.assignNeigbors(linkableFrames)
}

function createInteractions(linkableFrames: Array<LinkableFrame>, config: Config) {
  for (let linkableFrame of linkableFrames) {
    Utils.addInteractions(
      linkableFrame.frame,
      linkableFrame.neighbors.left?.frame,
      linkableFrame.neighbors.right?.frame,
      linkableFrame.neighbors.top?.frame,
      linkableFrame.neighbors.bottom?.frame,
      config
    )
  }
}

function postProcessFrames(linkableFrames: Array<LinkableFrame>) {
  if(!Utils.hasStartingPoint(linkableFrames[0].frame)) {
    Utils.addFlowStartingPoint(linkableFrames[0].frame, Constants.STARTING_POINT_NAME);
  }
}