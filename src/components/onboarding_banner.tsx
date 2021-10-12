import { Inline, Stack, Text } from "@create-figma-plugin/ui";
import { Component, h } from "preact";
import styles from "../styles.css";

export class OnboardingBanner extends Component {

  render() {
    return (
      <div class={styles.onboardingContainer}>
        <Stack space='small'>
          <Text>Welcome to Prototyper! Watch a quick video to get started.</Text>
          <Inline>
            <button 
            style='margin-right: 8px'
            class={styles.linkButton} 
            onClick={this.openVideo}>
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

  openVideo() {
    window.open('https://www.youtube.com')
  }

  dismiss() {
    console.log('Dismiss')
  }

}