import { getSlime, rarityIcon, rarityColor } from '../game/slimes'
import type { SlimeId } from '../game/types'
import { on } from '../game/events'
import { getState } from '../game/state'
import { TOTAL_SLIMES } from '../data/config'

// Only show full fanfare for Rare+
const FANFARE_RARITIES = new Set(['Rare', 'Epic', 'Legendary', 'Mythic'])

let overlayEl: HTMLElement | null = null
let cardEl: HTMLElement | null = null

export function initFanfare(): void {
  overlayEl = document.createElement('div')
  overlayEl.className = 'fanfare'
  overlayEl.setAttribute('role', 'dialog')
  overlayEl.setAttribute('aria-modal', 'true')
  overlayEl.setAttribute('aria-label', 'New discovery')

  cardEl = document.createElement('div')
  cardEl.className = 'fanfare__card'
  overlayEl.appendChild(cardEl)

  overlayEl.addEventListener('click', (e) => {
    if (e.target === overlayEl) close()
  })

  document.getElementById('app')!.appendChild(overlayEl)

  on('discovery', (id) => {
    const def = getSlime(id)
    if (!def) return
    if (FANFARE_RARITIES.has(def.rarity)) {
      show(id)
    } else {
      showBanner(id)
    }
  })
}

function show(id: SlimeId): void {
  const def = getSlime(id)
  if (!def || !cardEl || !overlayEl) return

  const state = getState()
  const totalDiscovered = Object.keys(state.collection).length
  const pct = Math.floor((totalDiscovered / TOTAL_SLIMES) * 100)

  const icon = rarityIcon(def.rarity)
  const color = rarityColor(def.rarity)

  cardEl.innerHTML = `
    <div class="fanfare__title">✨ NEW DISCOVERY! ✨</div>
    <span class="fanfare__emoji">🟢</span>
    <div class="fanfare__name">${def.name}</div>
    <div class="fanfare__rarity" style="color:${color}">${icon} ${def.rarity} ${icon}</div>
    <div class="fanfare__lore">"${def.lore}"</div>
    <div class="fanfare__reward">+1 💎 Prism Shard earned!</div>
    <div class="fanfare__progress">Slimepedia #${totalDiscovered} of ${TOTAL_SLIMES} — ${pct}%</div>
    <button class="btn btn--primary" id="fanfare-close">Add to Collection</button>
  `

  cardEl.querySelector('#fanfare-close')?.addEventListener('click', close)

  overlayEl.classList.add('open')
  overlayEl.focus()
}

function close(): void {
  overlayEl?.classList.remove('open')
}

// Banner for Common/Uncommon discoveries
function showBanner(id: SlimeId): void {
  const def = getSlime(id)
  if (!def) return

  const banner = document.createElement('div')
  banner.className = 'discovery-banner'
  banner.style.cssText = `
    position: fixed; bottom: ${64}px; left: 50%; transform: translateX(-50%);
    background: var(--color-surface); border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm); padding: 8px 16px;
    font-size: var(--font-size-sm); z-index: 150; white-space: nowrap;
    box-shadow: var(--shadow-md);
  `
  banner.textContent = `🟢 New: ${def.name}!`
  document.getElementById('app')!.appendChild(banner)

  setTimeout(() => banner.remove(), 2500)
}
