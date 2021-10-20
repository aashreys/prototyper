import { Utils } from "../utils";

export interface Navigable {

  getNavPoint(): Point

  getAnchors(): Anchors

  setNeighbors(neighbors: Neighbors<any>)

}

export interface Neighbors<T> {

  left: T
  right: T
  top: T
  bottom: T
  
}

export interface Point {
  readonly x
  readonly y
}

export interface Anchors {

  readonly left: Point
  readonly right: Point
  readonly top: Point
  readonly bottom: Point

}

export interface NeighborIndex {
  readonly left: number,
  readonly right: number,
  readonly top: number,
  readonly bottom: number,
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
          let direction = NearestNeighbor.computeDirection(origin.getNavPoint(), nav.getNavPoint());
          let distance = NearestNeighbor.computeDistance(origin.getNavPoint(), nav.getNavPoint());
          // Update closest navigable for each direction
          switch (direction) {
            case Direction.LEFT:
              if (left === undefined || distance < NearestNeighbor.computeDistance(origin.getNavPoint(), left.getNavPoint())) {
                left = nav;
              }
              break;

            case Direction.RIGHT:
              if (right === undefined || distance < NearestNeighbor.computeDistance(origin.getNavPoint(), right.getNavPoint())) {
                right = nav;
              }
              break;

            case Direction.TOP:
              if (top === undefined || distance < NearestNeighbor.computeDistance(origin.getNavPoint(), top.getNavPoint())) {
                top = nav;
              }
              break;

            case Direction.BOTTOM:
              if (bottom === undefined || distance < NearestNeighbor.computeDistance(origin.getNavPoint(), bottom.getNavPoint())) {
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
    for (let node1 of navigables) {
      let left: Navigable, right: Navigable, top: Navigable, bottom: Navigable
      for (let node2 of navigables) {
        if (node1 !== node2) {
          let anchors1 = node1.getAnchors();
          let anchors2 = node2.getAnchors();
          let leftDist = NearestNeighbor.computeDistance(anchors1.left, anchors2.right)
          let rightDist = NearestNeighbor.computeDistance(anchors1.right, anchors2.left)
          let topDist = NearestNeighbor.computeDistance(anchors1.top, anchors2.bottom)
          let bottomDist = NearestNeighbor.computeDistance(anchors1.bottom, anchors2.top)
          if  (
                (left === undefined && NearestNeighbor.isLeftOf(anchors1.left, anchors2.right)) ||
                (NearestNeighbor.isLeftOf(anchors1.left, anchors2.right) && 
                leftDist < NearestNeighbor.getLeftDistance(anchors1, left.getAnchors()))
              ) {
            left = node2
          }

          if (
                (right === undefined && NearestNeighbor.isRightOf(anchors1.right, anchors2.left)) ||
                (NearestNeighbor.isRightOf(anchors1.right, anchors2.left) &&
                rightDist < NearestNeighbor.getRightDistance(anchors1, right.getAnchors()))
              ) {
            right = node2
          }

          if  (
                (top === undefined && NearestNeighbor.isAbove(anchors1.top, anchors2.bottom)) ||
                (NearestNeighbor.isAbove(anchors1.top, anchors2.bottom) &&
                topDist < NearestNeighbor.getTopDistance(anchors1, top.getAnchors()))
              ) {
            top = node2
          }

          if  (
                (bottom === undefined && NearestNeighbor.isBottomOf(anchors1.bottom, anchors2.top)) ||
                (NearestNeighbor.isBottomOf(anchors1.bottom, anchors2.top) && 
                bottomDist < NearestNeighbor.getBottomDistance(anchors1, bottom.getAnchors()))
              ) {
            bottom = node2
          }
        }
      }

      let neighbors = {
        left: left,
        right: right,
        top: top,
        bottom: bottom
      }
      NearestNeighbor.dedupeNeighbors(node1, neighbors);
      node1.setNeighbors(neighbors);
    }
  }

  static dedupeNeighbors(refNode: Navigable, neighbors: Neighbors<Navigable>){
    let leftDist, rightDist, topDist, bottomDist
    if (neighbors.left) leftDist = NearestNeighbor.getLeftDistance(refNode.getAnchors(), neighbors.left.getAnchors())
    if (neighbors.right) rightDist =NearestNeighbor.getRightDistance(refNode.getAnchors(), neighbors.right.getAnchors())
    if (neighbors.top) topDist = NearestNeighbor.getTopDistance(refNode.getAnchors(), neighbors.top.getAnchors())
    if (neighbors.bottom) bottomDist = NearestNeighbor.getBottomDistance(refNode.getAnchors(), neighbors.bottom.getAnchors())

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

  static computeNeighbors(points: Array<Point>): Array<NeighborIndex> {
    let neighbors = [];

    // For each point (let's call it origin), find neighbors and assign it to the respective index variable
    for (let origin of points) {
      let left, right, top, bottom;
      // Check each node's relative position against the origin node
      for (let point of points) {
        if (origin !== point) {
          let direction = NearestNeighbor.computeDirection(origin, point);
          let distance = NearestNeighbor.computeDistance(origin, point);
          // Update closest node for each direction
          switch (direction) {
            case Direction.LEFT:
              if (left === undefined || distance < NearestNeighbor.computeDistance(origin, left)) {
                left = point;
              }
              break;

            case Direction.RIGHT:
              if (right === undefined || distance < NearestNeighbor.computeDistance(origin, right)) {
                right = point;
              }
              break;

            case Direction.TOP:
              if (top === undefined || distance < NearestNeighbor.computeDistance(origin, top)) {
                top = point;
              }
              break;

            case Direction.BOTTOM:
              if (bottom === undefined || distance < NearestNeighbor.computeDistance(origin, bottom)) {
                bottom = point;
              }
              break;
          }
        }
      }

      neighbors.push({
        left: points.indexOf(left),
        right: points.indexOf(right),
        top: points.indexOf(top),
        bottom: points.indexOf(bottom)
      })
    }
    return neighbors;
  }

  private static computeDirection(origin: Point, point: Point) {
    // Offset coordinates to be relative to origin node
    let offsetPoint: Point = {
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

  private static computeDistance(point1: Point, point2: Point) {
    // Calculate distance between center points with Pythagoras Theorem
    const a = point2.x - point1.x;
    const b = point2.y - point1.y;
    return Math.sqrt(a * a + b * b);
  }

  private static isBottomOf(point1: Point, point2: Point): boolean {
    return Utils.isBelow(point1.x , point1.y, point2.x, point2.y)
  }

  private static isAbove(point1: Point, point2: Point): boolean {
    return Utils.isAbove(point1.x , point1.y, point2.x, point2.y)
  }

  private static isLeftOf(point1: Point, point2: Point): boolean {
    return Utils.isLeftOf(point1.x , point1.y, point2.x, point2.y)
  }

  private static isRightOf(point1: Point, point2: Point): boolean {
    return Utils.isRightOf(point1.x , point1.y, point2.x, point2.y)
  }

  static getLeftDistance(anchors1: Anchors, anchors2: Anchors): number {
    return NearestNeighbor.computeDistance(anchors1.left, anchors2.right)
  }

  static getRightDistance(anchors1: Anchors, anchors2: Anchors): number {
    return NearestNeighbor.computeDistance(anchors1.right, anchors2.left)
  }

  static getTopDistance(anchors1: Anchors, anchors2: Anchors): number {
    return NearestNeighbor.computeDistance(anchors1.top, anchors2.bottom)
  }

  static getBottomDistance(anchors1: Anchors, anchors2: Anchors): number {
    return NearestNeighbor.computeDistance(anchors1.bottom, anchors2.top)
  }

}