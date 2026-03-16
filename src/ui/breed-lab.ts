import { getState, subscribe } from '../game/state'
import { startBreed } from '../game/breeds'
import { getSlime, rarityColor } from '../game/slimes'
import { formatGoo } from '../game/economy'
import type { SlimeId } from '../game/types'

// Persists across re-renders so parent selections survive the 100ms production tick
const pendingSelections: Record<number, { p1: SlimeId | null, p2: SlimeId | null }> = {}

export function renderBreedLab(container: HTMLElement, onBack: () => void): void {
  container.innerHTML = `
    <div class="topbar">
      <button class="btn btn--secondary" id="back-btn" style="width:auto;flex:0">← Back</button>
      <div style="font-weight:700">Breed Lab</div>
      <div></div>
    </div>
    <div class="breed-lab" id="breed-lab-content"></div>
    <div style="padding:12px;border-top:1px solid var(--color-border);background:var(--color-bg-2)">
      <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">
        Recent breeds will appear here after completion.
      </div>
      <div id="recent-breeds" style="margin-top:6px;display:flex;flex-direction:column;gap:4px"></div>
    </div>
  `

  container.querySelector('#back-btn')?.addEventListener('click', onBack)

  subscribe(() => renderSlots(container))
  renderSlots(container)
}

function renderSlots(container: HTMLElement): void {
  const state = getState()
  const content = container.querySelector('#breed-lab-content')
  if (!content) return

  const now = Date.now()

  content.innerHTML = state.breedSlots.map((slot, i) => {
    if (slot.status === 'locked') {
      return `
        <div class="breed-slot">
          <div class="breed-slot__header">
            <span>Slot ${i + 1}</span>
            <span style="color:var(--color-text-muted)">🔒 Locked</span>
          </div>
          <div style="font-size:var(--font-size-xs);color:var(--color-text-muted)">
            Unlock via Discovery upgrades
          </div>
        </div>
      `
    }

    if (slot.status === 'breeding' && slot.startTime) {
      const elapsed = now - slot.startTime
      const pct = Math.min(100, (elapsed / slot.cooldownMs) * 100)
      const remaining = Math.max(0, Math.ceil((slot.cooldownMs - elapsed) / 1000))
      const p1 = getSlime(slot.parent1!)
      const p2 = getSlime(slot.parent2!)

      return `
        <div class="breed-slot">
          <div class="breed-slot__header">
            <span>Slot ${i + 1}</span>
            <span style="color:var(--color-accent)">⏱ ${remaining}s...</span>
          </div>
          <div class="breed-slot__parents">
            <div class="parent-picker filled">${p1?.name ?? '?'}</div>
            <span>×</span>
            <div class="parent-picker filled">${p2?.name ?? '?'}</div>
          </div>
          <div class="breed-progress">
            <div class="breed-progress__fill" style="width:${pct}%"></div>
          </div>
        </div>
      `
    }

    // Idle slot — restore any pending selections from module-level state
    const pending = pendingSelections[i]
    const p1Label = pending?.p1 ? (getSlime(pending.p1)?.name ?? pending.p1) : '+ Parent 1'
    const p2Label = pending?.p2 ? (getSlime(pending.p2)?.name ?? pending.p2) : '+ Parent 2'
    const canBreed = !!(pending?.p1 && pending?.p2)

    return `
      <div class="breed-slot" data-slot="${i}">
        <div class="breed-slot__header">
          <span>Slot ${i + 1}</span>
          <span style="color:var(--color-goo)">✓ Ready</span>
        </div>
        <div class="breed-slot__parents">
          <button class="parent-picker${pending?.p1 ? ' filled' : ''}" data-slot="${i}" data-parent="1" aria-label="Select first parent">
            ${p1Label}
          </button>
          <span>×</span>
          <button class="parent-picker${pending?.p2 ? ' filled' : ''}" data-slot="${i}" data-parent="2" aria-label="Select second parent">
            ${p2Label}
          </button>
          <button class="btn btn--primary" data-slot="${i}" data-action="breed"
            style="flex:0;padding:8px 12px" ${canBreed ? '' : 'disabled'}>
            ▶
          </button>
        </div>
      </div>
    `
  }).join('')

  content.querySelectorAll('[data-parent]').forEach(btn => {
    btn.addEventListener('click', () => {
      const slotIdx = parseInt((btn as HTMLElement).dataset['slot']!)
      const parentNum = parseInt((btn as HTMLElement).dataset['parent']!)
      openParentPicker(slotIdx, parentNum, (id) => {
        if (!pendingSelections[slotIdx]) pendingSelections[slotIdx] = { p1: null, p2: null }
        if (parentNum === 1) pendingSelections[slotIdx]!.p1 = id
        else pendingSelections[slotIdx]!.p2 = id
        // Next render cycle will reflect the selection in the buttons
      })
    })
  })

  content.querySelectorAll('[data-action="breed"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const slotIdx = parseInt((btn as HTMLElement).dataset['slot']!)
      const sel = pendingSelections[slotIdx]
      if (sel?.p1 && sel?.p2) {
        startBreed(slotIdx, sel.p1, sel.p2)
        delete pendingSelections[slotIdx]
      }
    })
  })
}

function openParentPicker(slotIndex: number, parentNum: number, onSelect: (id: SlimeId) => void): void {
  const state = getState()
  const overlay = document.createElement('div')
  overlay.className = 'panel-overlay open'
  overlay.style.zIndex = '200'

  const panel = document.createElement('div')
  panel.className = 'panel open'
  panel.style.zIndex = '201'
  panel.innerHTML = `
    <div class="panel__handle"></div>
    <div class="panel__content">
      <div style="font-weight:700;margin-bottom:12px">Select Parent ${parentNum}</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;max-height:60vh;overflow-y:auto">
        ${Object.values(state.collection).map(owned => {
          const def = getSlime(owned.id)
          if (!def) return ''
          const color = rarityColor(def.rarity)
          return `
            <button class="slime-cell" style="border-color:${color};aspect-ratio:unset;padding:8px;justify-content:flex-start;gap:6px;flex-direction:row"
              data-pick-id="${owned.id}">
              <span>🟢</span>
              <span style="font-size:var(--font-size-xs);text-align:left">
                ${def.name}<br>
                <span style="color:var(--color-text-muted)">×${owned.count} lv.${owned.level}</span>
              </span>
            </button>
          `
        }).join('')}
      </div>
    </div>
  `

  overlay.addEventListener('click', () => {
    overlay.remove()
    panel.remove()
  })

  panel.querySelectorAll('[data-pick-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = (btn as HTMLElement).dataset['pickId'] as SlimeId
      onSelect(id)
      overlay.remove()
      panel.remove()
    })
  })

  document.getElementById('app')!.appendChild(overlay)
  document.getElementById('app')!.appendChild(panel)
}
