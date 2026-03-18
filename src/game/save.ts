// Save/load system — localStorage with offline production calculation
import type { GameState } from './state'
import { createNewGame } from './state'
import { computeTotalProduction } from './economy'
import { SAVE_KEY, GAME_VERSION, OFFLINE_CAP_HOURS } from '../data/config'

// ---- Schema version — bump this whenever the save shape changes ----
// v2 → v3: replaced individual special booleans with unlockedSpecials Set;
//           grouped settings into a settings sub-object.
const SCHEMA_VERSION = 3

// Old save keys from previous codebase versions — always wipe these
const LEGACY_KEYS = [
  'idle-slime-save',   // same key, but old schema
  'idleSlimeSave',
  'idle_slime_save',
  'slime-save',
]

let _skipNextSave = false

// ---- Wipe any legacy / corrupt saves ----
export function wipeLegacySaves(): void {
  for (const key of LEGACY_KEYS) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      // If it parses but has no schemaVersion or wrong version, it's old — nuke it
      const parsed = JSON.parse(raw)
      if (!parsed?.schemaVersion || parsed.schemaVersion < SCHEMA_VERSION) {
        localStorage.removeItem(key)
        console.info(`[save] Wiped legacy save at key "${key}"`)
      }
    } catch {
      localStorage.removeItem(key)
    }
  }
}

export function saveGame(state: GameState): void {
  if (_skipNextSave) {
    _skipNextSave = false
    return
  }
  try {
    const save = {
      schemaVersion: SCHEMA_VERSION,
      version: GAME_VERSION,
      savedAt: Date.now(),
      state: serializeState(state),
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(save))
  } catch (e) {
    console.warn('Save failed:', e)
  }
}

export function loadGame(): GameState {
  // First, wipe any incompatible legacy saves
  wipeLegacySaves()

  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return createNewGame()

    const save = JSON.parse(raw)

    // Schema version check — if missing or old, start fresh
    if (!save?.schemaVersion || save.schemaVersion < SCHEMA_VERSION) {
      console.info('[save] Incompatible schema version — starting new game')
      localStorage.removeItem(SAVE_KEY)
      return createNewGame()
    }

    if (!save?.state) return createNewGame()

    const state = deserializeState(save.state)

    // Validate the deserialized state has the minimum required shape
    if (!isValidState(state)) {
      console.warn('[save] State failed validation — starting new game')
      localStorage.removeItem(SAVE_KEY)
      return createNewGame()
    }

    // Offline production
    const offlineSec = Math.min(
      (Date.now() - (save.savedAt ?? Date.now())) / 1000,
      OFFLINE_CAP_HOURS * 3600
    )
    if (offlineSec > 5) {
      state.goo += computeTotalProduction(state) * offlineSec
    }

    state.lastSaveTime = Date.now()
    return state
  } catch (e) {
    console.warn('[save] Load failed, starting new game:', e)
    // Nuke the corrupt save so we never get stuck
    try { localStorage.removeItem(SAVE_KEY) } catch {}
    return createNewGame()
  }
}

export function deleteSave(): void {
  _skipNextSave = true
  // Wipe the current save key AND any legacy keys
  localStorage.removeItem(SAVE_KEY)
  for (const key of LEGACY_KEYS) {
    try { localStorage.removeItem(key) } catch {}
  }
}

export function exportSave(state: GameState): string {
  const save = {
    schemaVersion: SCHEMA_VERSION,
    version: GAME_VERSION,
    savedAt: Date.now(),
    state: serializeState(state),
  }
  return btoa(JSON.stringify(save))
}

export function importSave(encoded: string): GameState | null {
  try {
    const save = JSON.parse(atob(encoded))
    if (!save?.state) return null
    const state = deserializeState(save.state)
    if (!isValidState(state)) return null
    return state
  } catch {
    return null
  }
}

// ---- Validation ----

function isValidState(state: any): state is GameState {
  if (!state || typeof state !== 'object') return false
  if (typeof state.goo !== 'number') return false
  if (typeof state.essence !== 'number') return false
  if (!Array.isArray(state.unlockedZones)) return false
  if (!state.collection || typeof state.collection !== 'object') return false
  if (!Array.isArray(state.breedSlots)) return false
  if (typeof state.tapPowerLevel !== 'number') return false
  if (typeof state.outputLevel !== 'number') return false
  if (typeof state.discoveryLevel !== 'number') return false
  return true
}

