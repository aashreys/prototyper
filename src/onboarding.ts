export class Onboarding {

  static ONBOARDING_KEY = 'com.aashreys.prototyper.onboarding'
  static FOCUS_OPTIONS_TOOLTIP_KEY = 'com.aashreys.prototyper.onboarding.focusOptionsTooltip'

  static isCompleteAsync(): Promise<boolean | undefined> {
    return figma.clientStorage.getAsync(Onboarding.ONBOARDING_KEY)
  }

  static isFocusOptionsTooltipDismissedAsync(): Promise<boolean | undefined> {
    return figma.clientStorage.getAsync(Onboarding.FOCUS_OPTIONS_TOOLTIP_KEY)
  }

  static async getStatusAsync(): Promise<OnboardingStatus> {
    const [isComplete, isFocusOptionsTooltipDismissed] = await Promise.all([
      Onboarding.isCompleteAsync(),
      Onboarding.isFocusOptionsTooltipDismissedAsync()
    ])
    return {
      isComplete: isComplete === true,
      isFocusOptionsTooltipDismissed: isFocusOptionsTooltipDismissed === true
    }
  }

  static completed() {
    return figma.clientStorage.setAsync(Onboarding.ONBOARDING_KEY, true)
  }

  static focusOptionsTooltipDismissed() {
    return figma.clientStorage.setAsync(Onboarding.FOCUS_OPTIONS_TOOLTIP_KEY, true)
  }

  static clear() {
    figma.clientStorage.deleteAsync(Onboarding.ONBOARDING_KEY)
  }

  static clearFocusOptionsTooltip() {
    figma.clientStorage.deleteAsync(Onboarding.FOCUS_OPTIONS_TOOLTIP_KEY)
  }

}

export interface OnboardingStatus {
  readonly isComplete: boolean
  readonly isFocusOptionsTooltipDismissed: boolean
}

export function shouldShowFocusOptionsTooltip(status: OnboardingStatus): boolean {
  return status.isComplete === true && status.isFocusOptionsTooltipDismissed !== true
}
