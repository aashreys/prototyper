import { Columns, Container, IconArrowDown16, IconArrowLeft16, IconArrowRight16, IconArrowUp16, IconCaretUp16, Stack, Textbox } from "@create-figma-plugin/ui";
import { Component, h } from "preact";

export class CustomInput extends Component<any, any> {

  render(props, state) {
    return (
      <div style="display: block; margin: auto">
        <div>
          <div style="width: 48%; margin: auto">
            <Textbox icon={<IconArrowUp16/>} placeholder='Up Input' value="" />
          </div>
        </div>
        <div style="display: flex; margin-top: var(--space-extra-small)">
          <div style="width: 48%">
            <Textbox icon={<IconArrowLeft16/>} placeholder='Left Input' value="" />
          </div>
          <div style="width: 4%"></div>
          <div style="width: 48%">
            <Textbox icon={<IconArrowRight16/>} placeholder='Right Input' value="" />
          </div>
        </div>
        <div style="margin-top: var(--space-extra-small)">
          <div style="width: 48%; margin: auto">
            <Textbox icon={<IconArrowDown16/>} placeholder='Down Input' value="" />
          </div>
        </div>
      </div>
    )
  }

}