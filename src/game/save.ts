// Save/load system — localStorage with offline production calculation
import type { GameState, ZoneId } from './state'
import { createNewGame } from './state'
import { computeTotalProduction } from './economy'
import { SAVE_KEY, GAME_VERSION, OFFLINE_CAP_HOURS } from '../data/config'

let _skipNextSave = false

export function saveGame(state: GameState): void {
  if (_skipNextSave) {
    _skipNextSave = false
    return
  }
  try {
    const save = {
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
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return createNewGame()

    const save = JSON.parse(raw)
    if (!save?.state) return createNewGame()

    const state = deserializeState(save.state)

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
    console.warn('Load failed, starting new game:', e)
    return createNewGame()
  }
}

export function deleteSave(): void {
  _skipNextSave = true
  localStorage.removeItem(SAVE_KEY)
}

export function exportSave(state: GameState): string {
  const save = {
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
    return deserializeState(save.state)
  } catch {
    return null
  }
}

// ---- Serialization ----
// We serialize to plain JSON — Maps/Sets become arrays

function serializeState(state: GameState): object {
  return {
    ...state,
    unlockedZones: state.unlockedZones,
    collection: state.collection,
    breedSlots: state.breedSlots,
  }
}

function deserializeState(raw: any): GameState {
  const defaults = createNewGame()

  const state: GameState = {
    ...defaults,
    ...raw,
    // Ensure arrays/objects are correct types
    unlockedZones: Array.isArray(raw.unlockedZones) ? raw.unlockedZones : [1],
    collection: raw.collection && typeof raw.collection === 'object' ? raw.collection : {},
    breedSlots: Array.isArray(raw.breedSlots) ? raw.breedSlots : defaults.breedSlots,
    summonsSinceNew: raw.summonsSinceNew ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    zoneDiscoveries: raw.zoneDiscoveries ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
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
