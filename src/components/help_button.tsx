import { Component, h } from "preact";

export class HelpButton extends Component<any, any> {

  render(props, state) {
    return (
      <button
      style="
      background-color: black;
      text-align: center;
      border-radius: 32px;
      color: white;
      font-size: 14px;
      height: 32px;
      width: 32px;
      overflow: hidden;
      white-space: nowrap;"
      onClick = {props?.onClick} >?</button>
    )
  }

}