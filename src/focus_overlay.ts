import { NavigationFocusConfig, NavigationFocusMode } from "./navigation_focus";
import { Utils } from "./utils";

const OVERLAY_NAME = "__Prototyper Focus Overlay";
const GLOW_NAME = "__Prototyper Focus Glow";
const OVERLAY_PLUGIN_DATA_KEY = "prototyper_focus_overlay";
const DIRECT_FOCUS_PLUGIN_DATA_KEY = "prototyper_focus_direct_state";
const DEFAULT_SCALE_SHADOWS = [
  { color: "#000000", opacity: 0.2, blur: 16, spread: 1, offsetY: 6 },
  { color: "#000000", opacity: 0.18, blur: 36, spread: 2, offsetY: 18 },
  { color: "#000000", opacity: 0.12, blur: 64, spread: 4, offsetY: 38 },
];

interface DirectFocusState {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly effects?: ReadonlyArray<Effect>;
  readonly fills?: ReadonlyArray<Paint>;
  readonly fillStyleId?: string;
  readonly strokes?: ReadonlyArray<Paint>;
  readonly strokeStyleId?: string;
  readonly strokeWeight?: number;
  readonly strokeAlign?: string;
  readonly layoutPositioning?: string;
}

export class FocusOverlay {
  static resetManagedFocus(root: SceneNode) {
    FocusOverlay.removeManagedOverlays(root);
    FocusOverlay.restoreManagedDirectFocus(root);
  }

  static removeManagedOverlays(root: SceneNode) {
    if (!Utils.hasChildren(root)) return;
    const children = [...(root as any).children];
    for (const child of children) {
      if (FocusOverlay.isManagedOverlay(child)) {
        child.remove();
      } else {
        FocusOverlay.removeManagedOverlays(child);
      }
    }
  }

  static create(
    topLevelFrame: FrameNode,
    target: SceneNode,
    focus: NavigationFocusConfig,
  ): SceneNode {
    if (focus.mode === NavigationFocusMode.SCALE_SHADOW) {
      return FocusOverlay.createScaleShadow(target, focus);
    }
    if (focus.mode === NavigationFocusMode.STROKE) {
      return FocusOverlay.createStrokeOverlay(topLevelFrame, target, focus);
    }
    if (focus.mode === NavigationFocusMode.FILL) {
      return FocusOverlay.createDirectFill(target, focus);
    }
    if (focus.mode === NavigationFocusMode.SHADOW) {
      return FocusOverlay.createDirectShadow(topLevelFrame, target, focus);
    }

    return target;
  }

  private static createScaleShadow(
    target: SceneNode,
    focus: NavigationFocusConfig,
  ): SceneNode {
    const scale = Math.max(0.01, focus.scaleShadow.scale);
    const targetBounds = Utils.getAbsoluteBounds(target);
    const scaledBounds = FocusOverlay.getScaledBounds(targetBounds, scale);
    FocusOverlay.saveDirectFocusState(target);
    FocusOverlay.scaleNodeCentered(target, scaledBounds, scale);
    if (
      focus.scaleShadow.showShadow &&
      !FocusOverlay.applyDirectDropShadows(target, DEFAULT_SCALE_SHADOWS)
    ) {
      FocusOverlay.logDirectFocusFailure(
        "Unable to apply Scale up shadow focus effect",
        target,
      );
    }
    return target;
  }

  private static createDirectFill(
    target: SceneNode,
    focus: NavigationFocusConfig,
  ): SceneNode {
    FocusOverlay.saveDirectFocusState(target);
    if (FocusOverlay.applyDirectFill(target, focus)) {
      return target;
    }
    FocusOverlay.logDirectFocusFailure(
      "Unable to apply direct fill focus effect",
      target,
    );
    return target;
  }

