import { getState, subscribe } from '../game/state'
import { getAllSlimes, getSlime, rarityColor, rarityIcon } from '../game/slimes'
import { openSlimeDetail } from './components/slime-detail-panel'
import { TOTAL_SLIMES } from '../data/config'
import type { SlimeId } from '../game/types'

const ZONE_NAMES: Record<number, string> = {
  1: 'Gooey Meadow', 2: 'Crystal Caves', 3: 'Ember Wastes',
  4: 'Frostmere', 5: 'Verdant Deep', 6: 'Starfall Isle',
}

let activeFilter = 'all'

export function renderSlimepedia(container: HTMLElement, onBack: () => void): void {
  container.innerHTML = `
    <div class="topbar">
      <button class="btn btn--secondary" id="back-btn" aria-label="Back" style="width:auto;flex:0">← Back</button>
      <div style="font-weight:700">Slimepedia</div>
      <div class="topbar__progress" id="pedia-count">0 / ${TOTAL_SLIMES}</div>
    </div>

    <div class="slimepedia__filters" role="tablist" aria-label="Filter slimes">
      <button class="filter-chip active" data-filter="all" role="tab">All</button>
      <button class="filter-chip" data-filter="zone-1" role="tab">Zone 1</button>
      <button class="filter-chip" data-filter="zone-2" role="tab">Zone 2</button>
      <button class="filter-chip" data-filter="zone-3" role="tab">Zone 3</button>
      <button class="filter-chip" data-filter="zone-4" role="tab">Zone 4</button>
      <button class="filter-chip" data-filter="zone-5" role="tab">Zone 5</button>
      <button class="filter-chip" data-filter="zone-6" role="tab">Zone 6</button>
      <button class="filter-chip" data-filter="breed" role="tab">Breeds</button>
      <button class="filter-chip" data-filter="special" role="tab">Special</button>
    </div>

    <div class="slimepedia" id="pedia-content" role="main"></div>
  `

  container.querySelector('#back-btn')?.addEventListener('click', onBack)

  container.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'))
      chip.classList.add('active')
      activeFilter = (chip as HTMLElement).dataset['filter'] ?? 'all'
      renderContent(container)
    })
  })

  subscribe(() => renderContent(container))
  renderContent(container)
}

function renderContent(container: HTMLElement): void {
  const state = getState()
  const allSlimes = getAllSlimes()
  const ownedCount = Object.keys(state.collection).length

  const countEl = container.querySelector('#pedia-count')
  if (countEl) countEl.textContent = `${ownedCount} / ${TOTAL_SLIMES}`

  const content = container.querySelector('#pedia-content')
  if (!content) return

  // Group slimes
  const groups: { label: string; slimes: typeof allSlimes }[] = []

  if (activeFilter === 'all' || activeFilter.startsWith('zone-')) {
    const zones = activeFilter === 'all' ? [1,2,3,4,5,6] : [parseInt(activeFilter.split('-')[1]!)]
    for (const z of zones) {
      const zoneSlimes = allSlimes.filter(s => s.zone === z)
      if (zoneSlimes.length) {
        const owned = zoneSlimes.filter(s => state.collection[s.id]).length
        groups.push({ label: `${ZONE_NAMES[z]} (${owned}/${zoneSlimes.length})`, slimes: zoneSlimes })
      }
    }
  }

  if (activeFilter === 'all' || activeFilter === 'breed') {
    const breeds = allSlimes.filter(s => s.discovery === 'Breed')
    if (breeds.length) {
      const owned = breeds.filter(s => state.collection[s.id]).length
      const isBreedUnlocked = state.totalBreeds > 0
      groups.push({
        label: `Breeding Exclusives (${owned}/${breeds.length})${isBreedUnlocked ? '' : ' 🔒'}`,
        slimes: isBreedUnlocked ? breeds : [],
      })
    }
  }

  if (activeFilter === 'all' || activeFilter === 'special') {
    const specials = allSlimes.filter(s => s.discovery === 'Special')
    const owned = specials.filter(s => state.collection[s.id]).length
    groups.push({ label: `Special / Secret (${owned}/${specials.length})`, slimes: specials })
  }

  content.innerHTML = groups.map(group => `
    <div class="slimepedia__section">
      <div class="slimepedia__section-header">
        <span>${group.label}</span>
      </div>
      ${group.slimes.length === 0
        ? `<div style="padding:8px;font-size:var(--font-size-sm);color:var(--color-text-muted)">
             Complete your first breed to reveal breed-exclusive slimes.
           </div>`
        : `<div class="pedia-grid">
             ${group.slimes.map(s => renderPediaCell(s.id, state)).join('')}
           </div>`
      }
    </div>
  `).join('')

  // Attach click handlers
  content.querySelectorAll('[data-pedia-id]').forEach(el => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset['pedaId'] as SlimeId
      if (getState().collection[id]) openSlimeDetail(id)
    })
  })
}

function renderPediaCell(id: SlimeId, state: ReturnType<typeof getState>): string {
  const def = getSlime(id)
  if (!def) return ''

  const owned = state.collection[id]
  const isZoneUnlocked = def.zone ? state.unlockedZones.includes(def.zone as any) : true
  const color = rarityColor(def.rarity)
  const icon = rarityIcon(def.rarity)

  if (owned) {
    return `
      <button class="pedia-cell" data-pedia-id="${id}" style="border-color:${color}" aria-label="${def.name}">
        <span style="font-size:1.2rem">${icon}</span>
        <span style="font-size:0.55rem;text-align:center;overflow:hidden;width:100%">${def.name.replace(' Slime','')}</span>
      </button>
    `
  }

  if (isZoneUnlocked && def.discovery === 'Zone') {
    // Silhouette — same zone, undiscovered
    return `
      <div class="pedia-cell pedia-cell--silhouette" aria-label="Undiscovered slime">
        <span style="font-size:1.2rem">${icon}</span>
        <span style="font-size:0.55rem">???</span>
      </div>
    `
  }

  // Hidden
  return `
    <div class="pedia-cell pedia-cell--hidden" aria-label="Locked slime">
      <span style="font-size:0.8rem;color:var(--color-text-muted)">?</span>
    </div>
  `
}
