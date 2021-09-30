export class PrototypeFrame {
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