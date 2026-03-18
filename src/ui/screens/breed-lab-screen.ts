// Breed Lab screen — NO subscribe() to prevent 100ms re-render thrash
// Slots are rebuilt only when slot state changes (structural diff).
// Timer countdowns use a rAF loop that only patches text nodes.
import { getState, setState } from '../../game/state'
import type { SlimeId, BreedSlot } from '../../game/state'
import { getSlime, rarityColor, slimeEmoji, formatTime, rarityEmoji } from '../../game/slimes'
import { startBreed, collectBreedResult } from '../../game/breeds'
import { navigateBack } from '../router'
import { showFanfare } from '../fanfare'
import { showNotif } from '../components/notif'
import type { Rarity } from '../../game/state'

interface RecentBreed {
  resultId: string
  isNew: boolean
  timestamp: number
}

const recentBreeds: RecentBreed[] = []
const MAX_RECENT = 5

// Per-slot pending parent selections (persists across renders)
const pendingParents: Record<number, { p1: SlimeId | null; p2: SlimeId | null }> = {}

// Last-rendered slot snapshot for structural diffing
let _lastSlotHash = ''
let _lastAutoBreedHash = ''
let _rafId: number | null = null
let _isActive = false

const RARITIES: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic']

export function buildBreedLabScreen(container: HTMLElement): void {
  container.innerHTML = `
    <div class="screen-header">
      <button class="back-btn" id="breed-back">←</button>
      <div class="screen-header__title">Breed Lab</div>
    </div>
    <div class="scroll-content" id="breed-content"></div>
  `

  container.querySelector('#breed-back')!.addEventListener('click', () => {
    navigateBack()
    _isActive = false
  })

  // Event delegation on breed content — never re-attached
  const content = container.querySelector('#breed-content')!
  content.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null
    if (!target) return
    if (target.dataset.disabled === 'true') return

    const action = target.dataset.action
    const slotId = parseInt(target.dataset.slot ?? '-1')

    if (action === 'pick-parent') {
      const parentNum = parseInt(target.dataset.parent ?? '1')
      openParentPicker(slotId, parentNum, container)
    } else if (action === 'start-breed') {
      handleStartBreed(slotId)
    } else if (action === 'collect') {
      handleCollect(slotId)
    } else if (action === 'toggle-auto-breed') {
      handleToggleAutoBreed()
    } else if (action === 'set-max-rarity') {
      handleSetMaxRarity(target.dataset.rarity as Rarity | 'any')
    }
  })

  // Activate on screen-change, deactivate when leaving
  window.addEventListener('screen-change', (e: Event) => {
    const detail = (e as CustomEvent).detail
    if (detail.screen === 'breed-lab') {
      _isActive = true
      _lastSlotHash = ''
      _lastAutoBreedHash = ''
      rebuildIfNeeded(container)
      startTickLoop(container)
    } else {
      _isActive = false
    }
  })
}

// ---- Auto-breed panel ----

function autoBreedHash(state: ReturnType<typeof getState>): string {
  const ab = state.autoBreed
  return `${ab.enabled}:${ab.maxRarity}:${ab.autoCollect}`
}

