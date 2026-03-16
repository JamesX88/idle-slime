// Slimepedia screen — full collection browser
import { getState, subscribe } from '../../game/state'
import { getAllSlimes, getSlime, rarityColor, rarityEmoji, slimeEmoji, sortByRarity } from '../../game/slimes'
import type { SlimeDefinition } from '../../game/state'
import { computeSlimeOutput } from '../../game/economy'
import { navigateBack } from '../router'
import { openSlimePanel } from '../components/slime-panel'
import { ZONE_NAMES } from '../../data/config'

type FilterMode = 'all' | 'owned' | 'zone-1' | 'zone-2' | 'zone-3' | 'zone-4' | 'zone-5' | 'zone-6' | 'breed' | 'special'

let _filter: FilterMode = 'all'
let _search = ''

export function buildSlimepediaScreen(container: HTMLElement): void {
  container.innerHTML = `
    <div class="screen-header">
      <button class="back-btn" id="pedia-back">←</button>
      <div class="screen-header__title">Slimepedia</div>
      <div class="screen-header__extra" id="pedia-count">0 / 527</div>
    </div>

    <div class="pedia-filters" id="pedia-filters">
      <button class="pedia-filter active" data-filter="all">All</button>
      <button class="pedia-filter" data-filter="owned">Owned</button>
      <button class="pedia-filter" data-filter="zone-1">🌿 Meadow</button>
      <button class="pedia-filter" data-filter="zone-2">💎 Crystal</button>
      <button class="pedia-filter" data-filter="zone-3">🔥 Ember</button>
      <button class="pedia-filter" data-filter="zone-4">❄️ Frost</button>
      <button class="pedia-filter" data-filter="zone-5">🌿 Verdant</button>
      <button class="pedia-filter" data-filter="zone-6">✨ Starfall</button>
      <button class="pedia-filter" data-filter="breed">🧪 Breed</button>
      <button class="pedia-filter" data-filter="special">⭐ Special</button>
    </div>

    <div class="pedia-search">
      <input type="search" id="pedia-search-input" placeholder="Search slimes..." autocomplete="off" />
    </div>

    <div class="scroll-content" id="pedia-grid-container"></div>
  `

  container.querySelector('#pedia-back')!.addEventListener('click', () => navigateBack())

  // Filter buttons — event delegation
  const filtersEl = container.querySelector('#pedia-filters')!
  filtersEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-filter]') as HTMLElement | null
    if (!btn) return
    _filter = btn.dataset.filter as FilterMode
    filtersEl.querySelectorAll('.pedia-filter').forEach(f => f.classList.remove('active'))
    btn.classList.add('active')
    renderGrid(container)
  })

  // Search
  const searchInput = container.querySelector('#pedia-search-input') as HTMLInputElement
  searchInput.addEventListener('input', () => {
    _search = searchInput.value.toLowerCase()
    renderGrid(container)
  })

  // Grid — event delegation
  const gridContainer = container.querySelector('#pedia-grid-container')!
  gridContainer.addEventListener('click', (e) => {
    const cell = (e.target as HTMLElement).closest('[data-pedia-id]') as HTMLElement | null
    if (!cell) return
    const id = cell.dataset.pediaId!
    const state = getState()
    if (state.collection[id]) {
      openSlimePanel(id)
    }
  })

  window.addEventListener('screen-change', (e: Event) => {
    const detail = (e as CustomEvent).detail
    if (detail.screen === 'slimepedia') renderGrid(container)
  })

  subscribe(() => {
    const countEl = container.querySelector('#pedia-count')
    if (countEl) countEl.textContent = `${getState().totalDiscoveries} / 527`
    renderGrid(container)
  })

  renderGrid(container)
}

function getFilteredSlimes(): SlimeDefinition[] {
  const state = getState()
  let slimes = getAllSlimes()

  // Apply filter
  if (_filter === 'owned') {
    slimes = slimes.filter(s => !!state.collection[s.id])
  } else if (_filter.startsWith('zone-')) {
    const zone = parseInt(_filter.replace('zone-', ''))
    slimes = slimes.filter(s => s.zone === zone && s.discovery === 'Zone')
  } else if (_filter === 'breed') {
    slimes = slimes.filter(s => s.discovery === 'Breed')
  } else if (_filter === 'special') {
    slimes = slimes.filter(s => s.discovery === 'Special')
  }

  // Apply search
  if (_search) {
    slimes = slimes.filter(s =>
      s.name.toLowerCase().includes(_search) ||
      s.rarity.toLowerCase().includes(_search) ||
      s.element.toLowerCase().includes(_search)
    )
  }

  return sortByRarity(slimes)
}

let _lastPediaHash = ''

function renderGrid(container: HTMLElement): void {
  const state = getState()
  const gridContainer = container.querySelector('#pedia-grid-container')
  if (!gridContainer) return

  const filtered = getFilteredSlimes()
  const ownedCount = filtered.filter(s => !!state.collection[s.id]).length

  // Build hash
  const hash = _filter + _search + Object.keys(state.collection).join(',')
  if (hash === _lastPediaHash) return
  _lastPediaHash = hash

  // Update count
  const countEl = container.querySelector('#pedia-count')
  if (countEl) countEl.textContent = `${state.totalDiscoveries} / 527`

  // Group by rarity for display
  const rarities = ['Mythic', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common']
  let html = ''

  for (const rarity of rarities) {
    const group = filtered.filter(s => s.rarity === rarity)
    if (group.length === 0) continue

    const ownedInGroup = group.filter(s => !!state.collection[s.id]).length
    const color = rarityColor(rarity as any)
    const emo = rarityEmoji(rarity as any)

    html += `
      <div class="pedia-section">
        <div class="pedia-section__header">
          <div class="pedia-section__title" style="color:${color}">${emo} ${rarity}</div>
          <div class="pedia-section__count">${ownedInGroup} / ${group.length}</div>
        </div>
        <div class="pedia-grid">
          ${group.map(s => {
            const owned = state.collection[s.id]
            const isOwned = !!owned
            const emoji = isOwned ? slimeEmoji(s.id) : '❓'

            // Show silhouette hint for same-zone undiscovered if Discovery lv1+
            const showHint = !isOwned && state.discoveryLevel >= 1 && s.discovery === 'Zone'

            return `
              <div class="pedia-cell ${!isOwned ? 'undiscovered' : ''}"
                data-pedia-id="${s.id}"
                role="${isOwned ? 'button' : 'img'}"
                aria-label="${isOwned ? s.name : 'Undiscovered slime'}"
                title="${isOwned ? s.name : (showHint ? `Zone ${s.zone} ${s.rarity}` : '???')}"
              >
                <div class="pedia-cell__emoji">${emoji}</div>
                <div class="pedia-cell__name" style="${isOwned ? `color:${color}` : ''}">
                  ${isOwned ? s.name.replace(' Slime', '') : (showHint ? '???' : '???')}
                </div>
                ${isOwned && owned.level > 1 ? `<div style="font-size:8px;color:var(--color-text-dim)">lv.${owned.level}</div>` : ''}
              </div>
            `
          }).join('')}
        </div>
      </div>
    `
  }

  if (!html) {
    html = `<div style="padding:32px;text-align:center;color:var(--color-text-muted)">No slimes found</div>`
  }

  gridContainer.innerHTML = html
}
