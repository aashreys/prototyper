import assert from 'node:assert/strict'
import test from 'node:test'
import { NearestNeighbor, type Navigable, type Neighbors } from '../src/core/nearest_neighbor'
import { DEFAULT_PROTOTYPE_ALGORITHM, PrototypeAlgorithm } from '../src/prototype_algorithm'

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

test('beam prefers aligned candidates over closer diagonal candidates', () => {
  let origin = new TestNavigable('origin', 100, 100)
  let aligned = new TestNavigable('aligned', 500, 100)
  let diagonal = new TestNavigable('diagonal', 210, -10)

  NearestNeighbor.assignNeigbors(
    [origin, aligned, diagonal],
    PrototypeAlgorithm.BEAM_ALIGNED_FIRST
  )

  assert.equal(origin.neighbors.right, aligned)
  assert.equal(origin.neighbors.top, diagonal)
})

test('weighted scoring can choose a diagonal candidate with a lower score', () => {
  let origin = new TestNavigable('origin', 100, 100)
  let aligned = new TestNavigable('aligned', 500, 100)
  let diagonal = new TestNavigable('diagonal', 210, -10)

  NearestNeighbor.assignNeigbors(
    [origin, aligned, diagonal],
    PrototypeAlgorithm.WEIGHTED_SCORE
  )

  assert.equal(origin.neighbors.right, diagonal)
})

test('dedupes one target assigned to multiple directions', () => {
  let origin = new TestNavigable('origin', 100, 100)
  let diagonal = new TestNavigable('diagonal', 0, 0)

  NearestNeighbor.assignNeigbors([origin, diagonal], PrototypeAlgorithm.EDGE_ANCHOR_CURRENT)

  assert.equal(countNeighborReferences(origin, diagonal), 1)
  assert.equal(origin.neighbors.left, diagonal)
  assert.equal(origin.neighbors.top, undefined)
})
