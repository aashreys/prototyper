import assert from 'node:assert/strict'
import test from 'node:test'
import { AnimationDirection, AnimationEasing, AnimationType } from '../src/animation'
import { Device } from '../src/device'
import { NavScheme, NavigationKeycodes } from '../src/navigation'
import { Utils } from '../src/utils'

function createFrame(id: string, reactions: any[] = []) {
  return {
    id: id,
    reactions: reactions,
    setReactionsAsync: async function(nextReactions: any[]) {
      this.reactions = nextReactions
    }
  } as any
}

function createConfig() {
  return {
    activeNavigation: {
      device: Device.PS4,
      scheme: NavScheme.DPAD_AND_LEFT_STICK,
      customKeycodes: new NavigationKeycodes()
    },
    animation: {
      type: AnimationType.INSTANT,
      isAutoDirection: false,
      direction: AnimationDirection.LEFT,
      isMatchLayers: false,
      easing: AnimationEasing.LINEAR,
      duration: 0
    }
  }
}

function createUnrelatedReaction() {
  return {
    actions: [{
      type: 'NODE',
      destinationId: 'external',
      navigation: 'NAVIGATE',
      transition: null,
      preserveScrollPosition: false
    }],
    trigger: {
      type: 'ON_KEY_DOWN',
      device: Device.PS4,
      keyCodes: [999]
    }
  }
}

function withMutedConsole<T>(method: 'log', callback: () => T): T {
  let original = console[method]
  console[method] = (() => undefined) as any
  try {
    let result = callback()
    if (result && typeof (result as any).finally === 'function') {
      return (result as Promise<unknown>).finally(() => {
        console[method] = original
      }) as T
    }
    console[method] = original
    return result
  } catch (error) {
    console[method] = original
    throw error
  }
}

test('creates distinct reactions for multi-input mappings', async () => {
  let source = createFrame('source')
  let destination = createFrame('right')

  let interactions = await Utils.addInteractions(
    source,
    undefined as any,
    destination,
    undefined as any,
    undefined as any,
    createConfig() as any
  )

  let signatures = source.reactions.map(reaction => [
    reaction.actions[0].destinationId,
    reaction.trigger.keyCodes.join(',')
  ].join(':'))

  assert.equal(interactions, 2)
  assert.equal(source.reactions.length, 2)
  assert.equal(new Set(signatures).size, source.reactions.length)
})

test('skips exact duplicate generated reactions and preserves unrelated reactions', async () => {
  let unrelatedReaction = createUnrelatedReaction()
  let source = createFrame('source', [unrelatedReaction])
  let destination = createFrame('right')
  let config = createConfig()

  let firstRun = await Utils.addInteractions(
    source,
    undefined as any,
    destination,
    undefined as any,
    undefined as any,
    config as any
  )

  await withMutedConsole('log', async () => {
    let secondRun = await Utils.addInteractions(
      source,
      undefined as any,
      destination,
      undefined as any,
      undefined as any,
      config as any
    )

    assert.equal(secondRun, 0)
  })

  assert.equal(firstRun, 2)
  assert.equal(source.reactions.length, 3)
  assert.deepEqual(source.reactions[0], unrelatedReaction)
})
