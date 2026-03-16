// Idle Slime — main entry point
import './styles/global.css'
import { initState, getState } from './game/state'
import { computeTotalProduction } from './game/economy'
import { formatNumber } from './game/slimes'
import { showNotif } from './ui/components/notif'
import { loadGame } from './game/save'
import { startGameLoop, onBreedComplete } from './game/tick'
import { registerScreen, navigateTo } from './ui/router'
import { buildMainScreen } from './ui/screens/main-screen'
import { buildUpgradesScreen } from './ui/screens/upgrades-screen'
import { buildBreedLabScreen } from './ui/screens/breed-lab-screen'
import { buildSlimepediaScreen } from './ui/screens/slimepedia-screen'
import { buildZoneMapScreen } from './ui/screens/zone-map-screen'
import { buildSettingsScreen } from './ui/screens/settings-screen'
import { initSlimePanel } from './ui/components/slime-panel'
import { initFloatingNumbers } from './ui/components/floating-numbers'
import { initNotifBanner } from './ui/components/notif'
import { initFanfare } from './ui/fanfare'
import { showFanfare } from './ui/fanfare'
import { getSlime } from './game/slimes'

// ---- Bootstrap ----

const app = document.getElementById('app')!

// Load saved game
const savedState = loadGame()
initState(savedState)

// Apply accessibility settings
if (savedState.reduceMotion) document.body.classList.add('reduce-motion')
if (savedState.highContrast) document.body.classList.add('high-contrast')
if (savedState.largeText) document.body.classList.add('large-text')

// ---- Build Screens ----

function makeScreen(id: string): HTMLElement {
  const el = document.createElement('div')
  el.className = 'screen'
  el.id = `screen-${id}`
  app.appendChild(el)
  return el
}

const mainEl = makeScreen('main')
const slimepediaEl = makeScreen('slimepedia')
const breedLabEl = makeScreen('breed-lab')
const upgradesEl = makeScreen('upgrades')
const zoneMapEl = makeScreen('zone-map')
const settingsEl = makeScreen('settings')

// Register screens
registerScreen('main', mainEl)
registerScreen('slimepedia', slimepediaEl)
registerScreen('breed-lab', breedLabEl)
registerScreen('upgrades', upgradesEl)
registerScreen('zone-map', zoneMapEl)
registerScreen('settings', settingsEl)

// Build screen content
buildMainScreen(mainEl)
buildUpgradesScreen(upgradesEl)
buildBreedLabScreen(breedLabEl)
buildSlimepediaScreen(slimepediaEl)
buildZoneMapScreen(zoneMapEl)
buildSettingsScreen(settingsEl)

// ---- Global Overlays (mounted on #app, above all screens) ----

initSlimePanel(app)
initFloatingNumbers(app)
initNotifBanner(app)
initFanfare(app)

// ---- Activate Main Screen ----

mainEl.classList.add('active')

// ---- Start Game Loop ----

onBreedComplete((resultIds) => {
  for (const id of resultIds) {
    const def = getSlime(id)
    if (def && id !== '513') {
      // Breed complete notification is handled in collect step
    }
  }
})

startGameLoop()

// ---- Offline Earnings Notification ----

const offlineSec = (Date.now() - savedState.lastSaveTime) / 1000
if (offlineSec > 60) {
  const earned = computeTotalProduction(savedState) * Math.min(offlineSec, 8 * 3600)
  if (earned > 0) {
    setTimeout(() => {
      showNotif(`💤 Welcome back! +${formatNumber(earned)} 💧 earned offline`)
    }, 500)
  }
}
