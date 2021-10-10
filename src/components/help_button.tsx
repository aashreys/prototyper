import { Component, h } from "preact";
import styles from "../styles.css";

export class HelpButton extends Component<any, any> {

  render(props, state) {
    return (
      <button class={styles.helpButton} onClick = {props.onClick}>?</button>
    )
  }

}