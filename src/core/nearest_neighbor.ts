export interface Navigable {

  getNavPoint(): Point

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

}