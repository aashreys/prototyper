import { Container, render, Stack, Tabs, TabsOption } from '@create-figma-plugin/ui'
import { useState } from 'preact/hooks';
import { Component, Fragment, h, JSX } from 'preact';
import { PrototypeForm } from './prototype_form';
import { emit } from '@create-figma-plugin/utilities';
import { Constants } from './constants';

const UITabs = function (props) {
  const [value, setValue] = useState(props.value)
  function handleChange(event: JSX.TargetedEvent<HTMLInputElement>) {
    const newValue = event.currentTarget.value
    console.log(newValue)
    setValue(newValue)
  }
  return <Tabs onChange={handleChange} options={props.options} value={value} />
}

export class UI extends Component<any, any> {

  container: any

  tabs: Array<TabsOption> = [
    {
      children:
        <Container space="medium">
          <PrototypeForm value={this.props.config} />
        </Container>,
      value: 'Generate'
    },
    {
      children:
        <Container space="medium">
          <PrototypeForm value={this.props.config} />
        </Container>,
      value: 'Link'
    },
    {
      children:
        <Container space="medium">
          About
        </Container>,
      value: 'About'
    },
  ]

  defaultTab: string = 'Generate'

  constructor(props) {
    super(props);
    this.bindMethods();
  }

  bindMethods() {
    this.componentDidUpdate = this.componentDidUpdate.bind(this);
    this.componentDidMount = this.componentDidMount.bind(this);
    this.onHeightChanged = this.onHeightChanged.bind(this);
  }

  componentDidMount() {
    if (this.container) {
      this.onHeightChanged(this.container.base.parentNode.clientHeight);
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.container) {
      this.onHeightChanged(this.container.base.parentNode.clientHeight);
    }
  }

  onHeightChanged(height: number) {
    emit(Constants.EVENT_UI_RESIZE, height);
  }

  render(props, state) {
    return (
      <Stack ref={(container) => { this.container = container }}>
        <UITabs options={this.tabs} value={this.defaultTab} />
      </Stack>
    )
  }
}

function Plugin(props) {
  return (<UI config={props} />)
}

export default render(Plugin)