  private static createStrokeOverlay(
    topLevelFrame: FrameNode,
    target: SceneNode,
    focus: NavigationFocusConfig,
  ): SceneNode {
    const overlay = FocusOverlay.createManagedFrame(
      OVERLAY_NAME,
      topLevelFrame,
    );
    FocusOverlay.insertOverlay(
      topLevelFrame,
      target,
      overlay,
      NavigationFocusMode.STROKE,
    );
    if (FocusOverlay.canUseAbsoluteLayout(overlay, topLevelFrame)) {
      overlay.layoutPositioning = "ABSOLUTE";
    }

    const targetBounds = FocusOverlay.getRenderedBounds(target);
    const frameBounds = Utils.getAbsoluteBounds(topLevelFrame);
    const padding = FocusOverlay.getStrokeOverlayPadding(focus);
    const focusBounds = FocusOverlay.getFocusBounds(
      targetBounds,
      frameBounds,
      padding,
    );

    overlay.resize(focusBounds.width, focusBounds.height);
    overlay.x = focusBounds.x;
    overlay.y = focusBounds.y;
    FocusOverlay.applyStrokeCornerRadius(overlay, target, padding, focusBounds);
    FocusOverlay.applyStroke(overlay, focus);
    if (focus.stroke.addGlow) {
      FocusOverlay.addStrokeGlow(
        overlay,
        topLevelFrame,
        target,
        targetBounds,
        padding,
      );
    }
    return overlay;
  }

  private static createDirectShadow(
    topLevelFrame: FrameNode,
    target: SceneNode,
    focus: NavigationFocusConfig,
  ): SceneNode {
    FocusOverlay.saveDirectFocusState(target);
    if (
      FocusOverlay.applyDirectDropShadow(
        target,
        focus.shadow.color,
        1,
        focus.shadow.blur,
        focus.shadow.spread,
        0,
      )
    ) {
      return target;
    }
    FocusOverlay.logDirectFocusFailure(
      "Unable to apply direct shadow focus effect",
      target,
    );
    return FocusOverlay.createShadowOverlayFallback(
      topLevelFrame,
      target,
      focus,
    );
  }

  private static createShadowOverlayFallback(
    topLevelFrame: FrameNode,
    target: SceneNode,
    focus: NavigationFocusConfig,
  ): SceneNode {
    const shadow = FocusOverlay.createManagedRectangle(
      OVERLAY_NAME,
      topLevelFrame,
    );
    FocusOverlay.insertOverlay(
      topLevelFrame,
      target,
      shadow,
      NavigationFocusMode.SHADOW,
    );
    if (FocusOverlay.canUseAbsoluteLayout(shadow, topLevelFrame)) {
      shadow.layoutPositioning = "ABSOLUTE";
    }

    const targetBounds = Utils.getAbsoluteBounds(target);
    const frameBounds = Utils.getAbsoluteBounds(topLevelFrame);
    const focusBounds = FocusOverlay.getFocusBounds(
      targetBounds,
      frameBounds,
      focus.shadow.padding,
    );

    shadow.resize(focusBounds.width, focusBounds.height);
    shadow.x = focusBounds.x;
    shadow.y = focusBounds.y;
    shadow.cornerRadius = FocusOverlay.clampRadius(
      focus.shadow.cornerRadius,
      FocusOverlay.getMaxRadius(focusBounds),
    );
    FocusOverlay.applyDropShadow(
      shadow,
      focus.shadow.color,
      1,
      focus.shadow.blur,
      focus.shadow.spread,
      0,
    );
    return shadow;
  }

  private static createManagedRectangle(
    name: string,
    topLevelFrame: FrameNode,
  ): RectangleNode {
    const overlay = figma.createRectangle();
    overlay.name = FocusOverlay.getManagedArtifactName(name, topLevelFrame);
    FocusOverlay.setManagedArtifactData(overlay);
    return overlay;
  }

  private static createManagedFrame(
    name: string,
    topLevelFrame: FrameNode,
  ): FrameNode {
    const overlay = figma.createFrame();
    overlay.name = FocusOverlay.getManagedArtifactName(name, topLevelFrame);
    overlay.fills = [];
    overlay.clipsContent = false;
    FocusOverlay.setManagedArtifactData(overlay);
    return overlay;
  }

  private static getManagedArtifactName(
    name: string,
    topLevelFrame: FrameNode,
  ): string {
    return `${name} ${topLevelFrame.id}`;
  }

