import { Navigable, Neighbors } from './core/nearest_neighbor';
import { Utils } from './utils'

export class PrototypeNode implements Navigable {
  readonly instance; InstanceNode
  readonly nodePath: Array<Number> // A map describing this nodes position in it's top-level frame

  readonly x;
  readonly y;
  readonly width;
  readonly height;

  neighbors: Neighbors<PrototypeNode>

  constructor(instance, x, y, width, height) {
    if (instance) {
      this.instance = instance;
      this.nodePath = Utils.buildNodePath(instance);
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    } else {
      throw new Error('Instance Node cannot be null');
    }
  }

  getX(): number {
    return this.x;
  }

  getY(): number {
    return this.y;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  setNeighbors(neighbors: Neighbors<PrototypeNode>) {
    this.neighbors = neighbors;
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