import { DEFAULT_PROTOTYPE_ALGORITHM, PrototypeAlgorithm } from "../prototype_algorithm";

export interface Navigable {

  setNeighbors(neighbors: Neighbors<any>)

  getX(): number

  getY(): number

  getWidth(): number

  getHeight(): number

}

export interface Neighbors<T> {

  left: T
  right: T
  top: T
  bottom: T
  
}

export type NeighborStrategyId = PrototypeAlgorithm

type NavigableWithNeighbors<T> = Navigable & {
  neighbors: Neighbors<T>
}

export interface NeighborStrategy {

  readonly id: NeighborStrategyId

  assignNeighbors(navigables: Array<Navigable>, options?: NeighborSearchOptions): void

}

export enum BeamStackGravity {
  START = 'start',
  CENTER = 'center',
  END = 'end'
}

export interface NeighborSearchOptions {

  beamStackGravity?: BeamStackGravity

}

export const DEFAULT_BEAM_STACK_GRAVITY = BeamStackGravity.START

export const NeighborStrategyIds: Record<string, NeighborStrategyId> = {
  EDGE_ANCHOR_CURRENT: PrototypeAlgorithm.EDGE_ANCHOR_CURRENT,
  BEAM_ALIGNED_FIRST: PrototypeAlgorithm.BEAM_ALIGNED_FIRST,
  WEIGHTED_SCORE: PrototypeAlgorithm.WEIGHTED_SCORE
}

interface AnchorPoints {

  readonly navigable: Navigable
  readonly left: Vector
  readonly right: Vector
  readonly top: Vector
  readonly bottom: Vector

}

enum Direction {
  LEFT,
  TOP,
  RIGHT,
  BOTTOM
}

interface CandidateMetrics {

  readonly anchor: AnchorPoints
  readonly direction: Direction
  readonly primaryDistance: number
  readonly perpendicularCenterDistance: number
  readonly diagonalDistance: number
  readonly hasPerpendicularOverlap: boolean

}

interface MetricScore {

  readonly primary: number
  readonly secondary: number
  readonly tertiary: number
  readonly quaternary?: number

}

const WEIGHTED_SCORE_PRIMARY_DISTANCE_WEIGHT = 1
const WEIGHTED_SCORE_PERPENDICULAR_DISTANCE_WEIGHT = 0.5
const WEIGHTED_SCORE_DIAGONAL_PENALTY_WEIGHT = 0.25

export class NearestNeighbor {

  static assignNeighbors(
    navigables: Array<Navigable>,
    strategyId: NeighborStrategyId = DEFAULT_PROTOTYPE_ALGORITHM,
    options: NeighborSearchOptions = {}
  ): void {
    NearestNeighbor.assignNeigbors(navigables, strategyId, options);
  }

  static assignNeigbors(
    navigables: Array<Navigable>,
    strategyId: NeighborStrategyId = DEFAULT_PROTOTYPE_ALGORITHM,
    options: NeighborSearchOptions = {}
  ): void {
    NearestNeighbor.getStrategy(strategyId).assignNeighbors(navigables, options);
  }

  static getStrategy(strategyId: NeighborStrategyId): NeighborStrategy {
    const strategy = NearestNeighbor.STRATEGIES[strategyId]
    if (!strategy) {
      console.warn(`Unknown nearest-neighbor strategy "${strategyId}". Using "${DEFAULT_PROTOTYPE_ALGORITHM}".`)
      return NearestNeighbor.STRATEGIES[DEFAULT_PROTOTYPE_ALGORITHM]
    }
    return strategy
  }