  private static setManagedArtifactData(node: SceneNode) {
    node.setPluginData(OVERLAY_PLUGIN_DATA_KEY, "true");
  }

  private static isManagedOverlay(node): boolean {
    return Boolean(
      node?.getPluginData &&
      node.getPluginData(OVERLAY_PLUGIN_DATA_KEY) === "true",
    );
  }

  private static restoreManagedDirectFocus(root: SceneNode) {
    FocusOverlay.restoreDirectFocus(root);
    if (!Utils.hasChildren(root)) return;
    const children = [...(root as any).children];
    for (const child of children) {
      FocusOverlay.restoreManagedDirectFocus(child);
    }
  }

  private static saveDirectFocusState(target: SceneNode) {
    if (
      !target?.setPluginData ||
      target.getPluginData(DIRECT_FOCUS_PLUGIN_DATA_KEY).length > 0
    )
      return;
    const node: any = target;
    const state: DirectFocusState = {
      x: typeof node.x === "number" ? node.x : 0,
      y: typeof node.y === "number" ? node.y : 0,
      width: typeof node.width === "number" ? node.width : 0,
      height: typeof node.height === "number" ? node.height : 0,
      effects: "effects" in node ? node.effects : undefined,
      fills: "fills" in node ? node.fills : undefined,
      fillStyleId:
        "fillStyleId" in node && typeof node.fillStyleId === "string"
          ? node.fillStyleId
          : undefined,
      strokes: "strokes" in node ? node.strokes : undefined,
      strokeStyleId:
        "strokeStyleId" in node && typeof node.strokeStyleId === "string"
          ? node.strokeStyleId
          : undefined,
      strokeWeight:
        "strokeWeight" in node && typeof node.strokeWeight === "number"
          ? node.strokeWeight
          : undefined,
      strokeAlign:
        "strokeAlign" in node && typeof node.strokeAlign === "string"
          ? node.strokeAlign
          : undefined,
      layoutPositioning:
        "layoutPositioning" in node ? node.layoutPositioning : undefined,
    };
    target.setPluginData(DIRECT_FOCUS_PLUGIN_DATA_KEY, JSON.stringify(state));
  }

  private static restoreDirectFocus(target: SceneNode) {
    if (!target?.getPluginData) return;
    const stateString = target.getPluginData(DIRECT_FOCUS_PLUGIN_DATA_KEY);
    if (!stateString || stateString.length === 0) return;

    try {
      const state = JSON.parse(stateString) as DirectFocusState;
      const node: any = target;
      if ("effects" in node && state.effects) node.effects = state.effects;
      if ("fills" in node && state.fills) node.fills = state.fills;
      if (
        "fillStyleId" in node &&
        typeof state.fillStyleId === "string" &&
        state.fillStyleId.length > 0
      ) {
        try {
          node.fillStyleId = state.fillStyleId;
        } catch (error) {
          FocusOverlay.logDirectFocusFailure(
            "Unable to restore direct focus fill style",
            target,
            error,
          );
        }
      }
      if ("strokes" in node && state.strokes) node.strokes = state.strokes;
      if (
        "strokeStyleId" in node &&
        typeof state.strokeStyleId === "string" &&
        state.strokeStyleId.length > 0
      ) {
        try {
          node.strokeStyleId = state.strokeStyleId;
        } catch (error) {
          FocusOverlay.logDirectFocusFailure(
            "Unable to restore direct focus stroke style",
            target,
            error,
          );
        }
      }
      if ("strokeAlign" in node && state.strokeAlign)
        node.strokeAlign = state.strokeAlign;
      if ("strokeWeight" in node && typeof state.strokeWeight === "number")
        node.strokeWeight = state.strokeWeight;
      if ("layoutPositioning" in node && state.layoutPositioning)
        node.layoutPositioning = state.layoutPositioning;
      FocusOverlay.resizeNodeTo(target, state.width, state.height);
      if (typeof node.x === "number") node.x = state.x;
      if (typeof node.y === "number") node.y = state.y;
    } catch (error) {
      FocusOverlay.logDirectFocusFailure(
        "Unable to restore direct focus state",
        target,
        error,
      );
    }
    target.setPluginData(DIRECT_FOCUS_PLUGIN_DATA_KEY, "");
  }

