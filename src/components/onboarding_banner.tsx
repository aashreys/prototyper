import { Inline, Stack, Text, VerticalSpace } from "@create-figma-plugin/ui";
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
        <Stack>
          <Text bold>Welcome to Prototyper!</Text>
          <Text>Watch a short video to learn the basics and best practices.</Text>
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
        </Stack> 
      </div>
    )
  }

  onWatchVideoClick() {
    this.dismiss()
    this.openVideo()
  }

  openVideo() {
    window.open('https://www.youtube.com/watch?v=yqkr5FtuSKA')
  }

  dismiss() {
    this.props.onDismiss()
  }

}