export class Utils {

  static isInstance(node): boolean {
    return node && node.type === 'INSTANCE';
  }

  static isFrame(node): boolean {
    return node && node.type === 'FRAME';
  }

  static isTopLevelFrame(node) {
    return this.isFrame(node) && this.isPage(node.parent);
  }

  static isGroup(node): boolean {
    return node && node.type === 'GROUP';
  }

  static isPage(node): boolean {
    return node && node.type === 'PAGE';
  }

  static hasChildren(node): boolean {
    return node && 'children' in node;
  }

  static isComponent(node): boolean {
    return node && node.type === 'COMPONENT';
  }

  static isComponentSet(node): boolean {
    return node && node.type === 'COMPONENT_SET';
  }

  static hasReactions(frame): boolean {
    return frame.reactions && frame.reactions.length > 0;
  }

  static hasStartingPoint(node) {
    let startingPoints = (figma.currentPage as any).flowStartingPoints;
    for (let point of startingPoints) {
      if (point.nodeId === node.id) return true;
    }
    return false;
  }

  static clone(val): any {
    const type = typeof val
    if (val === null) {
      return null
    } else if (type === 'undefined' || type === 'number' ||
      type === 'string' || type === 'boolean') {
      return val
    } else if (type === 'object') {
      if (val instanceof Array) {
        return val.map(x => Utils.clone(x))
      } else if (val instanceof Uint8Array) {
        return new Uint8Array(val)
      } else {
        let o = {}
        for (const key in val) {
          o[key] = Utils.clone(val[key])
        }
        return o
      }
    }
    throw 'unknown'
  }

}