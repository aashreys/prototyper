import { Utils } from "../utils";

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

export class NearestNeighbor {
  
  static assignNeigbors(navigables: Array<Navigable>): void {
    NearestNeighbor._assignNeigborsFromAnchors(navigables);
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

  static dedupeNeighbors(anchor: AnchorPoints, neighbors: Neighbors<AnchorPoints>){
    let leftDist, rightDist, topDist, bottomDist
    if (neighbors.left) leftDist = NearestNeighbor.getLeftDistance(anchor, neighbors.left)
    if (neighbors.right) rightDist =NearestNeighbor.getRightDistance(anchor, neighbors.right)
    if (neighbors.top) topDist = NearestNeighbor.getTopDistance(anchor, neighbors.top)
    if (neighbors.bottom) bottomDist = NearestNeighbor.getBottomDistance(anchor, neighbors.bottom)

    if (neighbors.left && neighbors.left === neighbors.right) {
      neighbors.left = leftDist <= rightDist ? neighbors.left : undefined
    }

    if (neighbors.left && neighbors.left === neighbors.top) {
      neighbors.left = leftDist <= topDist ? neighbors.left : undefined
    }

    if (neighbors.left && neighbors.left === neighbors.bottom) {
      neighbors.left = leftDist <= bottomDist ? neighbors.left : undefined
    }

    if (neighbors.right && neighbors.right === neighbors.top) {
      neighbors.right = rightDist <= topDist ? neighbors.right : undefined
    }

    if (neighbors.right && neighbors.right === neighbors.bottom) {
      neighbors.right = rightDist <= bottomDist ? neighbors.right : undefined
    }

    if (neighbors.top && neighbors.top === neighbors.bottom) {
      neighbors.top = topDist <= bottomDist ? neighbors.top : undefined
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

}