  private static insertOverlay(
    topLevelFrame: FrameNode,
    target: SceneNode,
    overlay: SceneNode,
    mode: NavigationFocusMode,
  ) {
    if (mode !== NavigationFocusMode.SHADOW) {
      topLevelFrame.appendChild(overlay);
      return;
    }

    const topLevelChild = FocusOverlay.findTopLevelChild(topLevelFrame, target);
    const index = topLevelChild
      ? topLevelFrame.children.indexOf(topLevelChild)
      : -1;
    if (index >= 0) {
      topLevelFrame.insertChild(index, overlay);
      return;
    }

    topLevelFrame.appendChild(overlay);
  }

  private static findTopLevelChild(
    topLevelFrame: FrameNode,
    target: SceneNode,
  ): SceneNode | null {
    let current: any = target;
    while (
      current?.parent &&
      current.parent !== topLevelFrame &&
      current.parent.id !== topLevelFrame.id
    ) {
      current = current.parent;
    }
    if (
      current?.parent === topLevelFrame ||
      current?.parent?.id === topLevelFrame.id
    )
      return current;
    return null;
  }

  private static canUseAbsoluteLayout(
    node: SceneNode,
    parent: FrameNode,
  ): boolean {
    return (
      "layoutPositioning" in node &&
      "layoutMode" in parent &&
      parent.layoutMode !== "NONE"
    );
  }

  private static getFocusBounds(
    targetBounds: Rect,
    frameBounds: Rect,
    padding: number,
  ) {
    return {
      x: targetBounds.x - frameBounds.x - padding,
      y: targetBounds.y - frameBounds.y - padding,
      width: targetBounds.width + padding * 2,
      height: targetBounds.height + padding * 2,
    };
  }

  private static applyDirectFill(
    target: SceneNode,
    focus: NavigationFocusConfig,
  ): boolean {
    const node: any = target;
    if (!("fills" in node)) return false;

    const fills = Array.isArray(node.fills) ? node.fills.slice() : [];
    node.fills = [
      ...fills,
      FocusOverlay.createSolidPaint(
        focus.fill.color,
        Math.min(Math.max(0, focus.fill.opacity / 100), 1),
      ),
    ];
    return true;
  }

  private static getRenderedBounds(node: SceneNode): Rect {
    return (node as any).absoluteRenderBounds || Utils.getAbsoluteBounds(node);
  }

  private static getStrokeOverlayPadding(focus: NavigationFocusConfig): number {
    return focus.stroke.align === "OUTSIDE" ? focus.stroke.gap : 0;
  }

  private static applyStroke(
    overlay: FrameNode | RectangleNode,
    focus: NavigationFocusConfig,
  ) {
    overlay.fills = [];
    overlay.strokes = [
      FocusOverlay.createSolidPaint(
        focus.stroke.color,
        Math.min(Math.max(0, focus.stroke.opacity / 100), 1),
      ),
    ];
    overlay.strokeWeight = focus.stroke.weight;
    overlay.strokeAlign = focus.stroke.align;
    overlay.effects = [];
  }

  private static applyStrokeCornerRadius(
    overlay: FrameNode | RectangleNode,
    target: SceneNode,
    padding: number,
    focusBounds: Rect,
  ) {
    const radii = FocusOverlay.getTargetCornerRadii(target);
    if (!radii) {
      overlay.cornerRadius = 0;
      return;
    }
    FocusOverlay.setOverlayCornerRadii(
      overlay,
      radii,
      padding,
      FocusOverlay.getMaxRadius(focusBounds),
    );
  }

