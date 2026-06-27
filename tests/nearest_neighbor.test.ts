import assert from 'node:assert/strict'
import test from 'node:test'
import { BeamStackGravity, NearestNeighbor, type Navigable, type Neighbors } from '../src/core/nearest_neighbor'
import { DEFAULT_PROTOTYPE_ALGORITHM, PrototypeAlgorithm } from '../src/prototype_algorithm'
import { PrototypeNode } from '../src/prototype_node'

class TestNavigable implements Navigable {
  readonly id: string
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  neighbors: Neighbors<TestNavigable> = {
    left: undefined as unknown as TestNavigable,
    right: undefined as unknown as TestNavigable,
    top: undefined as unknown as TestNavigable,
    bottom: undefined as unknown as TestNavigable
  }

  constructor(id: string, x: number, y: number, width = 100, height = 100) {
    this.id = id
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  getX(): number {
    return this.x
  }

  getY(): number {
    return this.y
  }

  getWidth(): number {
    return this.width
  }

  getHeight(): number {
    return this.height
  }

  setNeighbors(neighbors: Neighbors<TestNavigable>) {
    this.neighbors = neighbors
  }
}

function countNeighborReferences(origin: TestNavigable, target: TestNavigable): number {
  return Object.values(origin.neighbors).filter(neighbor => neighbor === target).length
}

function createGrid() {
  return {
    topLeft: new TestNavigable('topLeft', 0, 0),
    topRight: new TestNavigable('topRight', 120, 0),
    bottomLeft: new TestNavigable('bottomLeft', 0, 120),
    bottomRight: new TestNavigable('bottomRight', 120, 120)
  }
}

function createWideBarAndHorizontalStack() {
  const topBar = new TestNavigable('topBar', 0, 0, 700, 80)
  const tile1 = new TestNavigable('tile1', 0, 140, 80, 80)
  const tile2 = new TestNavigable('tile2', 120, 140, 80, 80)
  const tile3 = new TestNavigable('tile3', 240, 140, 80, 80)
  const tile4 = new TestNavigable('tile4', 360, 140, 80, 80)
  const tile5 = new TestNavigable('tile5', 480, 140, 80, 80)
  const tile6 = new TestNavigable('tile6', 600, 140, 80, 80)
  const bottomBar = new TestNavigable('bottomBar', 0, 280, 700, 80)

  return {
    nodes: [topBar, tile1, tile2, tile3, tile4, tile5, tile6, bottomBar],
    topBar,
    tile1,
    tile4,
    tile6,
    bottomBar
  }
}

function createTallBarAndVerticalStack() {
  const leftBar = new TestNavigable('leftBar', 0, 0, 80, 700)
  const tile1 = new TestNavigable('tile1', 140, 0, 80, 80)
  const tile2 = new TestNavigable('tile2', 140, 120, 80, 80)
  const tile3 = new TestNavigable('tile3', 140, 240, 80, 80)
  const tile4 = new TestNavigable('tile4', 140, 360, 80, 80)
  const tile5 = new TestNavigable('tile5', 140, 480, 80, 80)
  const tile6 = new TestNavigable('tile6', 140, 600, 80, 80)
  const rightBar = new TestNavigable('rightBar', 280, 0, 80, 700)

  return {
    nodes: [leftBar, tile1, tile2, tile3, tile4, tile5, tile6, rightBar],
    leftBar,
    tile1,
    tile4,
    tile6,
    rightBar
  }
}

test('defaults nearest-neighbor assignment to beam aligned-first', () => {
  assert.equal(DEFAULT_PROTOTYPE_ALGORITHM, PrototypeAlgorithm.BEAM_ALIGNED_FIRST)
})

test('creates anchor points from navigable geometry', () => {
  let nav = new TestNavigable('button', 10, 20, 80, 40)

  assert.deepEqual(NearestNeighbor.createAnchor(nav), {
    navigable: nav,
    left: { x: 10, y: 40 },
    right: { x: 90, y: 40 },
    top: { x: 50, y: 20 },
    bottom: { x: 50, y: 60 }
  })
})

for (const algorithm of [
  PrototypeAlgorithm.EDGE_ANCHOR_CURRENT,
  PrototypeAlgorithm.BEAM_ALIGNED_FIRST,
  PrototypeAlgorithm.WEIGHTED_SCORE
]) {
  test(`${algorithm} assigns nearest cardinal neighbors in a grid`, () => {
    let { topLeft, topRight, bottomLeft, bottomRight } = createGrid()

    NearestNeighbor.assignNeigbors([topLeft, topRight, bottomLeft, bottomRight], algorithm)

    assert.equal(topLeft.neighbors.right, topRight)
    assert.equal(topLeft.neighbors.bottom, bottomLeft)
    assert.equal(bottomRight.neighbors.left, bottomLeft)
    assert.equal(bottomRight.neighbors.top, topRight)
  })
}

test('beam ignores diagonal candidates without beam overlap', () => {
  let origin = new TestNavigable('origin', 100, 100)
  let aligned = new TestNavigable('aligned', 500, 100)
  let diagonal = new TestNavigable('diagonal', 210, -10)

  NearestNeighbor.assignNeigbors(
    [origin, aligned, diagonal],
    PrototypeAlgorithm.BEAM_ALIGNED_FIRST
  )

  assert.equal(origin.neighbors.right, aligned)
  assert.equal(origin.neighbors.top, undefined)
})

test('beam uses center direction for overlapping vertical bounds', () => {
  let origin = new TestNavigable('origin', 0, 0, 100, 100)
  let overlappingBelow = new TestNavigable('overlappingBelow', 0, 90, 100, 100)
  let separatedBelow = new TestNavigable('separatedBelow', 0, 220, 100, 100)

  NearestNeighbor.assignNeigbors(
    [origin, overlappingBelow, separatedBelow],
    PrototypeAlgorithm.BEAM_ALIGNED_FIRST
  )

  assert.equal(origin.neighbors.bottom, overlappingBelow)
})

test('beam uses center direction for overlapping horizontal bounds', () => {
  let origin = new TestNavigable('origin', 0, 0, 100, 100)
  let overlappingRight = new TestNavigable('overlappingRight', 90, 0, 100, 100)
  let separatedRight = new TestNavigable('separatedRight', 220, 0, 100, 100)

  NearestNeighbor.assignNeigbors(
    [origin, overlappingRight, separatedRight],
    PrototypeAlgorithm.BEAM_ALIGNED_FIRST
  )

  assert.equal(origin.neighbors.right, overlappingRight)
})

test('beam links unequal centered vertical stacks sequentially', () => {
  let nodes = [
    new TestNavigable('1', 54, 44, 371, 57),
    new TestNavigable('2', 68, 119, 343, 56),
    new TestNavigable('3', 29, 193, 421, 57),
    new TestNavigable('4', 93, 268, 293, 56),
    new TestNavigable('5', 46, 342, 388, 57),
    new TestNavigable('6', 69, 417, 342, 56),
    new TestNavigable('7', 46, 492, 388, 56),
    new TestNavigable('8', 68, 566, 343, 57)
  ]

  NearestNeighbor.assignNeigbors(nodes, PrototypeAlgorithm.BEAM_ALIGNED_FIRST)

  assert.equal(NearestNeighbor.findStart(nodes), nodes[0])
  for (let i = 0; i < nodes.length - 1; i++) {
    assert.equal(nodes[i].neighbors.bottom, nodes[i + 1])
    assert.equal(nodes[i + 1].neighbors.top, nodes[i])
    assert.equal(nodes[i].neighbors.left, undefined)
    assert.equal(nodes[i].neighbors.right, undefined)
  }
  assert.equal(nodes[nodes.length - 1].neighbors.left, undefined)
  assert.equal(nodes[nodes.length - 1].neighbors.right, undefined)
})

test('beam includes unequal vertical stack candidates that overlap the horizontal beam', () => {
  let top = new TestNavigable('top', 0, 0, 400, 60)
  let middle = new TestNavigable('middle', 0, 90, 80, 60)
  let bottom = new TestNavigable('bottom', 0, 180, 400, 60)
  let nodes = [top, middle, bottom]

  NearestNeighbor.assignNeigbors(nodes, PrototypeAlgorithm.BEAM_ALIGNED_FIRST)

  assert.equal(top.neighbors.bottom, middle)
  assert.equal(middle.neighbors.top, top)
  assert.equal(middle.neighbors.bottom, bottom)
  assert.equal(bottom.neighbors.top, middle)
  assert.equal(top.neighbors.left, undefined)
  assert.equal(top.neighbors.right, undefined)
})

test('beam includes unequal horizontal row candidates that overlap the vertical beam', () => {
  let left = new TestNavigable('left', 0, 0, 60, 400)
  let middle = new TestNavigable('middle', 90, 0, 60, 80)
  let right = new TestNavigable('right', 180, 0, 60, 400)
  let nodes = [left, middle, right]

  NearestNeighbor.assignNeigbors(nodes, PrototypeAlgorithm.BEAM_ALIGNED_FIRST)

  assert.equal(left.neighbors.right, middle)
  assert.equal(middle.neighbors.left, left)
  assert.equal(middle.neighbors.right, right)
  assert.equal(right.neighbors.left, middle)
  assert.equal(left.neighbors.top, undefined)
  assert.equal(left.neighbors.bottom, undefined)
})

test('beam chooses the leftmost candidate when a wide origin points to a horizontal stack', () => {
  const { nodes, topBar, tile1, bottomBar } = createWideBarAndHorizontalStack()

  NearestNeighbor.assignNeigbors(
    nodes,
    PrototypeAlgorithm.BEAM_ALIGNED_FIRST
  )

  assert.equal(topBar.neighbors.bottom, tile1)
  assert.equal(bottomBar.neighbors.top, tile1)
})

test('beam can center gravity when a wide origin points to a horizontal stack', () => {
  const { nodes, topBar, tile4, bottomBar } = createWideBarAndHorizontalStack()

  NearestNeighbor.assignNeigbors(
    nodes,
    PrototypeAlgorithm.BEAM_ALIGNED_FIRST,
    { beamStackGravity: BeamStackGravity.CENTER }
  )

  assert.equal(topBar.neighbors.bottom, tile4)
  assert.equal(bottomBar.neighbors.top, tile4)
})

test('beam can end gravity when a wide origin points to a horizontal stack', () => {
  const { nodes, topBar, tile6, bottomBar } = createWideBarAndHorizontalStack()

  NearestNeighbor.assignNeigbors(
    nodes,
    PrototypeAlgorithm.BEAM_ALIGNED_FIRST,
    { beamStackGravity: BeamStackGravity.END }
  )

  assert.equal(topBar.neighbors.bottom, tile6)
  assert.equal(bottomBar.neighbors.top, tile6)
})

test('beam chooses the topmost candidate when a tall origin points to a vertical stack', () => {
  const { nodes, leftBar, tile1, rightBar } = createTallBarAndVerticalStack()

  NearestNeighbor.assignNeigbors(
    nodes,
    PrototypeAlgorithm.BEAM_ALIGNED_FIRST
  )

  assert.equal(leftBar.neighbors.right, tile1)
  assert.equal(rightBar.neighbors.left, tile1)
})

test('beam can center gravity when a tall origin points to a vertical stack', () => {
  const { nodes, leftBar, tile4, rightBar } = createTallBarAndVerticalStack()

  NearestNeighbor.assignNeigbors(
    nodes,
    PrototypeAlgorithm.BEAM_ALIGNED_FIRST,
    { beamStackGravity: BeamStackGravity.CENTER }
  )

  assert.equal(leftBar.neighbors.right, tile4)
  assert.equal(rightBar.neighbors.left, tile4)
})

test('beam can end gravity when a tall origin points to a vertical stack', () => {
  const { nodes, leftBar, tile6, rightBar } = createTallBarAndVerticalStack()

  NearestNeighbor.assignNeigbors(
    nodes,
    PrototypeAlgorithm.BEAM_ALIGNED_FIRST,
    { beamStackGravity: BeamStackGravity.END }
  )

  assert.equal(leftBar.neighbors.right, tile6)
  assert.equal(rightBar.neighbors.left, tile6)
})

test('weighted scoring uses beam-overlap candidates only', () => {
  let origin = new TestNavigable('origin', 100, 100)
  let aligned = new TestNavigable('aligned', 500, 100)
  let diagonal = new TestNavigable('diagonal', 210, -10)

  NearestNeighbor.assignNeigbors(
    [origin, aligned, diagonal],
    PrototypeAlgorithm.WEIGHTED_SCORE
  )

  assert.equal(origin.neighbors.right, aligned)
  assert.equal(origin.neighbors.top, undefined)
})

test('finds the top graph root for vertical lists without x-axis sorting', () => {
  let top = new TestNavigable('top', 500, 0)
  let wideMiddle = new TestNavigable('wideMiddle', 0, 150, 1000, 100)
  let bottom = new TestNavigable('bottom', 500, 300)
  let nodes = [wideMiddle, bottom, top]

  NearestNeighbor.assignNeigbors(nodes, PrototypeAlgorithm.BEAM_ALIGNED_FIRST)

  assert.equal(NearestNeighbor.findStart(nodes), top)
})

test('finds the left graph root for horizontal rows without y-axis sorting', () => {
  let left = new TestNavigable('left', 0, 200)
  let highMiddle = new TestNavigable('highMiddle', 150, 100)
  let right = new TestNavigable('right', 300, 200)
  let nodes = [highMiddle, right, left]

  NearestNeighbor.assignNeigbors(nodes, PrototypeAlgorithm.BEAM_ALIGNED_FIRST)

  assert.equal(NearestNeighbor.findStart(nodes), left)
})

test('dedupes one target assigned to multiple directions', () => {
  let origin = new TestNavigable('origin', 100, 100)
  let diagonal = new TestNavigable('diagonal', 0, 0)

  NearestNeighbor.assignNeigbors([origin, diagonal], PrototypeAlgorithm.EDGE_ANCHOR_CURRENT)

  assert.equal(countNeighborReferences(origin, diagonal), 1)
  assert.equal(origin.neighbors.left, diagonal)
  assert.equal(origin.neighbors.top, undefined)
})

test('prototype nodes use absolute bounds for neighbor geometry', () => {
  const instance = {
    id: 'rotated-instance',
    name: 'Rotated Instance',
    type: 'INSTANCE',
    absoluteTransform: [
      [0, 1, 1000],
      [-1, 0, 2000]
    ],
    absoluteBoundingBox: {
      x: 10,
      y: 20,
      width: 40,
      height: 80
    },
    absoluteRenderBounds: {
      x: 8,
      y: 18,
      width: 44,
      height: 84
    },
    width: 80,
    height: 40,
    parent: {
      type: 'PAGE'
    }
  } as unknown as InstanceNode

  const node = PrototypeNode.fromInstance(instance)

  assert.equal(node.getX(), 10)
  assert.equal(node.getY(), 20)
  assert.equal(node.getWidth(), 40)
  assert.equal(node.getHeight(), 80)
})
