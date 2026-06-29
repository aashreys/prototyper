import { Animation, AnimationDirection, AnimationEasing, AnimationType } from "./animation";
import { getTransitionDuration, getTransitionEasing } from "./custom_spring";
import { Config } from "./config";
import { DebugReport } from "./debug_report";
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

  static async canAcceptComponentPropertyValue(instance: InstanceNode, propertyName: string, value: string) {
    let property = this.getMatchingComponentPropertyNames(instance, propertyName)[0]
    if (!property) return false

    let tempMainComponent = await instance.getMainComponentAsync()

    let component: ComponentNode | ComponentSetNode = Utils.isComponentSet
      (tempMainComponent.parent) ? tempMainComponent.parent as ComponentSetNode : tempMainComponent
    const definition = component.componentPropertyDefinitions[property]
    if (!definition) {
      console.error('Missing component property definition', {
        layerName: instance.name,
        propertyName: propertyName
      })
      return false
    }

    if (definition.type === 'VARIANT') {
      return Array.isArray(definition.variantOptions) && definition.variantOptions.includes(value.toString())
    }
    else if (definition.type === 'BOOLEAN') {
      value = value.toLowerCase()
      return value === 'true' || value === 'false'
    }
    else {
      return false
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
    if (!property) {
      console.error('Cannot set missing component property', {
        layerName: node.name,
        propertyName: propertyName
      })
      return
    }
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

  static getAbsoluteBounds(node: SceneNode): Rect {
    const bounds = node.absoluteBoundingBox || (node as any).absoluteRenderBounds
    if (bounds) return bounds
    return {
      x: Utils.getAbsoluteX(node),
      y: Utils.getAbsoluteY(node),
      width: (node as any).width,
      height: (node as any).height
    }
  }

  static async addInteractions(frame: FrameNode, left: FrameNode, right: FrameNode, top: FrameNode, bottom: FrameNode, config: Config): Promise<number>
  {
    let numInteractionsAdded = 0
    let numDuplicateInteractionsSkipped = 0
    let numStaleInteractionsRemoved = 0
    let device = config.activeNavigation.device
    let animation: Animation = config.animation
    let keycodesList = NavigationKeycodes.fromConfig(config);
    
    let isAutoDirection = animation.isAutoDirection
    let autoDirectionAnimations = Utils.createAutoDirectionAnimation(animation)

    let reactions: Array<Reaction> = Utils.clone(frame.reactions);
    let intendedReactions: Array<Reaction> = []
    for (let keycodes of keycodesList) {
      if (left && keycodes.left.length > 0) {
        intendedReactions.push(Utils.createReaction(
          left,
          device,
          isAutoDirection ? autoDirectionAnimations.left : animation,
          keycodes.left
        ))
      }

      if (right && keycodes.right.length > 0) {
        intendedReactions.push(Utils.createReaction(
          right,
          device,
          isAutoDirection ? autoDirectionAnimations.right : animation,
          keycodes.right
        ))
      }

      if (top && keycodes.up.length > 0) {
        intendedReactions.push(Utils.createReaction(
          top,
          device,
          isAutoDirection ? autoDirectionAnimations.top : animation,
          keycodes.up
        ))
      }

      if (bottom && keycodes.down.length > 0) {
        intendedReactions.push(Utils.createReaction(
          bottom,
          device,
          isAutoDirection ? autoDirectionAnimations.bottom : animation,
          keycodes.down
        ))
      }
    }

    reactions = reactions.filter(reaction => {
      if (!Utils.isManagedKeyReaction(reaction, device, keycodesList)) return true
      if (intendedReactions.some(intendedReaction => Utils.getReactionSignature(intendedReaction) === Utils.getReactionSignature(reaction))) return true
      numStaleInteractionsRemoved++
      return false
    })

    for (let reaction of intendedReactions) {
        if (Utils.hasReaction(reactions, reaction)) {
          numDuplicateInteractionsSkipped++
        } else {
          reactions.push(reaction)
          numInteractionsAdded++
        }
    }

    if (numInteractionsAdded === 0 && numStaleInteractionsRemoved === 0) {
      DebugReport.addEvent(Utils.getReactionWriteDebugEvent(
        'unchanged',
        false,
        frame,
        left,
        right,
        top,
        bottom,
        device,
        keycodesList,
        intendedReactions,
        reactions,
        numInteractionsAdded,
        numStaleInteractionsRemoved,
        numDuplicateInteractionsSkipped
      ))
      if (numDuplicateInteractionsSkipped > 0) {
        console.log('Skipped duplicate prototype reactions', {
          frameId: frame.id,
          duplicateInteractionsSkipped: numDuplicateInteractionsSkipped
        })
      }
      return numInteractionsAdded
    }

    try {
      await frame.setReactionsAsync(reactions)
    } catch (e) {
      DebugReport.addEvent(Utils.getReactionWriteDebugEvent(
        'failed',
        false,
        frame,
        left,
        right,
        top,
        bottom,
        device,
        keycodesList,
        intendedReactions,
        reactions,
        numInteractionsAdded,
        numStaleInteractionsRemoved,
        numDuplicateInteractionsSkipped,
        e
      ))
      console.error('Failed to write prototype reactions', {
        frameId: frame.id,
        existingReactions: frame.reactions.length,
        nextReactions: reactions.length,
        interactionsAdded: numInteractionsAdded,
        staleInteractionsRemoved: numStaleInteractionsRemoved,
        duplicateInteractionsSkipped: numDuplicateInteractionsSkipped
      })
      console.error(e)
      throw e
    }
    DebugReport.addEvent(Utils.getReactionWriteDebugEvent(
      'written',
      true,
      frame,
      left,
      right,
      top,
      bottom,
      device,
      keycodesList,
      intendedReactions,
      reactions,
      numInteractionsAdded,
      numStaleInteractionsRemoved,
      numDuplicateInteractionsSkipped
    ))
    if (numDuplicateInteractionsSkipped > 0) {
      console.log('Skipped duplicate prototype reactions', {
        frameId: frame.id,
        duplicateInteractionsSkipped: numDuplicateInteractionsSkipped
      })
    }
    if (numStaleInteractionsRemoved > 0) {
      console.log('Removed stale prototype reactions', {
        frameId: frame.id,
        staleInteractionsRemoved: numStaleInteractionsRemoved
      })
    }
    return numInteractionsAdded
  }

  private static isCustomSpringTransition(transition): boolean {
    return transition?.easing?.type === AnimationEasing.CUSTOM_SPRING
  }

  private static getReactionWriteDebugEvent(
    status: string,
    didWrite: boolean,
    frame: FrameNode,
    left: FrameNode,
    right: FrameNode,
    top: FrameNode,
    bottom: FrameNode,
    device: Device,
    keycodesList: Array<NavigationKeycodes>,
    intendedReactions: Array<Reaction>,
    nextReactions: Array<Reaction>,
    numInteractionsAdded: number,
    numStaleInteractionsRemoved: number,
    numDuplicateInteractionsSkipped: number,
    error?
  ): Record<string, any> {
    return {
      type: 'reaction-write',
      status: status,
      didWrite: didWrite,
      frame: DebugReport.getNodeRef(frame),
      targets: {
        left: DebugReport.getNodeRef(left),
        right: DebugReport.getNodeRef(right),
        top: DebugReport.getNodeRef(top),
        bottom: DebugReport.getNodeRef(bottom)
      },
      device: device,
      keycodes: keycodesList.map(keycodes => ({
        left: keycodes.left,
        right: keycodes.right,
        up: keycodes.up,
        down: keycodes.down
      })),
      existingReactionCount: frame.reactions.length,
      intendedReactionCount: intendedReactions.length,
      intendedReactions: intendedReactions.map(reaction => DebugReport.summarizeReaction(reaction)),
      nextReactionCount: nextReactions.length,
      interactionsAdded: numInteractionsAdded,
      staleInteractionsRemoved: numStaleInteractionsRemoved,
      duplicateInteractionsSkipped: numDuplicateInteractionsSkipped,
      error: error ? DebugReport.summarizeError(error) : undefined
    }
  }

  static hasReaction(reactions: Array<Reaction>, reaction: Reaction): boolean {
    let reactionSignature = Utils.getReactionSignature(reaction)
    return reactions.some(existingReaction => Utils.getReactionSignature(existingReaction) === reactionSignature)
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
      actions: [{
        type: "NODE",
        destinationId: toFrame.id,
        // Figma's global `Navigation` type collides with the DOM `Navigation` type in TypeScript 6.
        navigation: "NAVIGATE" as unknown as Navigation,
        transition: Utils.createTransition(animation),
        preserveScrollPosition: false,
      }],
      trigger: {
        type: "ON_KEY_DOWN",
        device: device,
        keyCodes: keycode,
      }
    };
    return reaction;
  }

  private static getReactionSignature(reaction: Reaction): string {
    let trigger = (reaction as any).trigger
    let actions = ((reaction as any).actions || []).map(action => Utils.normalizeReactionAction(action))
    return Utils.stableStringify({
      trigger: trigger ? {
        type: trigger.type,
        device: trigger.device,
        keyCodes: trigger.keyCodes
      } : undefined,
      actions: actions
    })
  }

  private static normalizeReactionAction(action) {
    if (!action || action.type !== 'NODE') return action
    return {
      type: action.type,
      destinationId: action.destinationId,
      navigation: action.navigation,
      transition: typeof action.transition === 'undefined' ? null : action.transition,
      preserveScrollPosition: action.preserveScrollPosition === true
    }
  }

  private static isManagedKeyReaction(
    reaction: Reaction,
    device: Device,
    keycodesList: Array<NavigationKeycodes>
  ): boolean {
    const trigger = (reaction as any).trigger
    if (!trigger || trigger.type !== 'ON_KEY_DOWN' || trigger.device !== device) return false
    return Utils.getManagedKeycodes(keycodesList).some(keycodes => Utils.areKeycodesEqual(trigger.keyCodes, keycodes))
  }

  private static getManagedKeycodes(keycodesList: Array<NavigationKeycodes>): Array<Array<number>> {
    const managedKeycodes: Array<Array<number>> = []
    for (const keycodes of keycodesList) {
      Utils.addManagedKeycodes(managedKeycodes, keycodes.left)
      Utils.addManagedKeycodes(managedKeycodes, keycodes.right)
      Utils.addManagedKeycodes(managedKeycodes, keycodes.up)
      Utils.addManagedKeycodes(managedKeycodes, keycodes.down)
    }
    return managedKeycodes
  }

  private static addManagedKeycodes(managedKeycodes: Array<Array<number>>, keycodes: Array<number>) {
    if (keycodes.length === 0) return
    if (managedKeycodes.some(existingKeycodes => Utils.areKeycodesEqual(existingKeycodes, keycodes))) return
    managedKeycodes.push(keycodes)
  }

  private static areKeycodesEqual(first: Array<number>, second: Array<number>): boolean {
    if (!first || !second || first.length !== second.length) return false
    for (let i = 0; i < first.length; i++) {
      if (first[i] !== second[i]) return false
    }
    return true
  }

  private static stableStringify(value): string {
    let type = typeof value
    if (value === null || type === 'number' || type === 'string' || type === 'boolean') {
      return JSON.stringify(value)
    }
    if (type === 'undefined') return 'undefined'
    if (value instanceof Array) {
      return '[' + value.map(item => Utils.stableStringify(item)).join(',') + ']'
    }
    let keys = Object.keys(value).sort()
    return '{' + keys.map(key => JSON.stringify(key) + ':' + Utils.stableStringify(value[key])).join(',') + '}'
  }

  static createTransition(animation: Animation): Transition {
    switch(animation.type) {
      case AnimationType.INSTANT: return null;
      case AnimationType.DISSOLVE: 
      case AnimationType.SMART_ANIMATE: {
        const transition = {
          type: animation.type,
          easing: getTransitionEasing(animation),
          duration: getTransitionDuration(animation) / 1000
        }
        Utils.logCustomSpringTransition(animation, transition)
        return transition
      }
      case AnimationType.MOVE_IN:
      case AnimationType.MOVE_OUT:
      case AnimationType.PUSH:
      case AnimationType.SLIDE_IN:
      case AnimationType.SLIDE_OUT: {
        const transition = {
          type: animation.type,
          direction: animation.direction,
          matchLayers: animation.isMatchLayers,
          easing: getTransitionEasing(animation),
          duration: getTransitionDuration(animation) / 1000
        }
        Utils.logCustomSpringTransition(animation, transition)
        return transition
      }
    }
  }

  private static logCustomSpringTransition(animation: Animation, transition: Transition) {
    if (!Utils.isCustomSpringTransition(transition)) return
    if (typeof figma === 'undefined') return
    console.log('Creating custom spring transition', {
      sourceEasing: animation.easing,
      sourceDuration: animation.duration,
      duration: (transition as any).duration,
      easingFunctionSpring: (transition as any).easing?.easingFunctionSpring
    })
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

}
