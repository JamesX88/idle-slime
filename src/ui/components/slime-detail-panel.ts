import { getSlime, rarityColor, rarityIcon } from '../../game/slimes'
import { getState } from '../../game/state'
import { canFeed, feed, canMerge, merge } from '../../game/breeds'
import { slimeGooPerSec, feedCost, formatGoo, formatRate } from '../../game/economy'
import { subscribe } from '../../game/state'
import { MAX_SLIME_LEVEL, MERGE_COUNT_REQUIRED } from '../../data/config'
import type { SlimeId } from '../../game/types'

let overlayEl: HTMLElement | null = null
let panelEl: HTMLElement | null = null
let contentEl: HTMLElement | null = null
let currentSlimeId: SlimeId | null = null
let unsubscribe: (() => void) | null = null

export function initSlimeDetailPanel(): void {
  overlayEl = document.createElement('div')
  overlayEl.className = 'panel-overlay'
  overlayEl.addEventListener('click', close)

  panelEl = document.createElement('div')
  panelEl.className = 'panel'
  panelEl.setAttribute('role', 'dialog')
  panelEl.setAttribute('aria-modal', 'true')

  const handle = document.createElement('div')
  handle.className = 'panel__handle'

  contentEl = document.createElement('div')
  contentEl.className = 'panel__content'

  const closeBtn = document.createElement('button')
  closeBtn.className = 'panel__close'
  closeBtn.setAttribute('aria-label', 'Close')
  closeBtn.textContent = '✕'
  closeBtn.addEventListener('click', close)

  panelEl.appendChild(handle)
  panelEl.appendChild(closeBtn)
  panelEl.appendChild(contentEl)

  const app = document.getElementById('app')!
  app.appendChild(overlayEl)
  app.appendChild(panelEl)
}

export function openSlimeDetail(id: SlimeId): void {
  currentSlimeId = id
  render()
  overlayEl?.classList.add('open')
  panelEl?.classList.add('open')

  unsubscribe = subscribe(() => {
    if (currentSlimeId) render()
  })
}

function close(): void {
  overlayEl?.classList.remove('open')
  panelEl?.classList.remove('open')
  currentSlimeId = null
  unsubscribe?.()
  unsubscribe = null
}

function render(): void {
  if (!currentSlimeId || !contentEl) return
  const state = getState()
  const owned = state.collection[currentSlimeId]
  const def = getSlime(currentSlimeId)
  if (!def) return

  const color = rarityColor(def.rarity)
  const icon = rarityIcon(def.rarity)
  const production = owned ? slimeGooPerSec(owned) * owned.count : 0
  const level = owned?.level ?? 1
  const count = owned?.count ?? 0
  const nextFeedCost = owned ? feedCost(owned) : 0
  const levelPct = ((level - 1) / (MAX_SLIME_LEVEL - 1)) * 100
  const canFeedNow = canFeed(currentSlimeId)
  const canMergeNow = canMerge(currentSlimeId)
  const mergeProgress = Math.min(count, MERGE_COUNT_REQUIRED)

  contentEl.innerHTML = `
    <div class="slime-detail__header">
      <div class="slime-detail__emoji">🟢</div>
      <div>
        <div class="slime-detail__name">${def.name}</div>
        <div class="slime-detail__rarity" style="color:${color}">${icon} ${def.rarity}</div>
      </div>
    </div>

    <div class="slime-detail__lore">"${def.lore}"</div>

    <div class="slime-detail__stats">
      <div class="stat-box">
        <div class="stat-box__label">Production</div>
        <div class="stat-box__value">${formatRate(production)}</div>
      </div>
      <div class="stat-box">
        <div class="stat-box__label">Copies owned</div>
        <div class="stat-box__value">${count}</div>
      </div>
      <div class="stat-box">
        <div class="stat-box__label">Favorite Food</div>
        <div class="stat-box__value">${def.favoriteFood}</div>
      </div>
      <div class="stat-box">
        <div class="stat-box__label">Element</div>
        <div class="stat-box__value">${def.element.join(', ')}</div>
      </div>
    </div>

    <div class="level-bar">
      <div class="level-bar__header">
        <span>Level ${level} / ${MAX_SLIME_LEVEL}</span>
        ${level < MAX_SLIME_LEVEL ? `<span>${formatGoo(nextFeedCost)} 💧 to level up</span>` : '<span>MAX LEVEL ✨</span>'}
      </div>
      <div class="level-bar__track">
        <div class="level-bar__fill" style="width:${levelPct}%"></div>
      </div>
    </div>

    <div class="detail-actions">
      <button class="btn btn--primary" id="dp-feed" ${canFeedNow ? '' : 'disabled'}>
        Feed ${canFeedNow ? `— ${formatGoo(nextFeedCost)} 💧` : level >= MAX_SLIME_LEVEL ? '(max)' : '(need goo)'}
      </button>
      <button class="btn btn--secondary" id="dp-merge" ${canMergeNow ? '' : 'disabled'}>
        Merge (${mergeProgress}/${MERGE_COUNT_REQUIRED})
      </button>
    </div>
  `

  contentEl.querySelector('#dp-feed')?.addEventListener('click', () => {
    feed(currentSlimeId!)
  })

  contentEl.querySelector('#dp-merge')?.addEventListener('click', () => {
    merge(currentSlimeId!)
    if (!getState().collection[currentSlimeId!]) close()
  })
}
