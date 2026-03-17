// Slime detail slide-up panel
import { getState, setState } from '../../game/state'
import { getSlime, rarityColor, rarityEmoji, slimeEmoji, formatNumber } from '../../game/slimes'
import { getFeedCost, canFeed, feedSlime, canMerge, mergeSlimes, computeSlimeOutput } from '../../game/economy'
import { MAX_LEVEL } from '../../data/config'
import { showFanfare } from '../fanfare'
import { showNotif } from './notif'

let _overlay: HTMLElement
let _panel: HTMLElement
let _content: HTMLElement
let _currentSlimeId: string | null = null

export function initSlimePanel(container: HTMLElement): void {
  _overlay = document.createElement('div')
  _overlay.className = 'panel-overlay'

  _panel = document.createElement('div')
  _panel.className = 'panel'

  const handle = document.createElement('div')
  handle.className = 'panel__handle'

  _content = document.createElement('div')
  _content.className = 'panel__content'

  _panel.appendChild(handle)
  _panel.appendChild(_content)

  container.appendChild(_overlay)
  container.appendChild(_panel)

  _overlay.addEventListener('click', closePanel)

  // Event delegation on panel content
  _content.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button')
    if (!btn) return

    if (btn.id === 'panel-feed-btn') {
      handleFeed()
    } else if (btn.id === 'panel-merge-btn') {
      handleMerge()
    }
  })
}

export function openSlimePanel(slimeId: string): void {
  _currentSlimeId = slimeId
  renderPanel()
  _overlay.classList.add('open')
  _panel.classList.add('open')
}

export function closePanel(): void {
  _overlay.classList.remove('open')
  _panel.classList.remove('open')
  _currentSlimeId = null
}

export function refreshPanel(): void {
  if (_currentSlimeId && _panel.classList.contains('open')) {
    renderPanel()
  }
}

function renderPanel(): void {
  const id = _currentSlimeId
  if (!id) return

  const state = getState()
  const owned = state.collection[id]
  const def = getSlime(id)
  if (!def || !owned) { closePanel(); return }

  const feedCost = getFeedCost(state, id)
  const canFeedNow = canFeed(state, id)
  const canMergeNow = canMerge(state, id)
  const mergeCount = owned.count
  const isMaxLevel = owned.level >= MAX_LEVEL
  const color = rarityColor(def.rarity)
  const emoji = slimeEmoji(id)
  const rarityEmo = rarityEmoji(def.rarity)

  // Production at current level
  const production = computeSlimeOutput(state, id)

  // Level progress (visual only — shows cost toward next level)
  const levelFrac = isMaxLevel ? 1 : Math.min(state.goo / (feedCost ?? 1), 1)

  _content.innerHTML = `
    <div class="slime-detail">
      <div class="slime-detail__header">
        <div class="slime-detail__emoji">${emoji}</div>
        <div class="slime-detail__info">
          <div class="slime-detail__name">${def.name}</div>
          <div class="slime-detail__rarity" style="color:${color}">${rarityEmo} ${def.rarity}</div>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-top:4px">
            Favorite: ${def.favoriteFood}
          </div>
        </div>
      </div>

      <div class="slime-detail__lore">"${def.lore}"</div>

      <div class="slime-detail__stats">
        <div class="stat-item">
          <div class="stat-item__label">Production</div>
          <div class="stat-item__value" style="color:var(--color-goo)">${formatNumber(production)}/s</div>
        </div>
        <div class="stat-item">
          <div class="stat-item__label">Owned</div>
          <div class="stat-item__value">×${owned.count}</div>
        </div>
        <div class="stat-item">
          <div class="stat-item__label">Element</div>
          <div class="stat-item__value" style="font-size:var(--font-size-sm)">${def.element}</div>
        </div>
        <div class="stat-item">
          <div class="stat-item__label">Discovery #</div>
          <div class="stat-item__value">${owned.discoveryNumber}</div>
        </div>
      </div>

      <div class="level-bar">
        <div class="level-bar__header">
          <span>Level ${owned.level} / ${MAX_LEVEL}</span>
          <span style="color:var(--color-text-muted);font-size:var(--font-size-xs)">
            ${isMaxLevel ? '✓ MAX' : `Next: ${formatNumber(feedCost ?? 0)} 💧`}
          </span>
        </div>
        <div class="level-bar__track">
          <div class="level-bar__fill" style="width:${levelFrac * 100}%"></div>
        </div>
      </div>

      <div class="slime-detail__actions">
        <button id="panel-feed-btn" class="btn ${canFeedNow ? 'btn--primary' : 'btn--secondary'}"
          ${!canFeedNow ? 'disabled' : ''}>
          ${isMaxLevel ? '✓ Max Level' : `Feed — ${formatNumber(feedCost ?? 0)} 💧`}
        </button>
        <button id="panel-merge-btn" class="btn ${canMergeNow ? 'btn--secondary' : 'btn--secondary'}"
          ${!canMergeNow ? 'disabled' : ''}>
          Merge (${mergeCount}/3)
        </button>
      </div>
    </div>
  `
}

function handleFeed(): void {
  const id = _currentSlimeId
  if (!id) return

  setState(state => {
    const { essenceGained, maxLevelReached } = feedSlime(state, id)
    if (maxLevelReached && essenceGained > 0) {
      showNotif(`✨ Max level! +${essenceGained} Essence`)
    }
  })
  renderPanel()
}

function handleMerge(): void {
  const id = _currentSlimeId
  if (!id) return

  // mergeSlimes is now fully self-contained: it handles collection mutation,
  // discovery tracking, and shard grants internally. The UI only reads the
  // result descriptor to decide how to present feedback.
  let resultId: string | null = null
  let isNew = false
  let shardsGained = 0
  let essenceGained = 0

  setState(state => {
    const result = mergeSlimes(state, id)
    resultId = result.resultId
    isNew = result.isNew
    shardsGained = result.shardsGained
    essenceGained = result.essenceGained
  })

  closePanel()

  if (shardsGained > 0 && !resultId) {
    // Max-rarity merge — no new slime produced
    showNotif(`💎 Max rarity merge! +${essenceGained} ✨ +${shardsGained} 💎`)
    return
  }

  if (resultId) {
    const def = getSlime(resultId)
    if (def && isNew) {
      setTimeout(() => showFanfare(resultId!), 100)
    } else if (def) {
      showNotif(`Merge → ${def.name}!`)
    }
  }
}
