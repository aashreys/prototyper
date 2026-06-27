import { Navigable, Neighbors } from "./core/nearest_neighbor";

type DebugReportPayload = {
  kind: string
  version: number
  createdAt: string
  updatedAt: string
  events: Array<Record<string, any>>
  [key: string]: any
}

export class DebugReport {

  private static latestReport: DebugReportPayload

  static start(payload: Record<string, any>) {
    const timestamp = new Date().toISOString()
    DebugReport.latestReport = {
      kind: 'prototyper-debug-report',
      version: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...payload,
      events: []
    }
  }

  static update(payload: Record<string, any>) {
    const report = DebugReport.ensureReport()
    Object.assign(report, payload)
    report.updatedAt = new Date().toISOString()
  }

  static addEvent(event: Record<string, any>) {
    const report = DebugReport.ensureReport()
    report.events.push({
      timestamp: new Date().toISOString(),
      ...event
    })
    report.updatedAt = new Date().toISOString()
  }

  static getLatestReport(): string {
    if (!DebugReport.latestReport) {
      return JSON.stringify({
        kind: 'prototyper-debug-report',
        version: 1,
        createdAt: new Date().toISOString(),
        message: 'No debug report captured yet. Run Generate or Link first.'
      }, null, 2)
    }
    return JSON.stringify(DebugReport.latestReport, null, 2)
  }

  static getNodeRef(node): Record<string, any> {
    if (!node) return null
    return {
      id: node.id,
      name: node.name,
      type: node.type
    }
  }

  static getNavigableBounds(nav: Navigable): Record<string, number> {
    return {
      x: nav.getX(),
      y: nav.getY(),
      width: nav.getWidth(),
      height: nav.getHeight(),
      centerX: nav.getX() + nav.getWidth() / 2,
      centerY: nav.getY() + nav.getHeight() / 2
    }
  }

  static getNeighborRefs<T>(neighbors: Neighbors<T>, getRef: (neighbor: T) => Record<string, any>): Record<string, any> {
    return {
      left: neighbors?.left ? getRef(neighbors.left) : null,
      right: neighbors?.right ? getRef(neighbors.right) : null,
      top: neighbors?.top ? getRef(neighbors.top) : null,
      bottom: neighbors?.bottom ? getRef(neighbors.bottom) : null
    }
  }

  static summarizeReaction(reaction: Reaction): Record<string, any> {
    return {
      trigger: DebugReport.summarizeTrigger((reaction as any).trigger),
      actions: ((reaction as any).actions || []).map(action => DebugReport.summarizeReactionAction(action))
    }
  }

  static summarizeError(error): Record<string, any> {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }
    return {
      type: typeof error,
      message: String(error)
    }
  }

  private static ensureReport(): DebugReportPayload {
    if (!DebugReport.latestReport) {
      DebugReport.start({
        mode: 'UNKNOWN'
      })
    }
    return DebugReport.latestReport
  }

  private static summarizeTrigger(trigger): Record<string, any> {
    if (!trigger) return null
    return {
      type: trigger.type,
      device: trigger.device,
      keyCodes: trigger.keyCodes
    }
  }

  private static summarizeReactionAction(action): Record<string, any> {
    if (!action) return null
    return {
      type: action.type,
      destinationId: action.destinationId,
      navigation: action.navigation,
      transition: action.transition,
      preserveScrollPosition: action.preserveScrollPosition
    }
  }

}
