// Discovery fanfare overlay
import { getSlime, rarityColor, rarityEmoji, slimeEmoji, formatNumber } from '../game/slimes'
import { getState } from '../game/state'
import { computeSlimeOutput } from '../game/economy'

let _overlay: HTMLElement | null = null
let _queue: string[] = []
let _showing = false

export function initFanfare(container: HTMLElement): void {
  _overlay = document.createElement('div')
  _overlay.className = 'fanfare-overlay'
  _overlay.innerHTML = '<div class="fanfare-content"></div>'
  container.appendChild(_overlay)

  _overlay.addEventListener('click', () => {
    dismissFanfare()
  })
}

export function showFanfare(slimeId: string): void {
  _queue.push(slimeId)
  if (!_showing) processQueue()
}

function processQueue(): void {
  if (_queue.length === 0) { _showing = false; return }
  _showing = true
  const id = _queue.shift()!
  renderFanfare(id)
}

function renderFanfare(id: string): void {
  if (!_overlay) return

  const def = getSlime(id)
  if (!def) { processQueue(); return }

  const state = getState()
  const color = rarityColor(def.rarity)
  const emoji = slimeEmoji(id)
  const rarityEmo = rarityEmoji(def.rarity)
  const production = computeSlimeOutput(state, id)
  const totalDiscoveries = state.totalDiscoveries

  const isEpicPlus = ['Epic', 'Legendary', 'Mythic'].includes(def.rarity)
  const isLegendaryPlus = ['Legendary', 'Mythic'].includes(def.rarity)

  const content = _overlay.querySelector('.fanfare-content')!
  content.innerHTML = `
    <div class="fanfare-badge" style="color:${color};border-color:${color}20;background:${color}15">
      ${rarityEmo} ${def.rarity.toUpperCase()} DISCOVERY
    </div>
    <div class="fanfare-emoji">${emoji}</div>
    <div class="fanfare-title" style="color:${color}">${def.name}</div>
    <div class="fanfare-lore">"${def.lore}"</div>
    <div class="fanfare-stats">
      <div class="fanfare-stat">
        <div class="fanfare-stat__value" style="color:var(--color-goo)">${formatNumber(production)}/s</div>
        <div class="fanfare-stat__label">Production</div>
      </div>
      <div class="fanfare-stat">
        <div class="fanfare-stat__value">#${totalDiscoveries}</div>
        <div class="fanfare-stat__label">Your Discovery</div>
      </div>
    </div>
    ${def.parent1 && def.parent2 ? `
      <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">
        Recipe: ${getSlime(def.parent1)?.name ?? '?'} + ${getSlime(def.parent2)?.name ?? '?'}
      </div>
    ` : ''}
    <div class="fanfare-reward">+1 💎 Prism Shard earned!</div>
    <button class="btn btn--primary" style="margin-top:8px;width:100%">Add to Collection</button>
  `

  _overlay.classList.add('open')

  // Screen shake for Epic+
  if (isEpicPlus) {
    const app = document.getElementById('app')!
    app.style.animation = 'screen-shake 0.4s ease-out'
    setTimeout(() => { app.style.animation = '' }, 400)
  }

  // Auto-dismiss for Common/Uncommon
  if (!['Rare', 'Epic', 'Legendary', 'Mythic'].includes(def.rarity)) {
    setTimeout(() => dismissFanfare(), 2000)
  }
}

function dismissFanfare(): void {
  if (!_overlay) return
  _overlay.classList.remove('open')
  setTimeout(() => processQueue(), 300)
}
