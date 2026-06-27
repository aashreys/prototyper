import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_PROTOTYPE_ALGORITHM, parsePrototypeAlgorithm, PrototypeAlgorithm } from '../src/prototype_algorithm'

function withMutedConsole<T>(method: 'warn', callback: () => T): T {
  let original = console[method]
  console[method] = (() => undefined) as any
  try {
    return callback()
  } finally {
    console[method] = original
  }
}

test('parses selected algorithm ids', () => {
  assert.equal(
    parsePrototypeAlgorithm(PrototypeAlgorithm.EDGE_ANCHOR_CURRENT),
    PrototypeAlgorithm.EDGE_ANCHOR_CURRENT
  )
  assert.equal(
    parsePrototypeAlgorithm(PrototypeAlgorithm.BEAM_ALIGNED_FIRST),
    PrototypeAlgorithm.BEAM_ALIGNED_FIRST
  )
  assert.equal(
    parsePrototypeAlgorithm(PrototypeAlgorithm.WEIGHTED_SCORE),
    PrototypeAlgorithm.WEIGHTED_SCORE
  )
})

test('falls back to beam for missing or unknown algorithm ids', () => {
  assert.equal(parsePrototypeAlgorithm(undefined), DEFAULT_PROTOTYPE_ALGORITHM)
  withMutedConsole('warn', () => {
    assert.equal(parsePrototypeAlgorithm('unknown'), DEFAULT_PROTOTYPE_ALGORITHM)
  })
})