  private static addStrokeGlow(
    overlay: FrameNode,
    topLevelFrame: FrameNode,
    target: SceneNode,
    targetBounds: Rect,
    padding: number,
  ) {
    const glow = FocusOverlay.createManagedRectangle(GLOW_NAME, topLevelFrame);
    glow.x = padding;
    glow.y = padding;
    glow.resize(targetBounds.width, targetBounds.height);
    glow.fills = [
      FocusOverlay.createLinearGradientPaint("#FFFFFF", "#7A7A7A", 0.08),
    ];
    glow.strokes = [];
    glow.effects = [];
    FocusOverlay.applyStrokeCornerRadius(glow, target, 0, {
      x: 0,
      y: 0,
      width: targetBounds.width,
      height: targetBounds.height,
    });
    overlay.appendChild(glow);
  }

  private static getTargetCornerRadii(
    target: SceneNode,
  ): [number, number, number, number] | null {
    const node: any = target;
    if (!("cornerRadius" in node)) return null;
    if (
      typeof node.cornerRadius === "number" &&
      Number.isFinite(node.cornerRadius)
    ) {
      return [
        node.cornerRadius,
        node.cornerRadius,
        node.cornerRadius,
        node.cornerRadius,
      ];
    }
    const mixed =
      typeof figma !== "undefined" ? (figma as any).mixed : undefined;
    if (node.cornerRadius !== mixed) return null;
    const radii = [
      node.topLeftRadius,
      node.topRightRadius,
      node.bottomRightRadius,
      node.bottomLeftRadius,
    ];
    if (
      !radii.every(
        (radius) => typeof radius === "number" && Number.isFinite(radius),
      )
    )
      return null;
    return radii as [number, number, number, number];
  }

  private static setOverlayCornerRadii(
    overlay: FrameNode | RectangleNode,
    radii: [number, number, number, number],
    padding: number,
    maxRadius: number,
  ) {
    const [topLeft, topRight, bottomRight, bottomLeft] = radii.map((radius) =>
      FocusOverlay.clampRadius(radius + padding, maxRadius),
    );
    if (
      topLeft === topRight &&
      topRight === bottomRight &&
      bottomRight === bottomLeft
    ) {
      overlay.cornerRadius = topLeft;
      return;
    }
    overlay.topLeftRadius = topLeft;
    overlay.topRightRadius = topRight;
    overlay.bottomRightRadius = bottomRight;
    overlay.bottomLeftRadius = bottomLeft;
  }

  private static applyDropShadow(
    overlay: RectangleNode,
    colorValue: string,
    opacity: number,
    blur: number,
    spread: number,
    offsetY: number,
  ) {
    const color = FocusOverlay.parseHexColor(colorValue);
    overlay.fills = [
      {
        type: "SOLID",
        color: color,
        opacity: 0.01,
      },
    ];
    overlay.strokes = [];
    overlay.effects = [
      FocusOverlay.createDropShadowEffect(
        colorValue,
        opacity,
        blur,
        spread,
        offsetY,
      ),
    ];
  }

  private static applyDirectDropShadow(
    target: SceneNode,
    colorValue: string,
    opacity: number,
    blur: number,
    spread: number,
    offsetY: number,
  ): boolean {
    const node: any = target;
    if (!("effects" in node)) return false;
    const effects = Array.isArray(node.effects) ? node.effects.slice() : [];
    node.effects = [
      ...effects,
      FocusOverlay.createDropShadowEffect(
        colorValue,
        opacity,
        blur,
        spread,
        offsetY,
      ),
    ];
    return true;
  }

  private static applyDirectDropShadows(
    target: SceneNode,
    shadows: Array<{
      color: string;
      opacity: number;
      blur: number;
      spread: number;
      offsetY: number;
    }>,
  ): boolean {
    const node: any = target;
    if (!("effects" in node)) return false;
    const effects = Array.isArray(node.effects) ? node.effects.slice() : [];
    node.effects = [
      ...effects,
      ...shadows.map((shadow) =>
        FocusOverlay.createDropShadowEffect(
          shadow.color,
          shadow.opacity,
          shadow.blur,
          shadow.spread,
          shadow.offsetY,
        ),
      ),
    ];
    return true;
  }