  static findStart<T extends NavigableWithNeighbors<T>>(navigables: Array<T>): T {
    const cornerCandidates = navigables.filter(nav =>
      !nav.neighbors?.top &&
      !nav.neighbors?.left &&
      (nav.neighbors?.bottom || nav.neighbors?.right)
    )
    if (cornerCandidates.length > 0) return NearestNeighbor.getTopLeftNavigable(cornerCandidates)

    const verticalEdges = navigables.filter(nav => nav.neighbors?.top).length +
      navigables.filter(nav => nav.neighbors?.bottom).length
    const horizontalEdges = navigables.filter(nav => nav.neighbors?.left).length +
      navigables.filter(nav => nav.neighbors?.right).length

    if (horizontalEdges > verticalEdges) {
      const horizontalStarts = navigables.filter(nav => !nav.neighbors?.left && nav.neighbors?.right)
      if (horizontalStarts.length > 0) return NearestNeighbor.getLeftTopNavigable(horizontalStarts)

      const noLeftCandidates = navigables.filter(nav => !nav.neighbors?.left)
      if (noLeftCandidates.length > 0) return NearestNeighbor.getLeftTopNavigable(noLeftCandidates)

      return NearestNeighbor.getLeftTopNavigable(navigables)
    }

    const verticalStarts = navigables.filter(nav => !nav.neighbors?.top && nav.neighbors?.bottom)
    if (verticalStarts.length > 0) return NearestNeighbor.getTopLeftNavigable(verticalStarts)

    const noTopCandidates = navigables.filter(nav => !nav.neighbors?.top)
    if (noTopCandidates.length > 0) return NearestNeighbor.getTopLeftNavigable(noTopCandidates)

    return NearestNeighbor.getTopLeftNavigable(navigables)
  }

  static readonly STRATEGIES: Record<NeighborStrategyId, NeighborStrategy> = {
    [PrototypeAlgorithm.EDGE_ANCHOR_CURRENT]: {
      id: PrototypeAlgorithm.EDGE_ANCHOR_CURRENT,
      assignNeighbors(navigables: Array<Navigable>): void {
        NearestNeighbor._assignNeigborsFromAnchors(navigables);
      }
    },
    [PrototypeAlgorithm.BEAM_ALIGNED_FIRST]: {
      id: PrototypeAlgorithm.BEAM_ALIGNED_FIRST,
      assignNeighbors(navigables: Array<Navigable>, options: NeighborSearchOptions = {}): void {
        NearestNeighbor._assignNeighborsWithBeamAlignedFirst(navigables, options);
      }
    },
    [PrototypeAlgorithm.WEIGHTED_SCORE]: {
      id: PrototypeAlgorithm.WEIGHTED_SCORE,
      assignNeighbors(navigables: Array<Navigable>): void {
        NearestNeighbor._assignNeighborsWithWeightedScore(navigables);
      }
    }
  }

  /* First nearest neighbor algorithm for Prototyper. Works great for regular symmetric grids, but poor for staggered, asymmetric grids. Replaced by new anchor point based algorithm. */
  static _assignNeigborsFromCenters(navigables: Array<Navigable>): void {
    // For each navigable (let's call it origin), find neighbors and assign it to the respective index variable
    for (let origin of navigables) {
      let left: Navigable
      let right: Navigable
      let top: Navigable
      let bottom: Navigable
      // Check each navigable's relative position against the origin
      for (let nav of navigables) {
        if (origin !== nav) {
          let originCenter = this.getCenter(origin)
          let navCenter = this.getCenter(nav)

          let direction = NearestNeighbor.computeDirection(originCenter, navCenter);
          let distance = NearestNeighbor.computeDistance(originCenter, navCenter);
          // Update closest navigable for each direction
          switch (direction) {
            case Direction.LEFT:
              if (left === undefined || 
                distance < NearestNeighbor.computeDistance(originCenter, this.getCenter(left))) {
                left = nav;
              }
              break;

            case Direction.RIGHT:
              if (right === undefined || 
                distance < NearestNeighbor.computeDistance(originCenter, this.getCenter(right))) {
                right = nav;
              }
              break;

            case Direction.TOP:
              if (top === undefined || 
                distance < NearestNeighbor.computeDistance(originCenter, this.getCenter(top))) {
                top = nav;
              }
              break;

            case Direction.BOTTOM:
              if (bottom === undefined || 
                distance < NearestNeighbor.computeDistance(originCenter, this.getCenter(bottom))) {
                bottom = nav;
              }
              break;
          }
        }
      }

      origin.setNeighbors({
        left: left,
        right: right,
        top: top,
        bottom: bottom
      });

    }
  }

