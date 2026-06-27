# Notes

## Neighbor Search

- Consider adding a minimum beam-overlap ratio if span-overlap matching proves too permissive.
- Candidate formula: `overlap / min(originSpan, candidateSpan)`.
- Start without this threshold; add it only if real layouts show 1px or tiny-edge overlap creating incorrect neighbors.
