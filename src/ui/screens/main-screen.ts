// Main game screen — tap blob, slime grid, currency bar, bottom nav
import { getState, setState, subscribe } from '../../game/state'
import { getSlime, rarityColor, slimeEmoji, formatNumber, sortByRarity } from '../../game/slimes'
import { computeTotalProduction, getGooPerTap } from '../../game/economy'
import { performSummon } from '../../game/zones'
import { checkTapSpecials } from '../../game/zones'
import { SUMMON_COST, ZONE_NAMES, ZONE_THEMES } from '../../data/config'
import { navigateTo } from '../router'
import { openSlimePanel, refreshPanel } from '../components/slime-panel'
import { spawnFloatingNumber } from '../components/floating-numbers'
import { showFanfare } from '../fanfare'
import { showNotif } from '../components/notif'

export function buildMainScreen(container: HTMLElement): void {
  container.innerHTML = `
    <div class="topbar">
      <div class="topbar__zone" id="zone-name">Gooey Meadow</div>
      <div class="topbar__progress" id="pedia-progress">0/527 🔬</div>
      <button class="topbar__settings" id="settings-btn" aria-label="Settings">⚙️</button>
    </div>

    <div class="currency-bar">
      <div class="currency-item">
        <span class="currency-item__icon">💧</span>
        <span class="currency-item__value" id="goo-display">0</span>
        <span class="currency-item__label">Goo</span>
      </div>
      <div class="currency-item">
        <span class="currency-item__icon">✨</span>
        <span class="currency-item__value" id="essence-display">0</span>
        <span class="currency-item__label">Essence</span>
      </div>
      <div class="currency-item">
        <span class="currency-item__icon">💎</span>
        <span class="currency-item__value" id="shards-display">0</span>
        <span class="currency-item__label">Shards</span>
      </div>
    </div>

    <div id="slime-grid" class="slime-grid"></div>

    <div class="production-bar">
      <span>Total:</span>
      <span class="production-bar__value" id="production-display">0</span>
      <span>💧/sec</span>
    </div>

    <div class="tap-area" id="tap-area">
      <div class="tap-blob" id="tap-blob" role="button" aria-label="Tap to generate Goo">🟢</div>
    </div>

    <nav class="bottom-nav">
      <button class="nav-tab" id="nav-pedia" aria-label="Slimepedia">
        <span class="nav-tab__icon">📖</span>
        <span class="nav-tab__label">Slimepedia</span>
      </button>
      <button class="nav-tab" id="nav-breed" aria-label="Breed Lab">
        <span class="nav-tab__icon">🧪</span>
        <span class="nav-tab__label">Breed Lab</span>
      </button>
      <button class="nav-tab" id="nav-upgrades" aria-label="Upgrades">
        <span class="nav-tab__icon">⬆️</span>
        <span class="nav-tab__label">Upgrades</span>
      </button>
      <button class="nav-tab" id="nav-zones" aria-label="Zone Map">
        <span class="nav-tab__icon">🗺️</span>
        <span class="nav-tab__label">Zones</span>
      </button>
    </nav>
  `

  // ---- Event Listeners (set up ONCE) ----

  // Tap blob
  const tapBlob = container.querySelector('#tap-blob')!
  tapBlob.addEventListener('click', handleTap)
  tapBlob.addEventListener('touchstart', handleTap, { passive: true })

  // Settings
  container.querySelector('#settings-btn')!.addEventListener('click', () => navigateTo('settings'))

  // Nav tabs
  container.querySelector('#nav-pedia')!.addEventListener('click', () => navigateTo('slimepedia'))
  container.querySelector('#nav-breed')!.addEventListener('click', () => navigateTo('breed-lab'))
  container.querySelector('#nav-upgrades')!.addEventListener('click', () => navigateTo('upgrades'))
  container.querySelector('#nav-zones')!.addEventListener('click', () => navigateTo('zone-map'))

  // Slime grid — event delegation
  const grid = container.querySelector('#slime-grid')!
  grid.addEventListener('click', (e) => {
    const cell = (e.target as HTMLElement).closest('[data-slime-id]') as HTMLElement | null
    if (!cell) return

    const id = cell.dataset.slimeId!
    if (id === '__summon__') {
      handleSummon(e as MouseEvent)
    } else {
      openSlimePanel(id)
    }
  })

  // Subscribe to state changes — update display only, no DOM rebuild
  subscribe(() => {
    updateCurrencyDisplay(container)
    updateGrid(container)
    refreshPanel()
  })

  // Initial render
  updateCurrencyDisplay(container)
  updateGrid(container)
}

let _lastTapTime = 0