  static _assignNeigborsFromAnchors(navigables: Array<Navigable>): void {
    let anchors = navigables.map(nav => NearestNeighbor.createAnchor(nav));
    for (let anchor1 of anchors) {
      let left: AnchorPoints, right: AnchorPoints, top: AnchorPoints, bottom: AnchorPoints
      for (let anchor2 of anchors) {
        if (anchor1.navigable !== anchor2.navigable) {
          let leftDist = NearestNeighbor.computeDistance(anchor1.left, anchor2.right)
          let rightDist = NearestNeighbor.computeDistance(anchor1.right, anchor2.left)
          let topDist = NearestNeighbor.computeDistance(anchor1.top, anchor2.bottom)
          let bottomDist = NearestNeighbor.computeDistance(anchor1.bottom, anchor2.top)

          if  (
                (left === undefined && NearestNeighbor.isLeftOf(anchor1, anchor2)) ||
                (NearestNeighbor.isLeftOf(anchor1, anchor2) && 
                leftDist < NearestNeighbor.getLeftDistance(anchor1, left))
              ) {
            left = anchor2
          }

          if (
                (right === undefined && NearestNeighbor.isRightOf(anchor1, anchor2)) ||
                (NearestNeighbor.isRightOf(anchor1, anchor2) &&
                rightDist < NearestNeighbor.getRightDistance(anchor1, right))
              ) {
            right = anchor2
          }

          if  (
                (top === undefined && NearestNeighbor.isTopOf(anchor1, anchor2)) ||
                (NearestNeighbor.isTopOf(anchor1, anchor2) &&
                topDist < NearestNeighbor.getTopDistance(anchor1, top))
              ) {
            top = anchor2
          }

          if  (
                (bottom === undefined && NearestNeighbor.isBottomOf(anchor1, anchor2)) ||
                (NearestNeighbor.isBottomOf(anchor1, anchor2) && 
                bottomDist < NearestNeighbor.getBottomDistance(anchor1, bottom))
              ) {
            bottom = anchor2
          }
        }
      }

      let neighborAnchors: Neighbors<AnchorPoints> = {
        left: left,
        right: right,
        top: top,
        bottom: bottom
      }
      NearestNeighbor.dedupeNeighbors(anchor1, neighborAnchors)

      let neighbors: Neighbors<Navigable> = {
        left: neighborAnchors.left?.navigable,
        right: neighborAnchors.right?.navigable,
        top: neighborAnchors.top?.navigable,
        bottom: neighborAnchors.bottom?.navigable
      }
      anchor1.navigable.setNeighbors(neighbors)
    }
  }

  static _assignNeighborsWithBeamAlignedFirst(
    navigables: Array<Navigable>,
    options: NeighborSearchOptions = {}
  ): void {
    const stackGravity = options.beamStackGravity || DEFAULT_BEAM_STACK_GRAVITY
    NearestNeighbor._assignNeighborsWithMetrics(navigables, function (metrics) {
      const alignedMetrics = metrics.filter(metric => metric.hasPerpendicularOverlap)
      if (alignedMetrics.length === 0) {
        return NearestNeighbor.getLowestMetric(metrics, function (metric) {
          return {
            primary: metric.diagonalDistance,
            secondary: metric.primaryDistance,
            tertiary: metric.perpendicularCenterDistance
          }
        })
      }

      return NearestNeighbor.getLowestMetric(alignedMetrics, function (metric) {
        return {
          primary: metric.primaryDistance,
          secondary: NearestNeighbor.getStackGravityScore(metric, stackGravity),
          tertiary: metric.perpendicularCenterDistance,
          quaternary: metric.diagonalDistance
        }
      })
    })
  }

  static _assignNeighborsWithWeightedScore(navigables: Array<Navigable>): void {
    NearestNeighbor._assignNeighborsWithMetrics(navigables, function (metrics) {
      return NearestNeighbor.getLowestMetric(metrics, function (metric) {
        const diagonalPenalty = metric.diagonalDistance - metric.primaryDistance
        return {
          primary: (
            metric.primaryDistance * WEIGHTED_SCORE_PRIMARY_DISTANCE_WEIGHT +
            metric.perpendicularCenterDistance * WEIGHTED_SCORE_PERPENDICULAR_DISTANCE_WEIGHT +
            diagonalPenalty * WEIGHTED_SCORE_DIAGONAL_PENALTY_WEIGHT
          ),
          secondary: metric.primaryDistance,
          tertiary: metric.diagonalDistance
        }
      })
    })
  }

