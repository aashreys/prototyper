export enum PrototypeAlgorithm {
  EDGE_ANCHOR_CURRENT = 'edge-anchor-current',
  BEAM_ALIGNED_FIRST = 'beam-aligned-first',
  WEIGHTED_SCORE = 'weighted-score'
}

export const DEFAULT_PROTOTYPE_ALGORITHM = PrototypeAlgorithm.BEAM_ALIGNED_FIRST

export function parsePrototypeAlgorithm(algorithm: unknown): PrototypeAlgorithm {
  switch (algorithm) {
    case PrototypeAlgorithm.EDGE_ANCHOR_CURRENT:
    case PrototypeAlgorithm.BEAM_ALIGNED_FIRST:
    case PrototypeAlgorithm.WEIGHTED_SCORE:
      return algorithm as PrototypeAlgorithm
    default:
      if (algorithm !== undefined) {
        console.warn(`Unknown nearest-neighbor algorithm "${algorithm}". Using "${DEFAULT_PROTOTYPE_ALGORITHM}".`)
      }
      return DEFAULT_PROTOTYPE_ALGORITHM
  }
}
