import { Button, Columns, Container, MiddleAlign, Text, VerticalSpace } from "@create-figma-plugin/ui";
import { Component, h } from "preact";
import styles from "../styles.css";

export class OnboardingBanner extends Component {

  render() {
    return (
      <div class={styles.onboardingContainer}>
        <Columns>
          <MiddleAlign>
            <Text>Welcome to Prototyper! Watch a quick video to get started.</Text>
          </MiddleAlign>
          <MiddleAlign>
            <Button onClick={this.openVideo}>▶</Button>
          </MiddleAlign>
        </Columns>
        <div  />  
        <button 
        style='margin-top: 4px;'
        class={styles.linkButton} 
        onClick={this.dismiss}>
          Dismiss
        </button>
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