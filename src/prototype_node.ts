import { Utils } from './utils'

export class PrototypeNode {
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
    if (!Utils.isPage(currentNode.parent)) {
      while (!Utils.isPage(currentNode.parent)) {
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