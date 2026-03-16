// Game loop — production tick + UI tick
import { getState, setState } from './state'
import { computeTotalProduction } from './economy'
import { tickBreeds } from './breeds'
import { checkTimeSpecials } from './zones'
import { saveGame } from './save'

const PRODUCTION_INTERVAL_MS = 100
const SAVE_INTERVAL_MS = 30_000
const SPECIAL_CHECK_INTERVAL_MS = 60_000

let _productionInterval: number | null = null
let _saveInterval: number | null = null
let _specialCheckInterval: number | null = null
let _lastProductionTime = Date.now()

// Callbacks for UI to hook into
type BreedCompleteCallback = (resultIds: string[]) => void
let _onBreedComplete: BreedCompleteCallback | null = null

export function onBreedComplete(cb: BreedCompleteCallback): void {
  _onBreedComplete = cb
}

export function startGameLoop(): void {
  stopGameLoop()

  _productionInterval = window.setInterval(() => {
    const now = Date.now()
    const dt = (now - _lastProductionTime) / 1000
    _lastProductionTime = now

    setState(state => {
      // Production tick
      const production = computeTotalProduction(state)
      state.goo += production * dt

      // Breed ticks
      const completed = tickBreeds(state)
      if (completed.length > 0 && _onBreedComplete) {
        _onBreedComplete(completed)
      }
    })
  }, PRODUCTION_INTERVAL_MS)

  _saveInterval = window.setInterval(() => {
    saveGame(getState())
  }, SAVE_INTERVAL_MS)

  _specialCheckInterval = window.setInterval(() => {
    setState(state => {
      checkTimeSpecials(state)
    })
  }, SPECIAL_CHECK_INTERVAL_MS)

  // Save on tab blur
  document.addEventListener('visibilitychange', _onVisibilityChange)
  window.addEventListener('beforeunload', _onBeforeUnload)
}

export function stopGameLoop(): void {
  if (_productionInterval !== null) {
    clearInterval(_productionInterval)
    _productionInterval = null
  }
  if (_saveInterval !== null) {
    clearInterval(_saveInterval)
    _saveInterval = null
  }
  if (_specialCheckInterval !== null) {
    clearInterval(_specialCheckInterval)
    _specialCheckInterval = null
  }
  document.removeEventListener('visibilitychange', _onVisibilityChange)
  window.removeEventListener('beforeunload', _onBeforeUnload)
}

function _onVisibilityChange(): void {
  if (document.visibilityState === 'hidden') {
    saveGame(getState())
  }
}

function _onBeforeUnload(): void {
  saveGame(getState())
}