function buildAutoBreedPanel(state: ReturnType<typeof getState>): string {
  const ab = state.autoBreed
  const toggleLabel = ab.enabled ? '⏸ Auto-Breed ON' : '▶ Auto-Breed OFF'
  const toggleClass = ab.enabled ? 'btn--primary' : 'btn--secondary'

  const rarityChips = RARITIES.map(r => {
    const isActive = ab.maxRarity === r
    const color = rarityColor(r)
    return `<button
      class="rarity-chip ${isActive ? 'rarity-chip--active' : ''}"
      data-action="set-max-rarity"
      data-rarity="${r}"
      style="${isActive ? `background:${color};color:#000;border-color:${color}` : `border-color:${color};color:${color}`}"
      title="Use parents up to ${r} rarity"
    >${rarityEmoji(r)} ${r}</button>`
  }).join('')

  const anyActive = ab.maxRarity === null
  const anyChip = `<button
    class="rarity-chip ${anyActive ? 'rarity-chip--active rarity-chip--any' : ''}"
    data-action="set-max-rarity"
    data-rarity="any"
    title="Use any rarity parent"
  >✨ Any</button>`

  const statusText = ab.enabled
    ? (ab.maxRarity
        ? `Using up to <strong style="color:${rarityColor(ab.maxRarity)}">${ab.maxRarity}</strong> parents`
        : 'Using <strong>any rarity</strong> parents')
    : 'Enable to automatically queue breed pairs'

  return `
    <div class="auto-breed-panel">
      <div class="auto-breed-panel__header">
        <span class="auto-breed-panel__title">🤖 Auto-Breed</span>
        <button class="btn btn--sm ${toggleClass}" data-action="toggle-auto-breed">
          ${toggleLabel}
        </button>
      </div>
      <div class="auto-breed-panel__status">${statusText}</div>
      <div class="auto-breed-panel__label">Max parent rarity:</div>
      <div class="rarity-chip-row">
        ${rarityChips}
        ${anyChip}
      </div>
    </div>
  `
}

// ---- Structural rebuild (only when slot state changes) ----

function slotHash(slots: BreedSlot[], pending: typeof pendingParents): string {
  return slots.map(s => {
    const p = pending[s.id] ?? { p1: null, p2: null }
    return `${s.id}:${s.locked}:${s.resultId}:${s.parent1}:${s.parent2}:${s.startTime !== null ? 'brewing' : 'idle'}:${p.p1}:${p.p2}`
  }).join('|') + '|recent:' + recentBreeds.map(r => r.resultId).join(',')
}

function rebuildIfNeeded(container: HTMLElement): void {
  const state = getState()
  const sHash = slotHash(state.breedSlots, pendingParents)
  const abHash = autoBreedHash(state)
  if (sHash === _lastSlotHash && abHash === _lastAutoBreedHash) return
  _lastSlotHash = sHash
  _lastAutoBreedHash = abHash
  buildSlots(container, state)
}

function buildSlots(container: HTMLElement, state: ReturnType<typeof getState>): void {
  const content = container.querySelector('#breed-content')
  if (!content) return

  const now = Date.now()
  let html = ''

  // Auto-breed panel at the top
  html += buildAutoBreedPanel(state)

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
      const elapsed = now - slot.startTime
      const progress = Math.min(elapsed / slot.cooldownMs, 1)
      const remaining = Math.max(slot.cooldownMs - elapsed, 0)
      const p1Def = slot.parent1 ? getSlime(slot.parent1) : null
      const p2Def = slot.parent2 ? getSlime(slot.parent2) : null

      statusHtml = `<span class="breed-slot__status brewing" id="breed-timer-${slot.id}">⏱ ${formatTime(remaining)}</span>`
      bodyHtml = `
        <div style="display:flex;align-items:center;gap:8px;font-size:var(--font-size-sm)">
          <span>${p1Def ? slimeEmoji(slot.parent1!) : '?'} ${p1Def?.name ?? '?'}</span>
          <span style="color:var(--color-text-muted)">×</span>
          <span>${p2Def ? slimeEmoji(slot.parent2!) : '?'} ${p2Def?.name ?? '?'}</span>
        </div>
        <div class="breed-progress">
          <div class="breed-progress__fill" id="breed-fill-${slot.id}" style="width:${progress * 100}%"></div>
        </div>
      `
    } else {
      const canBreed = !!(pending.p1 && pending.p2)
      statusHtml = `<span class="breed-slot__status ready">✓ Ready</span>`
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
          <button class="btn btn--primary btn--sm"
            data-action="start-breed" data-slot="${slot.id}"
            data-disabled="${!canBreed}"
            style="flex-shrink:0;${!canBreed ? 'opacity:0.45;cursor:not-allowed' : ''}">
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

// ---- rAF tick loop — only patches timer text and progress bar width ----

function startTickLoop(container: HTMLElement): void {
  if (_rafId !== null) cancelAnimationFrame(_rafId)

  function tick() {
    if (!_isActive) {
      _rafId = null
      return
    }

    const state = getState()
    const now = Date.now()

    // Check if structural rebuild is needed (slot completed, collected, etc.)
    rebuildIfNeeded(container)

    // Patch only timer text and progress bar — no innerHTML replacement
    for (const slot of state.breedSlots) {
      if (slot.startTime === null || slot.resultId !== null) continue
      const remaining = Math.max(slot.cooldownMs - (now - slot.startTime), 0)
      const progress = Math.min((now - slot.startTime) / slot.cooldownMs, 1)

      const timerEl = document.getElementById(`breed-timer-${slot.id}`)
      if (timerEl) timerEl.textContent = `⏱ ${formatTime(remaining)}`

      const fillEl = document.getElementById(`breed-fill-${slot.id}`) as HTMLElement | null
      if (fillEl) fillEl.style.width = `${progress * 100}%`
    }

    _rafId = requestAnimationFrame(tick)
  }

  _rafId = requestAnimationFrame(tick)
}

// ---- Action handlers ----

function handleStartBreed(slotId: number): void {
  const pending = pendingParents[slotId]
  if (!pending?.p1 || !pending?.p2) return

  let success = false
  setState(state => {
    success = startBreed(state, slotId, pending.p1!, pending.p2!)
  })

  if (success) {
    delete pendingParents[slotId]
    _lastSlotHash = '' // force rebuild
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
  _lastSlotHash = '' // force rebuild

  if (isNew && resultId !== '513') {
    showFanfare(resultId)
  } else if (def) {
    showNotif(`${slimeEmoji(resultId)} ${def.name} collected!`)
  }
}

function handleToggleAutoBreed(): void {
  setState(state => {
    state.autoBreed.enabled = !state.autoBreed.enabled
  })
  const enabled = getState().autoBreed.enabled
  showNotif(enabled ? '🤖 Auto-Breed enabled!' : '⏸ Auto-Breed paused.')
  _lastAutoBreedHash = '' // force panel rebuild
}

function handleSetMaxRarity(rarity: Rarity | 'any'): void {
  setState(state => {
    state.autoBreed.maxRarity = rarity === 'any' ? null : rarity
  })
  _lastAutoBreedHash = '' // force panel rebuild
}

// ---- Parent Picker ----

let _pickerOverlay: HTMLElement | null = null
let _pickerPanel: HTMLElement | null = null

function openParentPicker(slotId: number, parentNum: number, screenContainer: HTMLElement): void {
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

  const hasSingleCopies = ownedIds.some(id => state.collection[id].count === 1)
  if (hasSingleCopies) {
    const warning = document.createElement('div')
    warning.className = 'picker-warning'
    warning.textContent = '⚠️ Slimes with ×1 will be consumed on breed'
    content.appendChild(warning)
  }

  content.appendChild(title)

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
      _lastSlotHash = '' // force slot rebuild to show selected parent
    })

    grid.appendChild(cell)
  }

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
