import assert from 'node:assert/strict'
import test from 'node:test'
import { Device, Keycode } from '../src/device'
import { NavScheme, NavigationKeycodes } from '../src/navigation'

function keycodesFor(device: Device, scheme: NavScheme): NavigationKeycodes[] {
  return NavigationKeycodes.fromConfig({
    activeNavigation: {
      device: device,
      scheme: scheme,
      customKeycodes: new NavigationKeycodes()
    }
  } as any)
}

function serialize(keycodes: NavigationKeycodes[]) {
  return keycodes.map(value => ({
    left: value.left,
    right: value.right,
    up: value.up,
    down: value.down
  }))
}

test('controller dpad and left stick mappings keep numeric parity', () => {
  let xbox = serialize(keycodesFor(Device.XBOX, NavScheme.DPAD_AND_LEFT_STICK))
  let ps4 = serialize(keycodesFor(Device.PS4, NavScheme.DPAD_AND_LEFT_STICK))
  let switchPro = serialize(keycodesFor(Device.SWITCH_PRO, NavScheme.DPAD_AND_LEFT_STICK))

  assert.deepEqual(xbox, [
    {
      left: [Keycode.XBX_DPAD_LEFT],
      right: [Keycode.XBX_DPAD_RIGHT],
      up: [Keycode.XBX_DPAD_UP],
      down: [Keycode.XBX_DPAD_DOWN]
    },
    {
      left: [Keycode.XBX_LS_LEFT],
      right: [Keycode.XBX_LS_RIGHT],
      up: [Keycode.XBX_LS_UP],
      down: [Keycode.XBX_LS_DOWN]
    }
  ])
  assert.deepEqual(ps4, [
    {
      left: [Keycode.PS4_DPAD_LEFT],
      right: [Keycode.PS4_DPAD_RIGHT],
      up: [Keycode.PS4_DPAD_UP],
      down: [Keycode.PS4_DPAD_DOWN]
    },
    {
      left: [Keycode.PS4_LS_LEFT],
      right: [Keycode.PS4_LS_RIGHT],
      up: [Keycode.PS4_LS_UP],
      down: [Keycode.PS4_LS_DOWN]
    }
  ])
  assert.deepEqual(switchPro, [
    {
      left: [Keycode.SWITCH_DPAD_LEFT],
      right: [Keycode.SWITCH_DPAD_RIGHT],
      up: [Keycode.SWITCH_DPAD_UP],
      down: [Keycode.SWITCH_DPAD_DOWN]
    },
    {
      left: [Keycode.SWITCH_LS_LEFT],
      right: [Keycode.SWITCH_LS_RIGHT],
      up: [Keycode.SWITCH_LS_UP],
      down: [Keycode.SWITCH_LS_DOWN]
    }
  ])
})

test('keyboard schemes map expected directional keys', () => {
  assert.deepEqual(serialize(keycodesFor(Device.KEYBOARD, NavScheme.ARROW_KEYS)), [
    {
      left: [Keycode.KBD_ARROW_LEFT],
      right: [Keycode.KBD_ARROW_RIGHT],
      up: [Keycode.KBD_ARROW_UP],
      down: [Keycode.KBD_ARROW_DOWN]
    }
  ])

  assert.deepEqual(serialize(keycodesFor(Device.KEYBOARD, NavScheme.TAB)), [
    {
      left: [Keycode.KBD_SHIFT, Keycode.KBD_TAB],
      right: [Keycode.KBD_TAB],
      up: [],
      down: []
    }
  ])
})

test('custom navigation returns the configured keycodes unchanged', () => {
  let custom = new NavigationKeycodes([1], [2, 3], [], [4])

  let result = NavigationKeycodes.fromConfig({
    activeNavigation: {
      device: Device.KEYBOARD,
      scheme: NavScheme.CUSTOM,
      customKeycodes: custom
    }
  } as any)

  assert.deepEqual(result, [custom])
})