function handleTap(e: Event): void {
  e.preventDefault()
  const now = Date.now()
  if (now - _lastTapTime < 50) return // debounce 50ms
  _lastTapTime = now

  const blob = document.getElementById('tap-blob')!
  blob.classList.remove('jiggle')
  void blob.offsetWidth
  blob.classList.add('jiggle')

  let gooGained = 0
  setState(state => {
    const gpp = getGooPerTap(state)
    state.goo += gpp
    state.tapCount++
    state.tapsSinceSpend++
    gooGained = gpp
    checkTapSpecials(state)
  })

  // Floating number
  const tapArea = document.getElementById('tap-area')!
  const rect = tapArea.getBoundingClientRect()
  const appRect = document.getElementById('app')!.getBoundingClientRect()
  const cx = rect.left - appRect.left + rect.width / 2
  const cy = rect.top - appRect.top + rect.height / 2
  const jitter = () => (Math.random() - 0.5) * 60
  spawnFloatingNumber(`+${formatNumber(gooGained)} 💧`, cx + jitter(), cy + jitter())
}

function handleSummon(e: MouseEvent): void {
  let result: { slimeId: string; isNew: boolean; cost: number } | null = null

  setState(state => {
    result = performSummon(state)
  })

  if (!result) {
    showNotif('Not enough Goo to summon!')
    return
  }

  const { slimeId, isNew } = result as { slimeId: string; isNew: boolean; cost: number }
  const def = getSlime(slimeId)
  if (!def) return

  if (isNew) {
    showFanfare(slimeId)
  } else {
    showNotif(`${slimeEmoji(slimeId)} ${def.name} added!`)
  }
}

function updateCurrencyDisplay(container: HTMLElement): void {
  const state = getState()
  const gooEl = container.querySelector('#goo-display')
  const essEl = container.querySelector('#essence-display')
  const shardEl = container.querySelector('#shards-display')
  const prodEl = container.querySelector('#production-display')
  const zoneEl = container.querySelector('#zone-name')
  const progEl = container.querySelector('#pedia-progress')

  if (gooEl) gooEl.textContent = formatNumber(state.goo)
  if (essEl) essEl.textContent = formatNumber(state.essence)
  if (shardEl) shardEl.textContent = formatNumber(state.prismShards)
  if (prodEl) prodEl.textContent = formatNumber(computeTotalProduction(state))
  if (zoneEl) zoneEl.textContent = ZONE_NAMES[state.activeZone] ?? 'Zone 1'
  if (progEl) progEl.textContent = `${state.totalDiscoveries}/527 🔬`
}

let _lastGridHash = ''

function updateGrid(container: HTMLElement): void {
  const state = getState()
  const grid = container.querySelector('#slime-grid')
  if (!grid) return

  // Build a hash to avoid unnecessary DOM updates
  const ownedIds = Object.keys(state.collection)
  const hash = ownedIds.join(',') + '|' + ownedIds.map(id => {
    const o = state.collection[id]
    return `${o.count}:${o.level}`
  }).join(',') + '|' + state.goo.toFixed(0) + '|' + state.activeZone

  if (hash === _lastGridHash) return
  _lastGridHash = hash

  // Sort slimes by rarity
  const defs = ownedIds
    .map(id => getSlime(id))
    .filter(Boolean) as ReturnType<typeof getSlime>[]
  const sorted = sortByRarity(defs as any)

  let html = ''

  for (const def of sorted) {
    if (!def) continue
    const owned = state.collection[def.id]
    if (!owned) continue

    const color = rarityColor(def.rarity)
    const emoji = slimeEmoji(def.id)
    const isMergeReady = owned.count >= 3
    const isMaxLevel = owned.level >= 10

    html += `
      <div class="slime-cell ${isMergeReady ? 'merge-ready' : ''} ${isMaxLevel ? 'max-level' : ''}"
        data-slime-id="${def.id}"
        style="border-color:${color}"
        role="button"
        aria-label="${def.name}, level ${owned.level}"
      >
        ${owned.count > 1 ? `<div class="slime-cell__count">×${owned.count}</div>` : ''}
        <div class="slime-cell__emoji">${emoji}</div>
        <div class="slime-cell__name">${def.name.replace(' Slime', '')}</div>
        <div class="slime-cell__level">lv.${owned.level}</div>
      </div>
    `
  }

  // Summon cell
  const minCost = SUMMON_COST.Common
  const canSummon = state.goo >= minCost
  html += `
    <div class="slime-cell slime-cell--summon ${canSummon ? '' : 'disabled'}"
      data-slime-id="__summon__"
      role="button"
      aria-label="Summon a slime for ${minCost} Goo"
    >
      <div class="summon-icon">＋</div>
      <div class="slime-cell__name">Summon</div>
      <div class="summon-cost">${minCost} 💧</div>
    </div>
  `

  grid.innerHTML = html
}
