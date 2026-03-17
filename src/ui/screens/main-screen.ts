// Main game screen — tap blob, slime grid, currency bar, bottom nav
// NO subscribe() — uses rAF loop to patch only text nodes that change.
// Grid only rebuilds when collection hash changes.
import { getState, setState } from '../../game/state'
import { getSlime, rarityColor, slimeEmoji, formatNumber, sortByRarity } from '../../game/slimes'
import { computeTotalProduction, getGooPerTap } from '../../game/economy'
import { performSummon } from '../../game/zones'
import { checkTapSpecials } from '../../game/zones'
import { ZONE_NAMES } from '../../data/config'
import { getMinSummonCost } from '../../game/economy'
import { navigateTo } from '../router'
import { openSlimePanel, refreshPanel } from '../components/slime-panel'
import { spawnFloatingNumber } from '../components/floating-numbers'
import { showFanfare } from '../fanfare'
import { showNotif } from '../components/notif'

let _rafId: number | null = null
let _lastGridHash = ''

// Cached element references (set once, reused every frame)
let _gooEl: HTMLElement | null = null
let _essEl: HTMLElement | null = null
let _shardEl: HTMLElement | null = null
let _prodEl: HTMLElement | null = null
let _zoneEl: HTMLElement | null = null
let _progEl: HTMLElement | null = null
let _summonBtn: HTMLButtonElement | null = null
let _gridEl: HTMLElement | null = null

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

    <div class="summon-bar">
      <button class="summon-btn" id="summon-btn" disabled>
        <span class="summon-btn__icon">＋</span>
        <span>Summon Slime</span>
        <span class="summon-btn__cost" id="summon-cost-label">… 💧</span>
      </button>
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

  // Cache element references once
  _gooEl = container.querySelector('#goo-display')
  _essEl = container.querySelector('#essence-display')
  _shardEl = container.querySelector('#shards-display')
  _prodEl = container.querySelector('#production-display')
  _zoneEl = container.querySelector('#zone-name')
  _progEl = container.querySelector('#pedia-progress')
  _summonBtn = container.querySelector('#summon-btn')
  _gridEl = container.querySelector('#slime-grid')

  // ---- Event Listeners (set up ONCE, never re-attached) ----

  // Tap blob
  const tapBlob = container.querySelector('#tap-blob')!
  tapBlob.addEventListener('click', handleTap)
  tapBlob.addEventListener('touchstart', handleTap, { passive: true })

  // Summon button
  _summonBtn!.addEventListener('click', handleSummon)

  // Settings
  container.querySelector('#settings-btn')!.addEventListener('click', () => navigateTo('settings'))

  // Nav tabs
  container.querySelector('#nav-pedia')!.addEventListener('click', () => navigateTo('slimepedia'))
  container.querySelector('#nav-breed')!.addEventListener('click', () => navigateTo('breed-lab'))
  container.querySelector('#nav-upgrades')!.addEventListener('click', () => navigateTo('upgrades'))
  container.querySelector('#nav-zones')!.addEventListener('click', () => navigateTo('zone-map'))

  // Slime grid — event delegation (grid innerHTML may be replaced, but the grid element itself is stable)
  _gridEl!.addEventListener('click', (e) => {
    const cell = (e.target as HTMLElement).closest('[data-slime-id]') as HTMLElement | null
    if (!cell) return
    openSlimePanel(cell.dataset.slimeId!)
  })

  // Initial render + start rAF loop
  _lastGridHash = ''
  tickFrame()
}

// ---- rAF loop — patches only text nodes and grid when hash changes ----

function tickFrame(): void {
  const state = getState()

  // Patch currency text
  const goo = formatNumber(state.goo)
  const ess = formatNumber(state.essence)
  const shard = formatNumber(state.prismShards)
  const prod = formatNumber(computeTotalProduction(state))
  const zone = ZONE_NAMES[state.activeZone] ?? 'Zone 1'
  const totalSlimes = 648
  const prog = `${state.totalDiscoveries}/${totalSlimes} 🔬`
  const minCost = getMinSummonCost(state.activeZone)
  const canSummon = state.goo >= minCost
  const costLabel = formatNumber(minCost) + ' 💧'
  const costEl = document.getElementById('summon-cost-label')
  if (costEl && costEl.textContent !== costLabel) costEl.textContent = costLabel

  if (_gooEl && _gooEl.textContent !== goo) _gooEl.textContent = goo
  if (_essEl && _essEl.textContent !== ess) _essEl.textContent = ess
  if (_shardEl && _shardEl.textContent !== shard) _shardEl.textContent = shard
  if (_prodEl && _prodEl.textContent !== prod) _prodEl.textContent = prod
  if (_zoneEl && _zoneEl.textContent !== zone) _zoneEl.textContent = zone
  if (_progEl && _progEl.textContent !== prog) _progEl.textContent = prog
  if (_summonBtn) _summonBtn.disabled = !canSummon

  // Grid — only rebuild if collection changed
  updateGrid(state)

  // Refresh open slime panel
  refreshPanel()

  _rafId = requestAnimationFrame(tickFrame)
}

// ---- Tap handler ----

let _lastTapTime = 0

function handleTap(e: Event): void {
  e.preventDefault()
  const now = Date.now()
  if (now - _lastTapTime < 50) return
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
    // Track consecutive taps on the main blob (not a specific slime) for Curious Slime trigger
    state.consecutiveTapCount++
    gooGained = gpp
    checkTapSpecials(state)
  })

  const tapArea = document.getElementById('tap-area')!
  const rect = tapArea.getBoundingClientRect()
  const appRect = document.getElementById('app')!.getBoundingClientRect()
  const cx = rect.left - appRect.left + rect.width / 2
  const cy = rect.top - appRect.top + rect.height / 2
  const jitter = () => (Math.random() - 0.5) * 60
  spawnFloatingNumber(`+${formatNumber(gooGained)} 💧`, cx + jitter(), cy + jitter())
}

// ---- Summon handler ----

function handleSummon(): void {
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

// ---- Grid update (hash-guarded, only rebuilds on collection change) ----

function updateGrid(state: ReturnType<typeof getState>): void {
  if (!_gridEl) return

  const ownedIds = Object.keys(state.collection)
  const hash = ownedIds.join(',') + '|' + ownedIds.map(id => {
    const o = state.collection[id]
    return `${o.count}:${o.level}`
  }).join(',') + '|' + state.activeZone

  if (hash === _lastGridHash) return
  _lastGridHash = hash

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

  if (!html) {
    html = `<div class="slime-grid__empty">Tap the blob to earn Goo, then summon your first slime!</div>`
  }

  _gridEl.innerHTML = html
}
