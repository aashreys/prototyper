import { Component, Fragment, h } from "preact";
import styles from "../styles.css";

export class HelpWdiget extends Component<any, any> {

  container
  button

  state = {
    isMenuShown: false,
    isTooltipShown: false
  }

  constructor(props) {
    super(props)
    this.bindMethods()
  }

  private bindMethods() {
    this.handleOutsideClick = this.handleOutsideClick.bind(this)
    this.onButtonClick = this.onButtonClick.bind(this)
    this.showMenu = this.showMenu.bind(this)
    this.showTooltip = this.showTooltip.bind(this)
    this.onButtonMouseEnter = this.onButtonMouseEnter.bind(this)
    this.onButtonMouseLeave = this.onButtonMouseLeave.bind(this)
  }

  render(props, state) {
    return (
      <Fragment>
        {
          this.state.isMenuShown &&
          <div class={styles.verticalMenu}
            ref={(container) => (this.container = container)}>
              <p>Video Tutorials</p>
              <a href="https://youtu.be/6KvnigBr6i4?t=1251" target="_blank">Using Prototyper</a>
              <a href="https://youtu.be/6KvnigBr6i4" target="_blank">Game UI Navigation</a>
              <div class={styles.separator} />
              <a href="mailto:aashrey9sharma@gmail.com?subject=Prototyper: Report a problem" target="_blank">Report a problem</a>
          </div>
        }
        {
          this.state.isTooltipShown &&
          <div class={styles.tooltip}>Help and support</div>
        }
        <button
        class={styles.helpButton} 
        ref={(button) => (this.button = button)}
        onClick={this.onButtonClick}
        onMouseEnter={this.onButtonMouseEnter}
        onMouseLeave={this.onButtonMouseLeave}
        >?</button>
      </Fragment>
    )
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.state.isMenuShown) {
      document.addEventListener('mousedown', this.handleOutsideClick, false)
    }
    else {
      document.removeEventListener('mousedown', this.handleOutsideClick, false);
    }
  }

  handleOutsideClick = (e) => {
    if (e.target !== this.button && !this.container?.contains(e.target)) {
      this.showMenu(false);
    }
  }

  private onButtonClick() {
    let isMenuShown = this.state.isMenuShown;
    this.showMenu(!isMenuShown);
    this.showTooltip(isMenuShown);
  }

  private showMenu(isShown) {
    this.setState((prevState) => ({
      isMenuShown: isShown,
      isTooltipShown: prevState.isTooltipShown
    }))
  }

  private showTooltip(isShown) {
    this.setState((prevState) => ({
      isMenuShown: prevState.isMenuShown,
      isTooltipShown: isShown
    }))
  }

  private onButtonMouseEnter() {
    if (!this.state.isMenuShown) {
      this.showTooltip(true);
    }
  }

  private onButtonMouseLeave() {
    this.showTooltip(false);
  }
}