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

type NavigableWithNeighbors<T> = Navigable & {
  neighbors: Neighbors<T>
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

export class NearestNeighbor {

  static assignNeighbors(
    navigables: Array<Navigable>,
    options: NeighborSearchOptions = {}
  ): void {
    NearestNeighbor.assignNeigbors(navigables, options);
  }

  static assignNeigbors(
    navigables: Array<Navigable>,
    options: NeighborSearchOptions = {}
  ): void {
    NearestNeighbor._assignNeighborsWithBeamAlignedFirst(navigables, options);
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

  private static computeDistance(point1: Vector, point2: Vector) {
    // Calculate distance between center points with Pythagoras Theorem
    const a = point2.x - point1.x;
    const b = point2.y - point1.y;
    return Math.sqrt(a * a + b * b);
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