  static _assignNeighborsWithMetrics(
    navigables: Array<Navigable>,
    selectNeighbor: (metrics: Array<CandidateMetrics>) => AnchorPoints
  ): void {
    const anchors = navigables.map(nav => NearestNeighbor.createAnchor(nav));
    for (const anchor of anchors) {
      const neighborAnchors: Neighbors<AnchorPoints> = {
        left: selectNeighbor(NearestNeighbor.getCandidateMetrics(anchor, anchors, Direction.LEFT)),
        right: selectNeighbor(NearestNeighbor.getCandidateMetrics(anchor, anchors, Direction.RIGHT)),
        top: selectNeighbor(NearestNeighbor.getCandidateMetrics(anchor, anchors, Direction.TOP)),
        bottom: selectNeighbor(NearestNeighbor.getCandidateMetrics(anchor, anchors, Direction.BOTTOM))
      }
      NearestNeighbor.dedupeNeighbors(anchor, neighborAnchors)

      anchor.navigable.setNeighbors({
        left: neighborAnchors.left?.navigable,
        right: neighborAnchors.right?.navigable,
        top: neighborAnchors.top?.navigable,
        bottom: neighborAnchors.bottom?.navigable
      })
    }
  }

  static dedupeNeighbors(anchor: AnchorPoints, neighbors: Neighbors<AnchorPoints>) {
    type NeighborDirection = 'left' | 'right' | 'top' | 'bottom'
    type NeighborCandidate = {
      direction: NeighborDirection,
      anchor: AnchorPoints,
      distance: number
    }

    const candidates: NeighborCandidate[] = []
    if (neighbors.left) {
      candidates.push({ direction: 'left', anchor: neighbors.left, distance: NearestNeighbor.getLeftDistance(anchor, neighbors.left) })
    }
    if (neighbors.right) {
      candidates.push({ direction: 'right', anchor: neighbors.right, distance: NearestNeighbor.getRightDistance(anchor, neighbors.right) })
    }
    if (neighbors.top) {
      candidates.push({ direction: 'top', anchor: neighbors.top, distance: NearestNeighbor.getTopDistance(anchor, neighbors.top) })
    }
    if (neighbors.bottom) {
      candidates.push({ direction: 'bottom', anchor: neighbors.bottom, distance: NearestNeighbor.getBottomDistance(anchor, neighbors.bottom) })
    }

    const processed: AnchorPoints[] = []
    for (const candidate of candidates) {
      if (processed.indexOf(candidate.anchor) !== -1) continue
      const duplicates = candidates.filter(value => value.anchor === candidate.anchor)
      if (duplicates.length > 1) {
        let closest = duplicates[0]
        for (const duplicate of duplicates) {
          if (duplicate.distance < closest.distance) closest = duplicate
        }
        for (const duplicate of duplicates) {
          if (duplicate !== closest) neighbors[duplicate.direction] = undefined
        }
      }
      processed.push(candidate.anchor)
    }
  }

  private static computeDirection(origin: Vector, point: Vector) {
    // Offset coordinates to be relative to origin node
    let offsetPoint: Vector = {
      x: point.x - origin.x,
      y: point.y - origin.y
    }

    // Calculate angle in degrees between 0 to 360
    let angle = ((Math.atan2(offsetPoint.y, offsetPoint.x) * 180 / Math.PI) + 360) % 360;

    // Map angle to direction and return
    let direction;
    if (angle > 150 && angle <= 210) {
      direction = Direction.LEFT;
    }
    else if (angle > 210 && angle <= 330) {
      direction = Direction.TOP;
    }
    else if ((angle > 330 && angle < 360) || (angle >= 0 && angle <= 30)) {
      direction = Direction.RIGHT
    } else {
      direction = Direction.BOTTOM;
    }
    return direction;
  }

  private static computeDistance(point1: Vector, point2: Vector) {
    // Calculate distance between center points with Pythagoras Theorem
    const a = point2.x - point1.x;
    const b = point2.y - point1.y;
    return Math.sqrt(a * a + b * b);
  }

  private static isLeftOf(anchor1: AnchorPoints, anchor2: AnchorPoints): boolean {
    return anchor2.right.x <= anchor1.left.x;
  }

  private static isRightOf(anchor1: AnchorPoints, anchor2: AnchorPoints): boolean {
    return anchor2.left.x >= anchor1.right.x
  }

  private static isBottomOf(anchor1: AnchorPoints, anchor2: AnchorPoints): boolean {
    return anchor2.top.y >= anchor1.bottom.y
  }

  private static isTopOf(anchor1: AnchorPoints, anchor2: AnchorPoints): boolean {
    return anchor2.bottom.y <= anchor1.top.y
  }

