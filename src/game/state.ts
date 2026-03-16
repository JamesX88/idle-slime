import type { GameState, BreedSlot, ZoneSecret } from './types'

function makeBreedSlots(): GameState['breedSlots'] {
  const makeSlot = (i: number): BreedSlot => ({
    slotIndex: i,
    status: i === 0 ? 'idle' : 'locked',
    parent1: null,
    parent2: null,
    startTime: null,
    cooldownMs: 45_000,
  })
  return [makeSlot(0), makeSlot(1), makeSlot(2), makeSlot(3)]
}

function makeZoneSecrets(): ZoneSecret[] {
  return [
    {
      zoneId: 1,
      resultSlimeId: '025',
      triggerType: 'TAP_N_TIMES',
      target: 100,
      progress: 0,
      completed: false,
      description: 'Tap the ancient oak',
    },
    {
      zoneId: 2,
      resultSlimeId: '050',
      triggerType: 'REACH_GOO_THRESHOLD',
      target: 10_000,
      progress: 0,
      completed: false,
      description: 'Accumulate 10,000 Goo while in Crystal Caves',
    },
    {
      zoneId: 3,
      resultSlimeId: '075',
      triggerType: 'TAP_N_TIMES',
      target: 60,
      progress: 0,
      completed: false,
      description: 'Survive without spending for 60 taps',
    },
    {
      zoneId: 4,
      resultSlimeId: '100',
      triggerType: 'HAVE_N_TYPE_SLIMES',
      target: 5,
      progress: 0,
      completed: false,
      description: 'Have 5 Ice-type slimes active simultaneously',
    },
    {
      zoneId: 5,
      resultSlimeId: '125',
      triggerType: 'BREED_COUNT',
      target: 10,
      progress: 0,
      completed: false,
      description: 'Complete 10 breeds while Zone 5 is active',
    },
    {
      zoneId: 6,
      resultSlimeId: '150',
      triggerType: 'TAP_N_TIMES',
      target: 1,
      progress: 0,
      completed: false,
      description: 'Unlock all 6 zones',
    },
  ]
}

export function createNewGame(): GameState {
  return {
    goo: 50,
    essence: 0,
    prismShards: 0,
    unlockedZones: [1],
    activeZone: 1,
    summonPity: {},
    collection: {},
    tapPowerLevel: 0,
    outputLevel: 0,
    discoveryLevel: 0,
    breedSlots: makeBreedSlots(),
    zoneSecrets: makeZoneSecrets(),
    totalBreeds: 0,
    totalDiscoveries: 0,
    lastSaveTime: Date.now(),
    firstPlayTime: Date.now(),
    soundEnabled: true,
    musicEnabled: true,
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    notificationsEnabled: true,
  }
}

// ---------------------------------------------------------------------------
// Reactive store — simple pub/sub, no framework needed
// ---------------------------------------------------------------------------

type Listener = () => void

let _state: GameState = createNewGame()
const _listeners = new Set<Listener>()

export function getState(): GameState {
  return _state
}

export function setState(updater: (s: GameState) => GameState | void): void {
  const result = updater(_state)
  if (result !== undefined) _state = result
  notify()
}

export function subscribe(fn: Listener): () => void {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}

function notify(): void {
  for (const fn of _listeners) fn()
}

export function replaceState(newState: GameState): void {
  _state = newState
  notify()
}
