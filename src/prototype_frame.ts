import { Neighbors } from "./core/nearest_neighbor"

export class PrototypeFrame {
  readonly instance: InstanceNode
  readonly topLevelFrame: FrameNode

  neighbors: Neighbors<PrototypeFrame> = {
    left: undefined,
    right: undefined,
    top: undefined,
    bottom: undefined
  }

  constructor(instance, topLevelFrame) {
    this.instance = instance;
    this.topLevelFrame = topLevelFrame;
  }

  moveTo(x, y) {
    this.topLevelFrame.x = x;
    this.topLevelFrame.y = y;
  }

}