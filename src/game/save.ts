import type { GameState, OwnedSlime, BreedSlot, ZoneId } from './types'
import { createNewGame, replaceState } from './state'
import { computeTotalProduction } from './economy'
import { OFFLINE_CAP_HOURS } from '../data/config'

const SAVE_KEY = 'idle-slime-save'
const GAME_VERSION = '0.1.0'

interface SaveData {
  version: string
  savedAt: number
  state: SerializedState
}

// Maps and complex types need explicit serialization
interface SerializedState extends Omit<GameState, 'breedSlots' | 'unlockedZones'> {
  unlockedZones: number[]
  breedSlots: BreedSlot[]
}

// Set to true before calling location.reload() after a delete so that the
// beforeunload / visibilitychange handlers don't re-write the save we just removed.
let _skipNextSave = false
export function markSaveDeleted(): void {
  _skipNextSave = true
}

export function saveGame(state: GameState): void {
  if (_skipNextSave) return
  try {
    const save: SaveData = {
      version: GAME_VERSION,
      savedAt: Date.now(),
      state: {
        ...state,
        unlockedZones: state.unlockedZones,
        breedSlots: state.breedSlots,
      },
    }
    const json = JSON.stringify(save)
    localStorage.setItem(SAVE_KEY, json)
  } catch (e) {
    console.error('Save failed:', e)
  }
}

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return createNewGame()

    const save: SaveData = JSON.parse(raw)
    if (!save.state) return createNewGame()

    const state: GameState = {
      ...createNewGame(),
      ...save.state,
      unlockedZones: (save.state.unlockedZones ?? [1]) as ZoneId[],
      breedSlots: (save.state.breedSlots ?? createNewGame().breedSlots) as GameState['breedSlots'],
    }

    // Offline production
    const offlineSecs = Math.min(
      (Date.now() - save.savedAt) / 1000,
      OFFLINE_CAP_HOURS * 3600
    )
    if (offlineSecs > 0) {
      const offlineGoo = computeTotalProduction(state) * offlineSecs
      state.goo += offlineGoo
      state._offlineGooEarned = offlineGoo  // shown in UI notification
    }

    return state
  } catch (e) {
    console.error('Load failed, starting fresh:', e)
    return createNewGame()
  }
}

export function exportSave(): string {
  return localStorage.getItem(SAVE_KEY) ?? ''
}

export function importSave(data: string): boolean {
  try {
    const save: SaveData = JSON.parse(data)
    if (!save.state || !save.version) return false
    localStorage.setItem(SAVE_KEY, data)
    const state = loadGame()
    replaceState(state)
    return true
  } catch {
    return false
  }
}

export function deleteSave(): void {
  markSaveDeleted()
  localStorage.removeItem(SAVE_KEY)
}

// Extend GameState for offline notification
declare module './types' {
  interface GameState {
    _offlineGooEarned?: number
  }
}