  private static createDropShadowEffect(
    colorValue: string,
    opacity: number,
    blur: number,
    spread: number,
    offsetY: number,
  ): DropShadowEffect {
    const color = FocusOverlay.parseHexColor(colorValue);
    return {
      type: "DROP_SHADOW",
      color: {
        ...color,
        a: Math.min(Math.max(0, opacity), 1),
      },
      offset: {
        x: 0,
        y: offsetY,
      },
      radius: blur,
      spread: spread,
      visible: true,
      blendMode: "NORMAL",
      showShadowBehindNode: true,
    };
  }

  private static getMaxRadius(bounds: Rect): number {
    return Math.max(0, Math.min(bounds.width, bounds.height) / 2);
  }

  private static clampRadius(radius: number, maxRadius: number): number {
    return Math.min(Math.max(0, radius), maxRadius);
  }

  private static getScaledBounds(bounds: Rect, scale: number): Rect {
    const width = bounds.width * scale;
    const height = bounds.height * scale;
    return {
      x: bounds.x + (bounds.width - width) / 2,
      y: bounds.y + (bounds.height - height) / 2,
      width: width,
      height: height,
    };
  }

  private static scaleNodeCentered(
    target: SceneNode,
    scaledBounds: Rect,
    scale: number,
  ) {
    const parent: any = target.parent;
    const node: any = target;
    if (parent && FocusOverlay.canUseAbsoluteLayout(target, parent)) {
      node.layoutPositioning = "ABSOLUTE";
    }
    FocusOverlay.scaleNode(target, scale);
    const nextBounds = Utils.getAbsoluteBounds(target);
    if (typeof node.x === "number")
      node.x = node.x + (scaledBounds.x - nextBounds.x);
    if (typeof node.y === "number")
      node.y = node.y + (scaledBounds.y - nextBounds.y);
  }

  private static scaleNode(target: SceneNode, scale: number) {
    const node: any = target;
    if (typeof node.rescale === "function") {
      node.rescale(scale);
      return;
    }
    FocusOverlay.resizeNodeTo(target, node.width * scale, node.height * scale);
  }

  private static resizeNodeTo(
    target: SceneNode,
    width: number,
    height: number,
  ) {
    const node: any = target;
    if (
      typeof node.rescale === "function" &&
      typeof node.width === "number" &&
      node.width > 0
    ) {
      node.rescale(width / node.width);
      return;
    }
    if (typeof node.resizeWithoutConstraints === "function") {
      node.resizeWithoutConstraints(width, height);
      return;
    }
    if (typeof node.resize === "function") {
      node.resize(width, height);
      return;
    }
    FocusOverlay.logDirectFocusFailure(
      "Unable to resize direct focus target",
      target,
    );
  }

  private static logDirectFocusFailure(
    message: string,
    target: SceneNode,
    error?: unknown,
  ) {
    console.warn(message, {
      targetId: target.id,
      targetName: target.name,
      targetType: target.type,
      error: error instanceof Error ? error.message : String(error || ""),
    });
  }

  private static createSolidPaint(color: string, opacity = 1): SolidPaint {
    return {
      type: "SOLID",
      color: FocusOverlay.parseHexColor(color),
      opacity: opacity,
    };
  }

  private static createLinearGradientPaint(
    fromColor: string,
    toColor: string,
    opacity: number,
  ): GradientPaint {
    return {
      type: "GRADIENT_LINEAR",
      gradientTransform: [
        [0, 1, 0],
        [-1, 0, 1],
      ],
      gradientStops: [
        {
          position: 0,
          color: {
            ...FocusOverlay.parseHexColor(fromColor),
            a: 1,
          },
        },
        {
          position: 1,
          color: {
            ...FocusOverlay.parseHexColor(toColor),
            a: 1,
          },
        },
      ],
      opacity: opacity,
    };
  }

  private static parseHexColor(value: string): RGB {
    const fallback = "#0C8CE9";
    let hex = typeof value === "string" ? value.trim() : fallback;
    if (hex.startsWith("#")) hex = hex.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((character) => character + character)
        .join("");
    }
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
      hex = fallback.slice(1);
    }
    return {
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255,
    };
  }
}
