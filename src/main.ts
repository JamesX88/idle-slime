import './styles/global.css'
import { loadGame } from './game/save'
import { replaceState } from './game/state'
import { startProductionTick, startAutoSave } from './game/tick'
import { initRouter } from './ui/router'
import { initFanfare } from './ui/fanfare'
import { initSlimeDetailPanel } from './ui/components/slime-detail-panel'
import { saveGame } from './game/save'
import { getState } from './game/state'

// ---------------------------------------------------------------------------
// Boot sequence
// ---------------------------------------------------------------------------

function boot(): void {
  // 1. Load or create game state
  const state = loadGame()
  replaceState(state)

  // 2. Apply accessibility settings to DOM immediately
  const app = document.getElementById('app')!
  if (state.reduceMotion) app.classList.add('reduce-motion')
  if (state.highContrast) app.classList.add('high-contrast')
  if (state.largeText) app.classList.add('large-text')

  // 3. Init UI
  initRouter(app)
  initFanfare()
  initSlimeDetailPanel()

  // 4. Start game loops
  startProductionTick()
  startAutoSave()

  // 5. Save on page hide (tab switch, close)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      saveGame(getState())
    }
  })

  window.addEventListener('beforeunload', () => {
    saveGame(getState())
  })

  // 6. First-time new game: give the player their first Blob Slime free
  if (!state.collection['001'] && state.totalDiscoveries === 0) {
    import('./game/state').then(({ setState }) => {
      setState(s => {
        s.collection['001'] = {
          id: '001',
          count: 1,
          level: 1,
          discoveredAt: Date.now(),
          discoveryNumber: 1,
        }
        s.totalDiscoveries = 1
      })
    })
  }

  console.log('🟢 Idle Slime loaded.')
}

boot()
