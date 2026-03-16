import { getState, setState, subscribe } from '../game/state'
import { handleTap } from '../game/tick'
import { performSummon, canSummon } from '../game/zones'
import { formatGoo, formatRate, computeTotalProduction, gooPerTap } from '../game/economy'
import { getSlime, rarityColor, getZoneSummonPool } from '../game/slimes'
import { canMerge, canFeed } from '../game/breeds'
import { on } from '../game/events'
import { openSlimeDetail } from './components/slime-detail-panel'
import { showFloatingNumber } from './components/floating-number'
import { TOTAL_SLIMES } from '../data/config'
import type { SlimeId } from '../game/types'

function showSummonBanner(id: SlimeId): void {
  const def = getSlime(id)
  if (!def) return
  const banner = document.createElement('div')
  banner.style.cssText = `
    position:fixed;bottom:72px;left:50%;transform:translateX(-50%);
    background:var(--color-surface);border:1px solid var(--color-border);
    border-radius:var(--border-radius-sm);padding:8px 16px;
    font-size:var(--font-size-sm);z-index:150;white-space:nowrap;
    box-shadow:var(--shadow-md);pointer-events:none;
  `
  const state = getState()
  const isNew = Object.values(state.collection).filter(o => o.id === id).length === 0
  banner.textContent = isNew ? `✨ New: ${def.name}!` : `🟢 ${def.name} ×${(state.collection[id]?.count ?? 1)}`
  document.getElementById('app')!.appendChild(banner)
  setTimeout(() => banner.remove(), 2000)
}

const ZONE_NAMES: Record<number, string> = {
  1: 'Gooey Meadow',
  2: 'Crystal Caves',
  3: 'Ember Wastes',
  4: 'Frostmere',
  5: 'Verdant Deep',
  6: 'Starfall Isle',
}

export function renderMainScreen(container: HTMLElement): void {
  container.innerHTML = `
    <div class="topbar" role="banner">
      <div class="topbar__zone" id="zone-name">Gooey Meadow</div>
      <div class="topbar__progress" id="pedia-progress">0 / ${TOTAL_SLIMES} 🔬</div>
      <button class="topbar__settings" aria-label="Settings" id="btn-settings">⚙️</button>
    </div>

    <div class="offline-banner" id="offline-banner" style="display:none" role="status"></div>

    <div class="currency-bar" role="status" aria-label="Currencies">
      <div class="currency-item" aria-label="Slime Goo">
        <span>💧</span>
        <span class="currency-item__value" id="curr-goo">0</span>
      </div>
      <div class="currency-item" aria-label="Slime Essence">
        <span>✨</span>
        <span class="currency-item__value" id="curr-essence">0</span>
      </div>
      <div class="currency-item" aria-label="Prism Shards">
        <span>💎</span>
        <span class="currency-item__value" id="curr-shards">0</span>
      </div>
    </div>

    <div class="slime-grid" id="slime-grid" role="list" aria-label="Your slimes"></div>

    <div class="production-bar" aria-live="polite">
      <span id="prod-total">0 💧/sec</span>
      <span id="tap-power-label">1 💧/tap</span>
    </div>

    <div class="tap-area" id="tap-area">
      <button
        class="tap-blob"
        id="tap-blob"
        aria-label="Tap to collect Slime Goo"
        role="button"
      >🟢</button>
      <button class="tap-burst-btn" id="tap-burst-btn" style="display:none" aria-label="Tap Burst" disabled>
        💥 BURST (ready)
      </button>
    </div>

    <nav class="bottom-nav" role="navigation" aria-label="Main navigation">
      <button class="nav-tab active" data-screen="main" aria-label="Collection">
        <span class="nav-tab__icon">🟢</span>
        <span>Collection</span>
      </button>
      <button class="nav-tab" data-screen="slimepedia" aria-label="Slimepedia">
        <span class="nav-tab__icon">📖</span>
        <span>Slimepedia</span>
      </button>
      <button class="nav-tab" data-screen="breed-lab" aria-label="Breed Lab">
        <span class="nav-tab__icon">🧪</span>
        <span>Lab</span>
      </button>
      <button class="nav-tab" data-screen="upgrades" aria-label="Upgrades">
        <span class="nav-tab__icon">⬆️</span>
        <span>Upgrades</span>
      </button>
    </nav>
  `

  // Tap blob
  const tapBlob = container.querySelector('#tap-blob')!
  const tapArea = container.querySelector('#tap-area')!

  tapBlob.addEventListener('click', (e) => {
    handleTap()
    const rect = tapArea.getBoundingClientRect()
    const appRect = document.getElementById('app')!.getBoundingClientRect()
    const x = (e as MouseEvent).clientX - appRect.left
    const y = (e as MouseEvent).clientY - appRect.top
    showFloatingNumber(gooPerTap(getState()), x, y)
    tapBlob.classList.remove('merge-flash')
    void (tapBlob as HTMLElement).offsetWidth  // reflow
    tapBlob.classList.add('merge-flash')
  })

  // Tap Burst (unlocked at Tap Power Lv.5)
  let burstCooldown = false
  const burstBtn = container.querySelector('#tap-burst-btn') as HTMLButtonElement
  burstBtn.addEventListener('click', () => {
    if (burstCooldown) return
    const tap = gooPerTap(getState())
    const burst = tap * 10
    setState(s => { s.goo += burst })
    showFloatingNumber(burst, 160, 80)
    burstCooldown = true
    burstBtn.disabled = true
    burstBtn.textContent = '💥 BURST (30s)'
    setTimeout(() => {
      burstCooldown = false
      burstBtn.disabled = false
      burstBtn.textContent = '💥 BURST (ready)'
    }, 30_000)
  })

  // Offline banner
  const offlineBanner = container.querySelector('#offline-banner') as HTMLElement
  const initialState = getState()
  if (initialState._offlineGooEarned && initialState._offlineGooEarned > 0) {
    offlineBanner.style.display = 'block'
    offlineBanner.textContent = `Welcome back! Your slimes earned ${formatGoo(initialState._offlineGooEarned)} 💧 while you were away. Tap to dismiss.`
    offlineBanner.addEventListener('click', () => { offlineBanner.style.display = 'none' })
  }

  // Navigation
  container.querySelectorAll('.nav-tab[data-screen]').forEach(btn => {
    btn.addEventListener('click', () => {
      const screen = (btn as HTMLElement).dataset['screen']
      if (screen && screen !== 'main') {
        import('./router').then(m => m.navigate(screen as any))
      }
    })
  })

  container.querySelector('#btn-settings')?.addEventListener('click', () => {
    import('./router').then(m => m.navigate('settings'))
  })

  // Event delegation for the slime grid — handles summon + slime detail clicks
  // even after the grid innerHTML is replaced by reactive updates.
  const grid = container.querySelector('#slime-grid')!
  grid.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('button')
    if (!target) return
    if (target.id === 'summon-btn') {
      const state = getState()
      const resultId = performSummon(state.activeZone)
      if (resultId) showSummonBanner(resultId)
      return
    }
    const slimeId = target.dataset['slimeId'] as SlimeId | undefined
    if (slimeId) openSlimeDetail(slimeId)
  })

  // Reactive updates
  subscribe(() => updateMain(container))
  updateMain(container)

  // Floating number container on tap area
  import('./components/floating-number').then(m => m.initFloatingNumbers(tapArea as HTMLElement))
}

