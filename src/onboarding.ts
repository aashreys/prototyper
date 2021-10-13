export class Onboarding {

  static ONBOARDING_KEY = 'onboarding'

  static isCompleteAsync(): Promise<boolean | undefined> {
    return figma.clientStorage.getAsync(Onboarding.ONBOARDING_KEY)
  }

  static completed() {
    figma.clientStorage.setAsync(Onboarding.ONBOARDING_KEY, true)
  }

}