// ---- Serialization ----

function serializeState(state: GameState): object {
  return {
    ...state,
    // Convert Set → Array for JSON serialization
    unlockedSpecials: Array.from(state.unlockedSpecials),
    // settings is a plain object — spreads cleanly
  }
}

function deserializeState(raw: any): GameState {
  const defaults = createNewGame()

  // Migrate v2 individual boolean flags → unlockedSpecials Set
  const migratedSpecials = new Set<string>(
    Array.isArray(raw.unlockedSpecials) ? raw.unlockedSpecials : []
  )
  if (raw.glitchSlimeUnlocked)      migratedSpecials.add('515')
  if (raw.oversizedSlimeUnlocked)   migratedSpecials.add('517')
  if (raw.miniatureSlimeUnlocked)   migratedSpecials.add('518')
  if (raw.slimeKingUnlocked)        migratedSpecials.add('522')
  if (raw.slimeQueenUnlocked)       migratedSpecials.add('523')
  if (raw.ancientSlimeUnlocked)     migratedSpecials.add('524')
  if (raw.cosmicJesterUnlocked)     migratedSpecials.add('525')
  if (raw.primordialGooUnlocked)    migratedSpecials.add('526')
  if (raw.trueFormUnlocked)         migratedSpecials.add('527')

  // Migrate flat settings fields → settings sub-object
  const migratedSettings = {
    sfxEnabled:   raw.settings?.sfxEnabled   ?? raw.sfxEnabled   ?? true,
    musicEnabled: raw.settings?.musicEnabled ?? raw.musicEnabled ?? false,
    reduceMotion: raw.settings?.reduceMotion ?? raw.reduceMotion ?? false,
    highContrast: raw.settings?.highContrast ?? raw.highContrast ?? false,
    largeText:    raw.settings?.largeText    ?? raw.largeText    ?? false,
  }

  const state: GameState = {
    ...defaults,
    ...raw,
    // Ensure arrays/objects are correct types
    unlockedZones: Array.isArray(raw.unlockedZones) ? raw.unlockedZones : [1],
    collection: (raw.collection && typeof raw.collection === 'object' && !Array.isArray(raw.collection))
      ? raw.collection
      : {},
    breedSlots: Array.isArray(raw.breedSlots) ? raw.breedSlots : defaults.breedSlots,
    summonsSinceNew: (raw.summonsSinceNew && typeof raw.summonsSinceNew === 'object')
      ? raw.summonsSinceNew
      : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    zoneDiscoveries: (raw.zoneDiscoveries && typeof raw.zoneDiscoveries === 'object')
      ? raw.zoneDiscoveries
      : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    // Numeric fields — fall back to defaults if wrong type
    goo:           typeof raw.goo           === 'number' ? raw.goo           : defaults.goo,
    essence:       typeof raw.essence       === 'number' ? raw.essence       : defaults.essence,
    prismShards:   typeof raw.prismShards   === 'number' ? raw.prismShards   : defaults.prismShards,
    tapPowerLevel: typeof raw.tapPowerLevel === 'number' ? raw.tapPowerLevel : defaults.tapPowerLevel,
    outputLevel:   typeof raw.outputLevel   === 'number' ? raw.outputLevel   : defaults.outputLevel,
    discoveryLevel:typeof raw.discoveryLevel=== 'number' ? raw.discoveryLevel: defaults.discoveryLevel,
    activeZone:    typeof raw.activeZone    === 'number' ? raw.activeZone    : defaults.activeZone,
    // Migrated fields
    unlockedSpecials: migratedSpecials,
    settings: migratedSettings,
    autoBreed: {
      enabled:     raw.autoBreed?.enabled     ?? false,
      maxRarity:   raw.autoBreed?.maxRarity   ?? null,
      autoCollect: raw.autoBreed?.autoCollect ?? true,
    },
  }

  // Ensure breed slots have all required fields
  state.breedSlots = state.breedSlots.map((slot: any, i: number) => ({
    id: i,
    locked: slot.locked ?? (i > 0),
    parent1: slot.parent1 ?? null,
    parent2: slot.parent2 ?? null,
    startTime: slot.startTime ?? null,
    cooldownMs: slot.cooldownMs ?? 45000,
    resultId: slot.resultId ?? null,
  }))

  return state
}
