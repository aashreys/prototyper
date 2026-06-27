import { Bold, Button, Dropdown, DropdownOption, Text, VerticalSpace } from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { Component, h } from 'preact'
import { Constants } from '../constants'
import { PrototypeAlgorithm } from '../prototype_algorithm'

const ALGORITHM_OPTIONS: Array<DropdownOption> = [
  { value: PrototypeAlgorithm.EDGE_ANCHOR_CURRENT },
  { value: PrototypeAlgorithm.BEAM_ALIGNED_FIRST },
  { value: PrototypeAlgorithm.WEIGHTED_SCORE }
]

export class DebugOptions extends Component<DebugOptionsProps, DebugOptionsState> {

  removeDebugReportHandler: () => void

  constructor(props) {
    super(props)
    this.state = {
      isCopyingLogs: false,
      copyStatus: ''
    }
    this.bindMethods()
    this.registerEventHandlers()
  }

  bindMethods() {
    this.onAlgorithmChange = this.onAlgorithmChange.bind(this)
    this.onCopyLogsClick = this.onCopyLogsClick.bind(this)
    this.onDebugReportReceived = this.onDebugReportReceived.bind(this)
  }

  registerEventHandlers() {
    this.removeDebugReportHandler = on(Constants.EVENT_RECEIVE_DEBUG_REPORT, this.onDebugReportReceived)
  }

  componentWillUnmount() {
    if (this.removeDebugReportHandler) this.removeDebugReportHandler()
  }

  onAlgorithmChange(value: PrototypeAlgorithm) {
    this.props.onAlgorithmChange(value)
  }

  onCopyLogsClick() {
    this.setState({
      isCopyingLogs: true,
      copyStatus: 'Preparing logs...'
    })
    emit(Constants.EVENT_REQUEST_DEBUG_REPORT)
  }

  onDebugReportReceived(report: string) {
    this.copyToClipboard(report)
      .then(() => {
        this.setState({
          isCopyingLogs: false,
          copyStatus: 'Logs copied.'
        })
      })
      .catch(error => {
        console.error('Failed to copy debug report', error)
        this.setState({
          isCopyingLogs: false,
          copyStatus: 'Could not copy logs.'
        })
      })
  }

  copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text)
    }

    return new Promise((resolve, reject) => {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()

      const didCopy = document.execCommand('copy')
      document.body.removeChild(textarea)

      if (didCopy) {
        resolve()
      } else {
        reject(new Error('Clipboard copy failed'))
      }
    })
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

          <VerticalSpace space='large' />

          <Text><Bold>Logs</Bold></Text>

          <VerticalSpace space='small' />

          <Button
          disabled={this.state.isCopyingLogs}
          fullWidth
          onClick={this.onCopyLogsClick}
          secondary>
            Copy Logs
          </Button>

          {
            this.state.copyStatus.length > 0 &&
            <div>
              <VerticalSpace space='small' />
              <Text>{this.state.copyStatus}</Text>
            </div>
          }
        </div>
      </div>
    )
  }
}

interface DebugOptionsProps {
  algorithm: PrototypeAlgorithm
  onAlgorithmChange: (algorithm: PrototypeAlgorithm) => void
}

interface DebugOptionsState {
  isCopyingLogs: boolean
  copyStatus: string
}
