import assert from 'node:assert/strict'
import test from 'node:test'
import { AnimationDirection, AnimationEasing, AnimationType } from '../src/animation'
import { Device, Keycode } from '../src/device'
import { NavScheme, NavigationKeycodes } from '../src/navigation'
import { Utils } from '../src/utils'

function createFrame(id: string, reactions: any[] = []) {
  return {
    id: id,
    reactions: reactions,
    writes: [] as any[],
    setReactionsAsync: async function(nextReactions: any[]) {
      this.writes.push(nextReactions)
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

function createNavigationReaction(destinationId: string, keyCodes: Array<number>) {
  return {
    actions: [{
      type: 'NODE',
      destinationId: destinationId,
      navigation: 'NAVIGATE',
      transition: null,
      preserveScrollPosition: false
    }],
    trigger: {
      type: 'ON_KEY_DOWN',
      device: Device.PS4,
      keyCodes: keyCodes
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
  assert.equal(source.writes.length, 1)
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

test('replaces stale generated reactions for managed keys', async () => {
  let unrelatedReaction = createUnrelatedReaction()
  let staleReaction = createNavigationReaction('old-right', [Keycode.PS4_DPAD_RIGHT])
  let source = createFrame('source', [unrelatedReaction, staleReaction])
  let destination = createFrame('new-right')

  await withMutedConsole('log', async () => {
    let interactions = await Utils.addInteractions(
      source,
      undefined as any,
      destination,
      undefined as any,
      undefined as any,
      createConfig() as any
    )

    assert.equal(interactions, 2)
  })

  let destinations = source.reactions.map(reaction => reaction.actions[0].destinationId)
  assert.equal(destinations.includes('old-right'), false)
  assert.equal(destinations.includes('external'), true)
  assert.equal(destinations.filter(destination => destination === 'new-right').length, 2)
})

test('replaces any conflicting same-device reaction for managed keys', async () => {
  let conflictingReaction = {
    actions: [{
      type: 'BACK'
    }],
    trigger: {
      type: 'ON_KEY_DOWN',
      device: Device.PS4,
      keyCodes: [Keycode.PS4_DPAD_RIGHT]
    }
  }
  let source = createFrame('source', [conflictingReaction])
  let destination = createFrame('new-right')

  await withMutedConsole('log', async () => {
    await Utils.addInteractions(
      source,
      undefined as any,
      destination,
      undefined as any,
      undefined as any,
      createConfig() as any
    )
  })

  assert.equal(source.reactions.some(reaction => reaction.actions[0].type === 'BACK'), false)
  assert.equal(source.reactions.filter(reaction => reaction.actions[0].destinationId === 'new-right').length, 2)
})

test('creates simple transition with spring preset as custom spring easing', () => {
  const transition = Utils.createTransition({
    type: AnimationType.SMART_ANIMATE,
    isAutoDirection: false,
    direction: AnimationDirection.LEFT,
    isMatchLayers: false,
    easing: AnimationEasing.BOUNCY,
    duration: 450
  })

  assert.deepEqual(transition, {
    type: AnimationType.SMART_ANIMATE,
    easing: {
      type: AnimationEasing.CUSTOM_SPRING,
      easingFunctionSpring: {
        mass: 1,
        stiffness: 1708.707,
        damping: 26.667
      }
    },
    duration: 0.45
  })
})

test('creates directional transition with spring preset as custom spring easing', () => {
  const transition = Utils.createTransition({
    type: AnimationType.PUSH,
    isAutoDirection: false,
    direction: AnimationDirection.RIGHT,
    isMatchLayers: true,
    easing: AnimationEasing.GENTLE,
    duration: 600
  })

  assert.deepEqual(transition, {
    type: AnimationType.PUSH,
    direction: AnimationDirection.RIGHT,
    matchLayers: true,
    easing: {
      type: AnimationEasing.CUSTOM_SPRING,
      easingFunctionSpring: {
        mass: 1,
        stiffness: 185.187,
        damping: 20
      }
    },
    duration: 0.6
  })
})

test('writes custom spring reactions in one pass', async () => {
  let source = createFrame('source')
  let destination = createFrame('right')
  let config = {
    ...createConfig(),
    animation: {
      type: AnimationType.SMART_ANIMATE,
      isAutoDirection: false,
      direction: AnimationDirection.LEFT,
      isMatchLayers: false,
      easing: AnimationEasing.GENTLE,
      duration: 100
    }
  }

  await Utils.addInteractions(
    source,
    undefined as any,
    destination,
    undefined as any,
    undefined as any,
    config as any
  )

  assert.equal(source.writes.length, 1)

  const finalTransition = source.writes[0][0].actions[0].transition
  assert.equal(finalTransition.duration, 0.1)
  assert.deepEqual(finalTransition.easing, {
    type: AnimationEasing.CUSTOM_SPRING,
    easingFunctionSpring: {
      mass: 1,
      stiffness: 6666.749,
      damping: 120
    }
  })
})
