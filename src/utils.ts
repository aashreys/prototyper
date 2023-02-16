import { Animation, AnimationDirection, AnimationType } from "./animation";
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
    return this.isFrame(node) && this.isSectionOrPage(node.parent);
  }

  static isGroup(node): boolean {
    return node && node.type === 'GROUP';
  }

  static isPage(node): boolean {
    return node && node.type === 'PAGE';
  }

  static isSection(node): boolean {
    return node && node.type === 'SECTION'
  }

  static isSectionOrPage(node): boolean {
    return this.isSection(node) || this.isPage(node)
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

  static hasComponentPropertyErrors(instance) {
    try {
      instance.componentProperties
      return false
    } 
    catch (e) {
      console.error(e)
      return true
    }
  }

  static canAcceptComponentPropertyValue(instance: InstanceNode, propertyName: string, value: string) {
    let property = this.getMatchingComponentPropertyNames(instance, propertyName)[0]
    let parent: ComponentNode | ComponentSetNode = Utils.isComponentSet(instance.mainComponent.parent) ? instance.mainComponent.parent as ComponentSetNode : instance.mainComponent
    if (parent.componentPropertyDefinitions[property].type === 'VARIANT') {
      return parent.componentPropertyDefinitions[property].variantOptions.includes(value.toString())
    }
    else if (parent.componentPropertyDefinitions[property].type === 'BOOLEAN') {
      value = value.toLowerCase()
      return value === 'true' || value === 'false'
    }
    else {
      return true
    }
  }

  static findTopLevelFrame(node: SceneNode): FrameNode {
    let currentNode = node;
    let topLevelFrame;
    if (!Utils.isSectionOrPage(currentNode.parent)) {
      while (!Utils.isSectionOrPage(currentNode.parent)) {
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
    if (!Utils.isSectionOrPage(currentNode.parent)) {
      while (!Utils.isSectionOrPage(currentNode.parent)) {
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

  static getMatchingComponentPropertyNames(node: InstanceNode, propertyName: string): string[] {
    let matchingNames = []
    let propertyNames = Object.keys(node.componentProperties)
    for (let i in propertyNames) {
      let name = propertyNames[i]
      if (name.lastIndexOf('#') > -1) name = name.substring(0, name.lastIndexOf('#'))
      if (name === propertyName) matchingNames.push(propertyNames[i])
    }
    return matchingNames
  }

  static setComponentProperty(
    node: InstanceNode, 
    propertyName: string, 
    value: string) 
  {
    let property = this.getMatchingComponentPropertyNames(node, propertyName)[0]
    if (node.componentProperties[property].type === 'BOOLEAN') {
      value = value.toLowerCase()
      if (value === 'true') node.setProperties({ [property]: true })
      if (value === 'false') node.setProperties({ [property]: false })
    } else {
      node.setProperties({ [property]: value })
    }
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
    let animation: Animation = config.animation
    let keycodes = NavigationKeycodes.fromConfig(config);
    
    let isAutoDirection = animation.isAutoDirection
    let autoDirectionAnimations = Utils.createAutoDirectionAnimation(animation)

    let reactions: Array<Reaction> = Utils.clone(frame.reactions);
    if (left && keycodes.left.length > 0) {
      reactions.push(Utils.createReaction(
        left,
        device,
        isAutoDirection ? autoDirectionAnimations.left : animation,
        keycodes.left
      ))
    }
    
    if (right && keycodes.right.length > 0) {
      reactions.push(Utils.createReaction(
        right,
        device,
        isAutoDirection ? autoDirectionAnimations.right : animation,
        keycodes.right
      ))
    }

    if (top && keycodes.up.length > 0) {
      reactions.push(Utils.createReaction(
        top,
        device,
        isAutoDirection ? autoDirectionAnimations.top : animation,
        keycodes.up
      ))
    }

    if (bottom && keycodes.down.length > 0) {
      reactions.push(Utils.createReaction(
        bottom,
        device,
        isAutoDirection ? autoDirectionAnimations.bottom : animation,
        keycodes.down
      ))
    }

    frame.reactions = reactions;
  }

  private static createAutoDirectionAnimation(animation: Animation) {
    let leftType, rightType, topType, bottomType: AnimationType

    if (animation.type === AnimationType.MOVE_IN) {
      rightType = bottomType = AnimationType.MOVE_IN
      leftType = topType = AnimationType.MOVE_OUT
    } 
    else if (animation.type === AnimationType.MOVE_OUT) {
      rightType = bottomType = AnimationType.MOVE_OUT
      leftType = topType = AnimationType.MOVE_IN
    }
    else if (animation.type === AnimationType.SLIDE_IN) {
      rightType = bottomType = AnimationType.SLIDE_IN
      leftType = topType = AnimationType.SLIDE_OUT
    }
    else if (animation.type === AnimationType.SLIDE_OUT) {
      rightType = bottomType = AnimationType.SLIDE_OUT
      leftType = topType = AnimationType.SLIDE_IN
    }
    else {
      leftType = rightType = topType = bottomType = animation.type
    }
    
    let leftAnim: Animation = {
      type: leftType,
      isAutoDirection: true,
      direction: AnimationDirection.RIGHT,
      isMatchLayers: animation.isMatchLayers,
      easing: animation.easing,
      duration: animation.duration
    }

    let rightAnim: Animation = {
      type: rightType,
      isAutoDirection: true,
      direction: AnimationDirection.LEFT,
      isMatchLayers: animation.isMatchLayers,
      easing: animation.easing,
      duration: animation.duration
    }

    let topAnim: Animation = {
      type: topType,
      isAutoDirection: true,
      direction: AnimationDirection.BOTTOM,
      isMatchLayers: animation.isMatchLayers,
      easing: animation.easing,
      duration: animation.duration
    }

    let bottomAnim: Animation = {
      type: bottomType,
      isAutoDirection: true,
      direction: AnimationDirection.TOP,
      isMatchLayers: animation.isMatchLayers,
      easing: animation.easing,
      duration: animation.duration
    }

    return {
      left: leftAnim,
      right: rightAnim,
      top: topAnim,
      bottom: bottomAnim
    }

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
    switch(animation.type) {
      case AnimationType.INSTANT: return null;
      case AnimationType.DISSOLVE: 
      case AnimationType.SMART_ANIMATE: return {
        type: animation.type,
        easing: { type: animation.easing },
        duration: animation.duration / 1000
      }
      case AnimationType.MOVE_IN:
      case AnimationType.MOVE_OUT:
      case AnimationType.PUSH:
      case AnimationType.SLIDE_IN:
      case AnimationType.SLIDE_OUT: return {
        type: animation.type,
        direction: animation.direction,
        matchLayers: animation.isMatchLayers,
        easing: { type: animation.easing },
        duration: animation.duration / 1000 
      }
    }
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

  static getOs(): OS {
    let platform = navigator.platform
    if (platform.indexOf('Mac') >= 0) return OS.MAC_OS
    else if (platform.indexOf('Win') >= 0) return OS.WINDOWS
    else return OS.OTHER
  }

  /*
  * Sorts cooridnates from left top to bottom right. For use in array.sort() style functions.
  */ 
  static sortCoordinates(x1, y1, x2, y2) {
    if (x1 - x2 !== 0) return x1 - x2
    else return y1 - y2
  }
 
}