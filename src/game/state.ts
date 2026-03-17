// Central game state — single source of truth
// Uses a simple pub/sub reactive store (no framework needed)

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic'
export type ZoneId = 1 | 2 | 3 | 4 | 5 | 6
export type SlimeId = string

export interface SlimeDefinition {
  id: SlimeId
  name: string
  rarity: Rarity
  discovery: 'Zone' | 'Breed' | 'Merge' | 'Special'
  zone: ZoneId | null
  parent1: SlimeId | null
  parent2: SlimeId | null
  element: string
  baseGooPerSec: number
  lore: string
  favoriteFood: string
  notes: string
  /** True for zone-secret slimes that should not appear in the normal summon pool. */
  isSecret: boolean
}

export interface OwnedSlime {
  id: SlimeId
  count: number
  level: number
  discoveredAt: number
  discoveryNumber: number
}

export interface BreedSlot {
  id: number
  locked: boolean
  parent1: SlimeId | null
  parent2: SlimeId | null
  startTime: number | null
  cooldownMs: number
  resultId: SlimeId | null  // set when breed completes, cleared on collect
}

/** Player-facing accessibility and audio settings, grouped for clarity. */
export interface GameSettings {
  sfxEnabled: boolean
  musicEnabled: boolean
  reduceMotion: boolean
  highContrast: boolean
  largeText: boolean
}

export interface GameState {
  // ---- Currencies ----
  goo: number
  essence: number
  prismShards: number

  // ---- Zones ----
  unlockedZones: ZoneId[]
  activeZone: ZoneId

  // ---- Collection — keyed by slime ID ----
  collection: Record<SlimeId, OwnedSlime>

  // ---- Upgrades ----
  tapPowerLevel: number
  outputLevel: number
  discoveryLevel: number

  // ---- Breed slots ----
  breedSlots: BreedSlot[]

  // ---- Tap tracking ----
  tapCount: number          // total taps ever
  tapsSinceSpend: number    // for Glitch Slime (999 taps without spending)
  consecutiveTapTarget: SlimeId | null  // for Curious Slime
  consecutiveTapCount: number

  // ---- Meta ----
  totalBreeds: number
  totalDiscoveries: number
  lastSaveTime: number
  firstPlayTime: number

  // ---- Pity system per zone ----
  summonsSinceNew: Record<ZoneId, number>
  /**
   * Multi-tier pity counters. Keyed by zone, then by rarity name.
   * Tracks how many summons have occurred without getting that rarity or higher.
   * Used by the new per-rarity pity system in zones.ts.
   */
  summonsSinceRarity: Record<number, Record<string, number>>
  /** Total summons performed per zone — used for zone-secret triggers. */
  totalSummonsByZone: Record<ZoneId, number>
  /** Merges performed per zone in the current session — used for Crystal Specter trigger. */
  sessionMergesByZone: Record<number, number>
  // ---- Zone summon counts (for tracking) ----
  zoneDiscoveries: Record<ZoneId, number>

  // ---- Special trigger tracking ----
  /**
   * Set of special slime IDs (513–527) that have been unlocked.
   * Replaces the previous individual boolean flags.
   * Serialized as a string[] in save data and reconstructed on load.
   */
  unlockedSpecials: Set<SlimeId>

  /**
   * Metadata needed by specific special triggers.
   * Kept as top-level fields because they are referenced by multiple systems.
   */
  maxLevelEverReached: boolean
  maxLevelSlimeId: SlimeId | null
  maxLevelReachedAt: number | null

  // ---- Settings ----
  settings: GameSettings
}

// ---- Reactive Store ----

let _state: GameState
const _subscribers: Set<() => void> = new Set()

export function initState(initial: GameState): void {
  _state = initial
}

export function getState(): GameState {
  return _state
}

export function setState(updater: (s: GameState) => void): void {
  updater(_state)
  notify()
}

export function subscribe(fn: () => void): () => void {
  _subscribers.add(fn)
  return () => _subscribers.delete(fn)
}

function notify(): void {
  for (const fn of _subscribers) {
    try { fn() } catch (e) { console.error('Subscriber error:', e) }
  }
}

/** Batch multiple state mutations into a single notification. */
export function batch(fn: () => void): void {
  fn()
  notify()
}

// ---- Default State ----

export function createNewGame(): GameState {
  return {
    goo: 0,
    essence: 0,
    prismShards: 0,
    unlockedZones: [1],
    activeZone: 1,
    collection: {},
    tapPowerLevel: 0,
    outputLevel: 0,
    discoveryLevel: 0,
    breedSlots: [
      { id: 0, locked: false, parent1: null, parent2: null, startTime: null, cooldownMs: 45000, resultId: null },
      { id: 1, locked: true,  parent1: null, parent2: null, startTime: null, cooldownMs: 45000, resultId: null },
      { id: 2, locked: true,  parent1: null, parent2: null, startTime: null, cooldownMs: 45000, resultId: null },
      { id: 3, locked: true,  parent1: null, parent2: null, startTime: null, cooldownMs: 45000, resultId: null },
    ],
    tapCount: 0,
    tapsSinceSpend: 0,
    consecutiveTapTarget: null,
    consecutiveTapCount: 0,
    totalBreeds: 0,
    totalDiscoveries: 0,
    lastSaveTime: Date.now(),
    firstPlayTime: Date.now(),
    summonsSinceNew: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    summonsSinceRarity: { 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} },
    totalSummonsByZone: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    sessionMergesByZone: {},
    zoneDiscoveries: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    unlockedSpecials: new Set(),
    maxLevelEverReached: false,
    maxLevelSlimeId: null,
    maxLevelReachedAt: null,
    settings: {
      sfxEnabled: true,
      musicEnabled: false,
      reduceMotion: false,
      highContrast: false,
      largeText: false,
    },
  }
}