  private static isInDirection(anchor1: AnchorPoints, anchor2: AnchorPoints, direction: Direction): boolean {
    switch (direction) {
      case Direction.LEFT:
        return NearestNeighbor.isLeftOf(anchor1, anchor2)
      case Direction.RIGHT:
        return NearestNeighbor.isRightOf(anchor1, anchor2)
      case Direction.TOP:
        return NearestNeighbor.isTopOf(anchor1, anchor2)
      case Direction.BOTTOM:
        return NearestNeighbor.isBottomOf(anchor1, anchor2)
    }
  }

  private static getCandidateMetrics(anchor: AnchorPoints, anchors: Array<AnchorPoints>, direction: Direction): Array<CandidateMetrics> {
    const metrics = new Array<CandidateMetrics>()
    for (const candidate of anchors) {
      if (anchor.navigable !== candidate.navigable && NearestNeighbor.isDirectionalCandidate(anchor, candidate, direction)) {
        metrics.push({
          anchor: candidate,
          direction: direction,
          primaryDistance: NearestNeighbor.getPrimaryDistance(anchor, candidate, direction),
          perpendicularCenterDistance: NearestNeighbor.getPerpendicularCenterDistance(anchor, candidate, direction),
          diagonalDistance: NearestNeighbor.getDirectionalDistance(anchor, candidate, direction),
          hasPerpendicularOverlap: NearestNeighbor.hasPerpendicularOverlap(anchor, candidate, direction)
        })
      }
    }
    return metrics
  }

  private static getLowestMetric(
    metrics: Array<CandidateMetrics>,
    getScore: (metric: CandidateMetrics) => MetricScore
  ): AnchorPoints {
    let lowestMetric: CandidateMetrics
    let lowestScore: MetricScore
    for (const metric of metrics) {
      const score = getScore(metric)
      if (lowestMetric === undefined || NearestNeighbor.isLowerMetricScore(score, lowestScore)) {
        lowestMetric = metric
        lowestScore = score
      }
    }
    return lowestMetric?.anchor
  }

  private static isLowerMetricScore(score: MetricScore, currentLowest: MetricScore): boolean {
    const values = [score.primary, score.secondary, score.tertiary, score.quaternary ?? 0]
    const lowestValues = [currentLowest.primary, currentLowest.secondary, currentLowest.tertiary, currentLowest.quaternary ?? 0]
    for (let i = 0; i < values.length; i++) {
      if (values[i] < lowestValues[i]) return true
      if (values[i] > lowestValues[i]) return false
    }
    return false
  }

  private static getStackGravityScore(metric: CandidateMetrics, gravity: BeamStackGravity): number {
    switch (gravity) {
      case BeamStackGravity.START:
        return NearestNeighbor.getStackStart(metric)
      case BeamStackGravity.CENTER:
        return metric.perpendicularCenterDistance
      case BeamStackGravity.END:
        return -NearestNeighbor.getStackEnd(metric)
    }
  }

  private static getStackStart(metric: CandidateMetrics): number {
    switch (metric.direction) {
      case Direction.LEFT:
      case Direction.RIGHT:
        return metric.anchor.top.y
      case Direction.TOP:
      case Direction.BOTTOM:
        return metric.anchor.left.x
    }
  }

  private static getStackEnd(metric: CandidateMetrics): number {
    switch (metric.direction) {
      case Direction.LEFT:
      case Direction.RIGHT:
        return metric.anchor.bottom.y
      case Direction.TOP:
      case Direction.BOTTOM:
        return metric.anchor.right.x
    }
  }

  private static getPrimaryDistance(anchor1: AnchorPoints, anchor2: AnchorPoints, direction: Direction): number {
    switch (direction) {
      case Direction.LEFT:
        return Math.max(0, anchor1.left.x - anchor2.right.x)
      case Direction.RIGHT:
        return Math.max(0, anchor2.left.x - anchor1.right.x)
      case Direction.TOP:
        return Math.max(0, anchor1.top.y - anchor2.bottom.y)
      case Direction.BOTTOM:
        return Math.max(0, anchor2.top.y - anchor1.bottom.y)
    }
  }

  private static isDirectionalCandidate(anchor1: AnchorPoints, anchor2: AnchorPoints, direction: Direction): boolean {
    if (!NearestNeighbor.isCenterInDirection(anchor1, anchor2, direction)) return false
    return NearestNeighbor.hasPerpendicularOverlap(anchor1, anchor2, direction)
  }

