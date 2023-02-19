import { Bold, Inline, Stack, Text, VerticalSpace } from "@create-figma-plugin/ui";
import { Component, h } from "preact";
import styles from "../styles.css";

export class OnboardingBanner extends Component<any, any> {

  constructor(props) {
    super(props)
    this.bindMethods()
  }

  bindMethods() {
    this.onWatchVideoClick = this.onWatchVideoClick.bind(this)
    this.dismiss = this.dismiss.bind(this)
  }

  render(props, state) {

    return (
      <div class={styles.onboardingContainer}>
        <Text><Bold>Welcome to Prototyper!</Bold></Text>
        <VerticalSpace space="small"/>
        <Text>Watch a short video to learn the basics and best practices.</Text>
        <VerticalSpace space="small"/>
        <Inline space='small'>
          <button 
          class={styles.linkButton} 
          onClick={this.onWatchVideoClick}>
            ▶ Watch Video
          </button>
          <button 
          class={styles.linkButton} 
          onClick={this.dismiss}>
            Dismiss
          </button>
        </Inline>
      </div>
    )
  }

  onWatchVideoClick() {
    this.dismiss()
    this.openVideo()
  }

  openVideo() {
    window.open('https://youtu.be/6KvnigBr6i4?t=1251')
  }

  dismiss() {
    this.props.onDismiss()
  }

}