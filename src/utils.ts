import { Animation } from "./animation";
import { AnimationType } from "./animation";
import { Config } from "./config";
import { Device } from "./device";
import { NavScheme } from "./navigation";

export class Utils {

  static isInstance(node): boolean {
    return node && node.type === 'INSTANCE';
  }

  static isFrame(node): boolean {
    return node && node.type === 'FRAME';
  }

  static isFrameOrGroup(node): boolean {
    return Utils.isFrame(node) || Utils.isGroup(node);
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

  static hasVariantProperty(instance, property) {
    let properties = instance.variantProperties;
    return properties !== null && property in properties;
  }

  static hasVariantValue(instance, property, value) {
    if (Utils.isComponent(instance.mainComponent) && Utils.isComponentSet(instance.mainComponent.parent)) {
      let componentSet = instance.mainComponent.parent;
      return componentSet.variantGroupProperties[property].values.indexOf(value) >= 0;
    }
    else {
      return false;
    }
  }

  static findTopLevelFrame(node: SceneNode) {
    let currentNode = node;
    let topLevelFrame;
    if (!Utils.isPage(currentNode.parent)) {
      while (!Utils.isPage(currentNode.parent)) {
        topLevelFrame = currentNode.parent;
        currentNode = topLevelFrame;
      }
    } else {
      topLevelFrame = currentNode;
    }
    return topLevelFrame;
  }

  static buildNodePath(node) {
    let nodePath = new Array();
    let currentNode = node;
    if (!Utils.isPage(currentNode.parent)) {
      while (!Utils.isPage(currentNode.parent)) {
        nodePath.unshift(currentNode.parent.children.indexOf(currentNode));
        currentNode = currentNode.parent;
      }
    }
    return nodePath;
  }

  static findNodeFromNodePath(nodePath, topLevelFrame: FrameNode) {
    let node: any = topLevelFrame;
      for (let i in nodePath) {
        node = node.children[nodePath[i]];
      }
      return node;
  }

  static removeFlowStartingPoint(node: SceneNode) {
    let flows = Utils.clone((figma.currentPage as any).flowStartingPoints);
    for (let i in flows) {
      if (flows[i].nodeId === node.id) flows.splice(i, 1);
    }
    (figma.currentPage as any).flowStartingPoints = flows;
  }

  static addFlowStartingPoint(node: SceneNode, flowName: string) {
    let flows = Utils.clone((figma.currentPage as any).flowStartingPoints);
    flows.push(
      {
        nodeId: node.id,
        name: flowName
      }
    );
    (figma.currentPage as any).flowStartingPoints = flows;
  }

  static setVariantProperty(node, propertyName: string, propertyValue: string) {
    let variantProperties = node.variantProperties;
    variantProperties[propertyName] = propertyValue;
    node.setProperties(variantProperties);
  }

  static isUniDirectionalNav(config: Config) {
    let scheme = config.navigation.scheme
    return scheme === NavScheme.SHOULDER_BUTTONS || scheme === NavScheme.TRIGGER_BUTTONS
  }

  static getAbsoluteX(node: SceneNode) {
    return node.absoluteTransform[0][2]
  }

  static getAbsoluteY(node: SceneNode) {
    return node.absoluteTransform[1][2]
  }

  static addInteractions(frame: FrameNode, left: FrameNode, right: FrameNode, top: FrameNode, bottom: FrameNode, config: Config, ) 
  {
    let reactions: Array<Reaction> = Utils.clone(frame.reactions);
    if (left) reactions.push(Utils.createReaction(left, config.device, config.animation, config.navigation.left));
    if (right) reactions.push(Utils.createReaction(right, config.device, config.animation, config.navigation.right));
    if (top) reactions.push(Utils.createReaction(top, config.device, config.animation, config.navigation.up));
    if (bottom) reactions.push(Utils.createReaction(bottom, config.device, config.animation, config.navigation.down));
    frame.reactions = reactions;
  }

  static createReaction(toFrame: FrameNode, device: Device, animation: Animation, keycode: number): Reaction {
    let reaction: Reaction = {
      action: {
        type: "NODE",
        destinationId: toFrame.id,
        navigation: "NAVIGATE",
        transition: Utils.createTransition(animation),
        preserveScrollPosition: false,
      },
      trigger: {
        type: "ON_KEY_DOWN",
        device: device,
        keyCodes: [keycode],
      }
    };
    return reaction;
  }

  static createTransition(animation: Animation): Transition {
    let transition;
    if (animation.animType === AnimationType.INSTANT) {
      transition = null;
    } else {
      transition = {
        type: "SMART_ANIMATE",
        easing: { type: animation.animType },
        duration: animation.duration / 1000, // Figma expects duration in seconds but we store in milliseconds
      }
    }
    return transition;
  }

  static isAbove(x1, y1, x2, y2): boolean {
    return y2 < y1;
  }

  static isBelow(x1, y1, x2, y2): boolean {
    return y2 > y1;
  }

  static isLeftOf(x1, y1, x2, y2): boolean {
    return x2 < x1;
  }

  static isRightOf(x1, y1, x2, y2): boolean {
    return x2 > x1;
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