  private static isCenterInDirection(anchor1: AnchorPoints, anchor2: AnchorPoints, direction: Direction): boolean {
    const center1 = NearestNeighbor.getCenter(anchor1.navigable)
    const center2 = NearestNeighbor.getCenter(anchor2.navigable)
    switch (direction) {
      case Direction.LEFT:
        return center2.x < center1.x
      case Direction.RIGHT:
        return center2.x > center1.x
      case Direction.TOP:
        return center2.y < center1.y
      case Direction.BOTTOM:
        return center2.y > center1.y
    }
  }

  private static getPerpendicularCenterDistance(anchor1: AnchorPoints, anchor2: AnchorPoints, direction: Direction): number {
    const center1 = NearestNeighbor.getCenter(anchor1.navigable)
    const center2 = NearestNeighbor.getCenter(anchor2.navigable)
    switch (direction) {
      case Direction.LEFT:
      case Direction.RIGHT:
        return Math.abs(center1.y - center2.y)
      case Direction.TOP:
      case Direction.BOTTOM:
        return Math.abs(center1.x - center2.x)
    }
  }

  private static getDirectionalDistance(anchor1: AnchorPoints, anchor2: AnchorPoints, direction: Direction): number {
    switch (direction) {
      case Direction.LEFT:
        return NearestNeighbor.getLeftDistance(anchor1, anchor2)
      case Direction.RIGHT:
        return NearestNeighbor.getRightDistance(anchor1, anchor2)
      case Direction.TOP:
        return NearestNeighbor.getTopDistance(anchor1, anchor2)
      case Direction.BOTTOM:
        return NearestNeighbor.getBottomDistance(anchor1, anchor2)
    }
  }

  private static hasPerpendicularOverlap(anchor1: AnchorPoints, anchor2: AnchorPoints, direction: Direction): boolean {
    switch (direction) {
      case Direction.LEFT:
      case Direction.RIGHT:
        return NearestNeighbor.spansOverlap(anchor1.top.y, anchor1.bottom.y, anchor2.top.y, anchor2.bottom.y)
      case Direction.TOP:
      case Direction.BOTTOM:
        return NearestNeighbor.spansOverlap(anchor1.left.x, anchor1.right.x, anchor2.left.x, anchor2.right.x)
    }
  }

  private static spansOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
    return start1 <= end2 && start2 <= end1
  }

  static getLeftDistance(anchors1: AnchorPoints, anchors2: AnchorPoints): number {
    return NearestNeighbor.computeDistance(anchors1.left, anchors2.right)
  }

  static getRightDistance(anchors1: AnchorPoints, anchors2: AnchorPoints): number {
    return NearestNeighbor.computeDistance(anchors1.right, anchors2.left)
  }

  static getTopDistance(anchors1: AnchorPoints, anchors2: AnchorPoints): number {
    return NearestNeighbor.computeDistance(anchors1.top, anchors2.bottom)
  }

  static getBottomDistance(anchors1: AnchorPoints, anchors2: AnchorPoints): number {
    return NearestNeighbor.computeDistance(anchors1.bottom, anchors2.top)
  }

  static createAnchor(nav: Navigable): AnchorPoints {
    return {
        navigable: nav,
        left: { x: nav.getX(), y: nav.getY() + nav.getHeight() / 2 },
        right: { x: nav.getX() + nav.getWidth() , y: nav.getY() + nav.getHeight() / 2 },
        top: { x: nav.getX() + nav.getWidth() / 2, y: nav.getY() },
        bottom: {x: nav.getX() + nav.getWidth() / 2, y: nav.getY() + nav.getHeight() }
    }
  }

  static getCenter(nav: Navigable): Vector {
    return {
      x: nav.getX() + (nav.getWidth() / 2),
      y: nav.getY() + (nav.getHeight() / 2)
    }
  }

  private static getTopLeftNavigable<T extends Navigable>(navigables: Array<T>): T {
    return navigables.reduce((best, nav) => {
      if (nav.getY() < best.getY()) return nav
      if (nav.getY() === best.getY() && nav.getX() < best.getX()) return nav
      return best
    })
  }

  private static getLeftTopNavigable<T extends Navigable>(navigables: Array<T>): T {
    return navigables.reduce((best, nav) => {
      if (nav.getX() < best.getX()) return nav
      if (nav.getX() === best.getX() && nav.getY() < best.getY()) return nav
      return best
    })
  }

}
