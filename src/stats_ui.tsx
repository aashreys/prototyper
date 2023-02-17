import { VerticalSpace, Text } from "@create-figma-plugin/ui";
import { Component, ComponentChild, h } from "preact";
import styles from "./styles.css";

export class StatsPage extends Component<any, any>  {

  render(props?: any, state?: Readonly<any>, context?: any): ComponentChild {
    return(
      <div style={'margin-left: 16px; margin-right: 16px; text-align: center;'}>

        <VerticalSpace space='extraLarge' />

        <Text>
          Quantify just how efficient you are with Prototyper. Your peers will be jealous...
        </Text>

        <VerticalSpace space='large' />

        <text class={styles.statsBigText} >699,999</text>
        <br/>
        <text>Minutes Saved</text>

        <VerticalSpace space='large' />

        <text class={styles.statsMedText}>699,999</text>
        <br />
        <text>Frames Duplicated</text>

        <VerticalSpace space='medium' />

        <text class={styles.statsMedText}>699,999</text>
        <br />
        <text>Focus States Changed</text>

        <VerticalSpace space='medium' />

        <text class={styles.statsMedText}>699,999</text>
        <br />
        <text>Interactions Created</text>

        <VerticalSpace space='large' />

        <text>All stats are tracked and stored locally.</text>

      </div>
    )
  }

}