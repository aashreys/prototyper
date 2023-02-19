import { VerticalSpace, Text } from "@create-figma-plugin/ui";
import { Component, ComponentChild, h } from "preact";
import { StatsModel } from "./stats";
import styles from "./styles.css";

export class StatsPage extends Component<{ stats: StatsModel }, any>  {

  formatNumber(value: number): string {
    return value.toLocaleString()
  }

  formatTime(timeInSeconds: number): string {
    return Math.round((timeInSeconds / 60)).toLocaleString()
  }

  render(props?: { stats: StatsModel }, state?: Readonly<any>, context?: any): ComponentChild {
    console.log('render stats')
    return(
      <div style={'margin-left: 16px; margin-right: 16px; text-align: center;'}>

        <VerticalSpace space='large' />

        <Text align="center">
          Quantify just how efficient Prototyper makes you with these stats. ❤️
        </Text>

        <VerticalSpace space='medium' />

        <text class={styles.statsBigText}>
          {this.formatTime(props.stats.secondsSaved)}
        </text>
        <br/>
        <text>Minutes Saved</text>

        <VerticalSpace space='medium' />

        <text class={styles.statsMedText}>
          {this.formatNumber(props.stats.prototypesCreated)}
        </text>
        <br />
        <text>Prototypes Created</text>

        <VerticalSpace space='medium' />

        <text class={styles.statsMedText}>
          {this.formatNumber(props.stats.framesDuped)}
        </text>
        <br />
        <text>Frames Duplicated</text>

        <VerticalSpace space='small' />

        <text class={styles.statsMedText}>
          {this.formatNumber(props.stats.statesChanged)}
        </text>
        <br />
        <text>Focus States Changed</text>

        <VerticalSpace space='small' />

        <text class={styles.statsMedText}>
          {this.formatNumber(props.stats.interactionsCreated)}
        </text>
        <br />
        <text>Interactions Created</text>

        <VerticalSpace space='medium' />

        <text>Stats are tracked and stored locally.</text>

      </div>
    )
  }

}