function updateMain(container: HTMLElement): void {
  const state = getState()

  // Zone name
  const zoneName = container.querySelector('#zone-name')
  if (zoneName) zoneName.textContent = ZONE_NAMES[state.activeZone] ?? 'Unknown Zone'

  // Slimepedia progress
  const pediaProgress = container.querySelector('#pedia-progress')
  if (pediaProgress) {
    const count = Object.keys(state.collection).length
    pediaProgress.textContent = `${count} / ${TOTAL_SLIMES} 🔬`
  }

  // Currencies
  const gooEl = container.querySelector('#curr-goo')
  if (gooEl) gooEl.textContent = formatGoo(state.goo)

  const essEl = container.querySelector('#curr-essence')
  if (essEl) essEl.textContent = formatGoo(state.essence)

  const shdEl = container.querySelector('#curr-shards')
  if (shdEl) shdEl.textContent = formatGoo(state.prismShards)

  // Production
  const prod = container.querySelector('#prod-total')
  if (prod) prod.textContent = formatRate(computeTotalProduction(state))

  const tapLbl = container.querySelector('#tap-power-label')
  if (tapLbl) tapLbl.textContent = `${formatGoo(gooPerTap(state))} 💧/tap`

  // Tap Burst visibility
  const burstBtn = container.querySelector('#tap-burst-btn') as HTMLElement | null
  if (burstBtn) burstBtn.style.display = state.tapPowerLevel >= 5 ? 'block' : 'none'

  // Slime grid
  renderSlimeGrid(container, state)
}

function renderSlimeGrid(container: HTMLElement, state: ReturnType<typeof getState>): void {
  const grid = container.querySelector('#slime-grid')
  if (!grid) return

  const ownedEntries = Object.values(state.collection)
    .sort((a, b) => {
      const da = getSlime(a.id)
      const db = getSlime(b.id)
      const ra = ['Common','Uncommon','Rare','Epic','Legendary','Mythic'].indexOf(da?.rarity ?? 'Common')
      const rb = ['Common','Uncommon','Rare','Epic','Legendary','Mythic'].indexOf(db?.rarity ?? 'Common')
      return rb - ra  // highest rarity first
    })

  const cells: string[] = ownedEntries.map(owned => {
    const def = getSlime(owned.id)
    if (!def) return ''
    const color = rarityColor(def.rarity)
    const mergeReady = canMerge(owned.id)
    const maxLevel = owned.level >= 10

    return `
      <button
        class="slime-cell${mergeReady ? ' slime-cell--merge-ready' : ''}${maxLevel ? ' slime-cell--max-level' : ''}"
        style="border-color:${color}"
        data-slime-id="${owned.id}"
        role="listitem"
        aria-label="${def.name}, ${def.rarity}, level ${owned.level}"
      >
        ${owned.count > 1 ? `<span class="slime-cell__count">×${owned.count}</span>` : ''}
        <span class="slime-cell__emoji">🟢</span>
        <span class="slime-cell__name">${def.name.replace(' Slime', '')}</span>
        <span class="slime-cell__level">lv.${owned.level}</span>
      </button>
    `
  })

  // Summon button
  const pool = getZoneSummonPool(state.activeZone)
  const summonActive = canSummon(state.activeZone)
  const summonCost = 25
  cells.push(`
    <button
      class="slime-cell slime-cell--summon${summonActive ? '' : ' opacity-40'}"
      id="summon-btn"
      aria-label="Summon a slime for ${summonCost} Goo"
      ${summonActive ? '' : 'disabled'}
    >
      <span style="font-size:1.2rem">+</span>
      <span style="font-size:0.6rem">Summon</span>
      <span style="font-size:0.6rem">${summonCost}💧</span>
    </button>
  `)

  grid.innerHTML = cells.join('')
  // Click handlers are managed via event delegation on the grid (set up once in renderMainScreen)
}
