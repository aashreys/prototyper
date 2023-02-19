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
      () => {console.log('Cleared stats')}
    )
  }

  private static calculateSeconds(framesDuped: number, statesChanged: number, interactionsCreated: number) {
    let time = framesDuped * 4
    time = time + statesChanged * 8
    time = time + interactionsCreated * 10

    /* Add 15% to 30% to time estimate to simulate time lost to human error and variance */
    let errorVariance = Math.random() * (0.30 - 0.15) + 0.15
    time = time + time * errorVariance
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