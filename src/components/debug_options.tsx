import { Bold, Dropdown, DropdownOption, Text, VerticalSpace } from '@create-figma-plugin/ui'
import { Component, h } from 'preact'
import { PrototypeAlgorithm } from '../prototype_algorithm'

const ALGORITHM_OPTIONS: Array<DropdownOption> = [
  { value: PrototypeAlgorithm.EDGE_ANCHOR_CURRENT },
  { value: PrototypeAlgorithm.BEAM_ALIGNED_FIRST },
  { value: PrototypeAlgorithm.WEIGHTED_SCORE }
]

export class DebugOptions extends Component<DebugOptionsProps, Record<string, never>> {

  constructor(props) {
    super(props)
    this.bindMethods()
  }

  bindMethods() {
    this.onAlgorithmChange = this.onAlgorithmChange.bind(this)
  }

  onAlgorithmChange(value: PrototypeAlgorithm) {
    this.props.onAlgorithmChange(value)
  }

  render(props: DebugOptionsProps) {
    return (
      <div>
        <VerticalSpace space='large' />

        <div style='padding-left: 16px; padding-right: 16px;'>
          <Text><Bold>Algorithm</Bold></Text>

          <VerticalSpace space='small' />

          <Dropdown
          onChange={e => this.onAlgorithmChange(e.currentTarget.value as PrototypeAlgorithm)}
          options={ALGORITHM_OPTIONS}
          value={props.algorithm} />
        </div>
      </div>
    )
  }
}

interface DebugOptionsProps {
  algorithm: PrototypeAlgorithm
  onAlgorithmChange: (algorithm: PrototypeAlgorithm) => void
}
