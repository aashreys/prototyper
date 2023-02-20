export class Stats {

  static STATS_KEY = 'com.aashreys.prototyper.stats'

  public static getStats(): Promise<StatsModel> {
    return new Promise<StatsModel> (
      (resolve) => {
        figma.clientStorage.getAsync(Stats.STATS_KEY).then(
          (stats) => {
            console.log(stats)
            if (stats) resolve(stats)
            else resolve({
              secondsSaved: 0,
              prototypesCreated: 0,
              framesDuped: 0,
              statesChanged: 0,
              interactionsCreated: 0
            })
          },
          (e) => {
            console.error('Failed to get stats')
            console.error(e)
          }
        )
      }
    )
  }

  public static addStats(prototypesCreated: number, framesDuped: number, statesChanged: number, interactionsCreated: number): Promise<StatsModel> {
    return new Promise<StatsModel> (
      (resolve) => {
        this.getStats().then(
          (currentStats) => {
            let newStats: StatsModel = {
              secondsSaved: currentStats.secondsSaved + this.calculateSeconds(framesDuped, statesChanged, interactionsCreated),
              prototypesCreated: currentStats.prototypesCreated + prototypesCreated,
              framesDuped: currentStats.framesDuped + framesDuped,
              statesChanged: currentStats.statesChanged + statesChanged,
              interactionsCreated: currentStats.interactionsCreated + interactionsCreated
            }
            figma.clientStorage.setAsync(Stats.STATS_KEY, newStats).then(
              () => resolve(newStats),
              (e) => {
                console.error('Failed to update stats')
                console.error(e)
              }
            )
          }
        )
      }
    )
  }

  public static clearStats() {
    figma.clientStorage.deleteAsync(Stats.STATS_KEY).then(
      () => console.log('Cleared stats')
    )
  }

  private static calculateSeconds(framesDuped: number, statesChanged: number, interactionsCreated: number) {
    let time = framesDuped * 4
    time = time + statesChanged * 12
    time = time + interactionsCreated * 16

    /* Calculate complexity between 0 and 1 based on the number of prototype interactions with anything over 50 interactions being very complex. I realize I could make this logic infinitely more accurate by scaling complexity non-linearly, accounting for additional factores like the number of frames created or focus states changed and better modeling psuedo-random human behavior, but at some point you gotta ask, where does it end?
    JK... I will probably come back to this at some point and complicate it */
    let interactionLimit = 50
    let complexity = (interactionsCreated / interactionLimit) > 1 ? 1 : (interactionsCreated / interactionLimit)

    /* Depending on complexity, add a maximum of 30% to 50% time padding to simulate time lost of human error, variance and prototype testing */
    let variance = (Math.random() * (0.5 - 0.30) + 0.30) * complexity
    time = time + time * variance
    return time
  }
}

export interface StatsModel {

  readonly secondsSaved: number
  readonly prototypesCreated: number
  readonly framesDuped: number
  readonly statesChanged: number
  readonly interactionsCreated: number

}