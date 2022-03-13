import { Animation } from "./animation";
import { AnimationType } from "./animation";
import { Config } from "./config";
import { Device } from "./device";
import { NavigationKeycodes } from "./navigation";

export enum OS {

  MAC_OS,
  WINDOWS,
  OTHER

}

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

  static hasVariantErrors(instance) {
    return typeof instance.variantProperties === 'string' && instance.variantProperties.indexOf('error') > -1
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

  static findTopLevelFrame(node: SceneNode): FrameNode {
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

  static getAbsoluteX(node: SceneNode) {
    return node.absoluteTransform[0][2]
  }

  static getAbsoluteY(node: SceneNode) {
    return node.absoluteTransform[1][2]
  }

  static addInteractions(frame: FrameNode, left: FrameNode, right: FrameNode, top: FrameNode, bottom: FrameNode, config: Config) 
  {
    let device = config.activeNavigation.device
    let animation = config. animation
    let keycodes = NavigationKeycodes.fromConfig(config);

    let reactions: Array<Reaction> = Utils.clone(frame.reactions);
    if (left && keycodes.left.length > 0) reactions.push(Utils.createReaction(left, device, animation, keycodes.left))
    if (right && keycodes.right.length > 0) reactions.push(Utils.createReaction(right, device, animation, keycodes.right))
    if (top && keycodes.up.length > 0) reactions.push(Utils.createReaction(top, device, animation, keycodes.up))
    if (bottom && keycodes.down.length > 0) reactions.push(Utils.createReaction(bottom, device, animation, keycodes.down))

    frame.reactions = reactions;
  }

  static createReaction(toFrame: FrameNode, device: Device, animation: Animation, keycode: Array<number>): Reaction {
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
        keyCodes: keycode,
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

  static isTopOf(x1, y1, x2, y2): boolean {
    return y2 < y1;
  }

  static isBottomOf(x1, y1, x2, y2): boolean {
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

  static getCtrlString() {

  }

  static getAltString() {

  }

  static getMetaString() {

  }

  static getShiftString() {

  }

  static getOs(): OS {
    let platform = navigator.platform
    if (platform.indexOf('Mac') > 0) return OS.MAC_OS
    else if (platform.indexOf('Win') > 0) return OS.WINDOWS
    else return OS.OTHER
  }

}