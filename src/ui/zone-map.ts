import { getState, subscribe } from '../game/state'
import { canUnlockZone, unlockZone, setActiveZone } from '../game/zones'
import { formatGoo } from '../game/economy'
import { ZONE_UNLOCK_COSTS } from '../data/config'
import type { ZoneId } from '../game/types'

const ZONES: { id: ZoneId; name: string; emoji: string }[] = [
  { id: 6, name: 'Starfall Isle', emoji: '🌌' },
  { id: 5, name: 'Verdant Deep', emoji: '🌿' },
  { id: 4, name: 'Frostmere', emoji: '❄️' },
  { id: 3, name: 'Ember Wastes', emoji: '🔥' },
  { id: 2, name: 'Crystal Caves', emoji: '💎' },
  { id: 1, name: 'Gooey Meadow', emoji: '🟢' },
]

export function renderZoneMap(container: HTMLElement, onBack: () => void): void {
  container.innerHTML = `
    <div class="topbar">
      <button class="btn btn--secondary" id="back-btn" style="width:auto;flex:0">← Back</button>
      <div style="font-weight:700">Zone Map</div>
      <div></div>
    </div>
    <div class="zone-map" id="zone-list" aria-label="Available zones"></div>
  `

  container.querySelector('#back-btn')?.addEventListener('click', onBack)
  subscribe(() => renderZones(container, onBack))
  renderZones(container, onBack)
}

function renderZones(container: HTMLElement, onBack: () => void): void {
  const state = getState()
  const list = container.querySelector('#zone-list')
  if (!list) return

  list.innerHTML = ZONES.map(zone => {
    const unlocked = state.unlockedZones.includes(zone.id)
    const isActive = state.activeZone === zone.id
    const cost = ZONE_UNLOCK_COSTS[zone.id] ?? 0
    const canUnlock = canUnlockZone(zone.id)

    return `
      <div class="zone-node${isActive ? ' active' : ''}${!unlocked ? ' locked' : ''}"
        data-zone="${zone.id}"
        role="button"
        aria-label="${zone.name}${isActive ? ' (active)' : ''}${!unlocked ? ' (locked)' : ''}"
        tabindex="0">
        <div>
          <div class="zone-node__name">${zone.emoji} ${zone.name}</div>
          <div class="zone-node__status">
            ${unlocked
              ? isActive ? '✓ Active zone' : 'Unlocked — tap to switch'
              : canUnlock ? `🔓 ${formatGoo(cost)} 💧 — tap to unlock!`
              : `🔒 ${formatGoo(cost)} 💧 to unlock`}
          </div>
        </div>
        ${unlocked && !isActive ? '<span style="color:var(--color-accent)">→</span>' : ''}
        ${canUnlock && !unlocked ? '<span style="color:var(--color-goo)">UNLOCK</span>' : ''}
      </div>
    `
  }).join('')

  list.querySelectorAll('[data-zone]').forEach(el => {
    el.addEventListener('click', () => {
      const zoneId = parseInt((el as HTMLElement).dataset['zone']!) as ZoneId
      const isUnlocked = state.unlockedZones.includes(zoneId)

      if (isUnlocked) {
        setActiveZone(zoneId)
        onBack()
      } else if (canUnlockZone(zoneId)) {
        unlockZone(zoneId)
      }
    })
  })

  // Progress bar toward next locked zone
  const nextLocked = ZONES.slice().reverse().find(z => !state.unlockedZones.includes(z.id))
  if (nextLocked) {
    const cost = ZONE_UNLOCK_COSTS[nextLocked.id] ?? 0
    const pct = Math.min(100, (state.goo / cost) * 100)
    const bar = document.createElement('div')
    bar.style.cssText = 'padding:12px;border-top:1px solid var(--color-border);background:var(--color-bg-2)'
    bar.innerHTML = `
      <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-bottom:4px">
        Progress to ${nextLocked.name}: ${formatGoo(state.goo)} / ${formatGoo(cost)}
      </div>
      <div style="height:6px;background:var(--color-surface);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:var(--color-accent);border-radius:3px;transition:width 0.5s"></div>
      </div>
    `
    list.appendChild(bar)
  }
}
