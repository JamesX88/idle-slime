// Breed Lab screen
import { getState, setState, subscribe } from '../../game/state'
import type { SlimeId } from '../../game/state'
import { getSlime, rarityColor, slimeEmoji, formatTime } from '../../game/slimes'
import { startBreed, collectBreedResult } from '../../game/breeds'
import { navigateBack } from '../router'
import { showFanfare } from '../fanfare'
import { showNotif } from '../components/notif'

interface RecentBreed {
  resultId: string
  isNew: boolean
  timestamp: number
}

const recentBreeds: RecentBreed[] = []
const MAX_RECENT = 5

export function buildBreedLabScreen(container: HTMLElement): void {
  container.innerHTML = `
    <div class="screen-header">
      <button class="back-btn" id="breed-back">←</button>
      <div class="screen-header__title">Breed Lab</div>
    </div>
    <div class="scroll-content" id="breed-content"></div>
  `

  container.querySelector('#breed-back')!.addEventListener('click', () => navigateBack())

  // Event delegation on breed content
  const content = container.querySelector('#breed-content')!
  content.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null
    if (!target || target.disabled) return

    const action = target.dataset.action
    const slotId = parseInt(target.dataset.slot ?? '-1')

    if (action === 'pick-parent') {
      const parentNum = parseInt(target.dataset.parent ?? '1')
      openParentPicker(slotId, parentNum, container)
    } else if (action === 'start-breed') {
      handleStartBreed(slotId)
    } else if (action === 'collect') {
      handleCollect(slotId)
    }
  })

  window.addEventListener('screen-change', (e: Event) => {
    const detail = (e as CustomEvent).detail
    if (detail.screen === 'breed-lab') renderBreedContent(container)
  })

  subscribe(() => renderBreedContent(container))
  renderBreedContent(container)
}

// Per-slot pending parent selections (persists across renders)
const pendingParents: Record<number, { p1: SlimeId | null; p2: SlimeId | null }> = {}

function renderBreedContent(container: HTMLElement): void {
  const content = container.querySelector('#breed-content')
  if (!content) return

  const state = getState()
  const now = Date.now()

  let html = ''

  for (const slot of state.breedSlots) {
    const pending = pendingParents[slot.id] ?? { p1: null, p2: null }
    const p1Name = pending.p1 ? (getSlime(pending.p1)?.name ?? pending.p1) : null
    const p2Name = pending.p2 ? (getSlime(pending.p2)?.name ?? pending.p2) : null

    let statusHtml = ''
    let bodyHtml = ''

    if (slot.locked) {
      const unlockInfo = slot.id === 1 ? 'Discovery Lv.4 (50 ✨)'
        : slot.id === 2 ? 'Discovery Lv.9 (300 ✨)'
        : 'Discovery Lv.15 + 50 💎'

      statusHtml = `<span class="breed-slot__status locked">🔒 Locked</span>`
      bodyHtml = `<div style="font-size:var(--font-size-sm);color:var(--color-text-muted)">Unlock with ${unlockInfo}</div>`
    } else if (slot.resultId !== null) {
      // Result ready to collect
      const def = getSlime(slot.resultId)
      const color = def ? rarityColor(def.rarity) : '#9ca3af'
      const emoji = def ? slimeEmoji(slot.resultId) : '🟢'
      statusHtml = `<span class="breed-slot__status done">✨ Done!</span>`
      bodyHtml = `
        <div class="breed-result-banner">
          <span style="font-size:24px">${emoji}</span>
          <div style="flex:1">
            <div style="font-weight:700;color:${color}">${def?.name ?? '???'}</div>
            <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">${def?.rarity ?? ''}</div>
          </div>
          <button class="btn btn--primary btn--sm" data-action="collect" data-slot="${slot.id}">
            Collect!
          </button>
        </div>
      `
    } else if (slot.startTime !== null) {
      // Brewing
      const elapsed = now - slot.startTime
      const progress = Math.min(elapsed / slot.cooldownMs, 1)
      const remaining = Math.max(slot.cooldownMs - elapsed, 0)
      const p1Def = slot.parent1 ? getSlime(slot.parent1) : null
      const p2Def = slot.parent2 ? getSlime(slot.parent2) : null

      statusHtml = `<span class="breed-slot__status brewing">⏱ ${formatTime(remaining)}</span>`
      bodyHtml = `
        <div style="display:flex;align-items:center;gap:8px;font-size:var(--font-size-sm)">
          <span>${p1Def ? slimeEmoji(slot.parent1!) : '?'} ${p1Def?.name ?? '?'}</span>
          <span style="color:var(--color-text-muted)">×</span>
          <span>${p2Def ? slimeEmoji(slot.parent2!) : '?'} ${p2Def?.name ?? '?'}</span>
        </div>
        <div class="breed-progress">
          <div class="breed-progress__fill" style="width:${progress * 100}%"></div>
        </div>
      `
    } else {
      // Ready for input
      statusHtml = `<span class="breed-slot__status ready">✓ Ready</span>`
      const canBreed = !!(pending.p1 && pending.p2)

      bodyHtml = `
        <div class="breed-slot__parents">
          <button class="parent-btn ${pending.p1 ? 'filled' : ''}"
            data-action="pick-parent" data-slot="${slot.id}" data-parent="1">
            ${p1Name ? `${slimeEmoji(pending.p1!)} ${p1Name}` : '+ Parent 1'}
          </button>
          <span class="breed-slot__multiply">×</span>
          <button class="parent-btn ${pending.p2 ? 'filled' : ''}"
            data-action="pick-parent" data-slot="${slot.id}" data-parent="2">
            ${p2Name ? `${slimeEmoji(pending.p2!)} ${p2Name}` : '+ Parent 2'}
          </button>
          <button class="btn btn--primary btn--sm" data-action="start-breed" data-slot="${slot.id}"
            ${!canBreed ? 'disabled' : ''} style="flex-shrink:0">
            ▶
          </button>
        </div>
      `
    }

    html += `
      <div class="breed-slot ${slot.locked ? 'locked' : ''}">
        <div class="breed-slot__header">
          <span>Slot ${slot.id + 1}</span>
          ${statusHtml}
        </div>
        ${bodyHtml}
      </div>
    `
  }

  // Recent breeds
  if (recentBreeds.length > 0) {
    html += `
      <div class="recent-breeds">
        <div class="recent-breeds__title">Recent Breeds</div>
        ${recentBreeds.slice().reverse().map(rb => {
          const def = getSlime(rb.resultId)
          const color = def ? rarityColor(def.rarity) : '#9ca3af'
          const emoji = def ? slimeEmoji(rb.resultId) : '🟢'
          const isMud = rb.resultId === '513'
          return `
            <div class="recent-breed-item">
              <span>${emoji}</span>
              <span style="flex:1;color:${color}">${def?.name ?? '???'}</span>
              ${rb.isNew ? '<span class="recent-breed-item__new">NEW!</span>' : ''}
              ${isMud ? '<span class="recent-breed-item__fail">⚠ Incompatible</span>' : ''}
            </div>
          `
        }).join('')}
      </div>
    `
  }

  content.innerHTML = html
}

