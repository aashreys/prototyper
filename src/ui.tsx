import { render } from '@create-figma-plugin/ui'
import { h } from 'preact'
import { PrototypeForm } from './prototype_form';

function Plugin(props) {
  return (<PrototypeForm value={props} />)
}

export default render(Plugin)