function handleStartBreed(slotId: number): void {
  const pending = pendingParents[slotId]
  if (!pending?.p1 || !pending?.p2) return

  let success = false
  setState(state => {
    success = startBreed(state, slotId, pending.p1!, pending.p2!)
  })

  if (success) {
    delete pendingParents[slotId]
    showNotif('Breeding started!')
  } else {
    showNotif('Cannot start breed — check your collection.')
  }
}

function handleCollect(slotId: number): void {
  let result: { resultId: string; isNew: boolean } | null = null

  setState(state => {
    result = collectBreedResult(state, slotId)
  })

  if (!result) return

  const { resultId, isNew } = result as { resultId: string; isNew: boolean }
  const def = getSlime(resultId)

  recentBreeds.push({ resultId, isNew, timestamp: Date.now() })
  if (recentBreeds.length > MAX_RECENT) recentBreeds.shift()

  if (isNew && resultId !== '513') {
    showFanfare(resultId)
  } else if (def) {
    showNotif(`${slimeEmoji(resultId)} ${def.name} collected!`)
  }
}

// ---- Parent Picker ----

let _pickerOverlay: HTMLElement | null = null
let _pickerPanel: HTMLElement | null = null

function openParentPicker(slotId: number, parentNum: number, screenContainer: HTMLElement): void {
  // Remove any existing picker
  _pickerOverlay?.remove()
  _pickerPanel?.remove()

  const state = getState()
  const ownedIds = Object.keys(state.collection)

  if (ownedIds.length === 0) {
    showNotif('No slimes in collection yet!')
    return
  }

  const app = document.getElementById('app')!

  _pickerOverlay = document.createElement('div')
  _pickerOverlay.className = 'panel-overlay open'
  _pickerOverlay.style.zIndex = '200'

  _pickerPanel = document.createElement('div')
  _pickerPanel.className = 'panel open'
  _pickerPanel.style.zIndex = '201'

  const handle = document.createElement('div')
  handle.className = 'panel__handle'

  const content = document.createElement('div')
  content.className = 'panel__content'

  const title = document.createElement('div')
  title.style.cssText = 'font-weight:700;margin-bottom:12px;font-size:var(--font-size-md)'
  title.textContent = `Select Parent ${parentNum}`

  // Warning if any slime has only 1 copy
  const hasSingleCopies = ownedIds.some(id => state.collection[id].count === 1)
  let warningHtml = ''
  if (hasSingleCopies) {
    warningHtml = `<div class="picker-warning">⚠️ Slimes with ×1 will be consumed on breed</div>`
  }

  const grid = document.createElement('div')
  grid.className = 'picker-grid'

  for (const id of ownedIds) {
    const def = getSlime(id)
    if (!def) continue
    const owned = state.collection[id]
    const color = rarityColor(def.rarity)
    const emoji = slimeEmoji(id)

    const cell = document.createElement('button')
    cell.className = 'picker-cell'
    cell.style.borderColor = color
    cell.dataset.pickId = id
    cell.innerHTML = `
      <span class="picker-cell__emoji">${emoji}</span>
      <div class="picker-cell__info">
        <div class="picker-cell__name">${def.name}</div>
        <div class="picker-cell__sub" style="color:${color}">
          ${def.rarity} · ×${owned.count} · lv.${owned.level}
        </div>
      </div>
    `

    cell.addEventListener('click', () => {
      if (!pendingParents[slotId]) pendingParents[slotId] = { p1: null, p2: null }
      if (parentNum === 1) pendingParents[slotId].p1 = id
      else pendingParents[slotId].p2 = id

      _pickerOverlay?.remove()
      _pickerPanel?.remove()
      _pickerOverlay = null
      _pickerPanel = null
    })

    grid.appendChild(cell)
  }

  content.innerHTML = warningHtml
  content.appendChild(title)
  content.appendChild(grid)

  _pickerPanel.appendChild(handle)
  _pickerPanel.appendChild(content)

  _pickerOverlay.addEventListener('click', () => {
    _pickerOverlay?.remove()
    _pickerPanel?.remove()
    _pickerOverlay = null
    _pickerPanel = null
  })

  app.appendChild(_pickerOverlay)
  app.appendChild(_pickerPanel)
}
