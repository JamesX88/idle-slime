// Zone Map screen — unlock and switch zones
import { getState, setState, subscribe } from '../../game/state'
import type { ZoneId } from '../../game/state'
import { getZoneSlimes, formatNumber } from '../../game/slimes'
import { canUnlockZone, unlockZone, getZoneUnlockCost } from '../../game/economy'
import { ZONE_NAMES, ZONE_THEMES } from '../../data/config'
import { navigateBack } from '../router'
import { showNotif } from '../components/notif'

export function buildZoneMapScreen(container: HTMLElement): void {
  container.innerHTML = `
    <div class="screen-header">
      <button class="back-btn" id="zone-back">←</button>
      <div class="screen-header__title">Zone Map</div>
    </div>
    <div class="scroll-content" id="zone-list"></div>
  `

  container.querySelector('#zone-back')!.addEventListener('click', () => navigateBack())

  // Event delegation on zone list
  const list = container.querySelector('#zone-list')!
  list.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button[data-zone-action]') as HTMLElement | null
    if (!btn) return

    const zone = parseInt(btn.dataset.zone ?? '1') as ZoneId
    const action = btn.dataset.zoneAction

    if (action === 'switch') {
      setState(state => { state.activeZone = zone })
      showNotif(`Switched to ${ZONE_NAMES[zone]}!`)
    } else if (action === 'unlock') {
      let success = false
      setState(state => { success = unlockZone(state, zone) })
      if (success) {
        showNotif(`🎉 ${ZONE_NAMES[zone]} unlocked!`)
      } else {
        showNotif('Not enough Goo!')
      }
    }

    renderZones(container)
  })

  window.addEventListener('screen-change', (e: Event) => {
    const detail = (e as CustomEvent).detail
    if (detail.screen === 'zone-map') renderZones(container)
  })

  subscribe(() => renderZones(container))
  renderZones(container)
}

function renderZones(container: HTMLElement): void {
  const list = container.querySelector('#zone-list')
  if (!list) return

  const state = getState()
  const allZones: ZoneId[] = [1, 2, 3, 4, 5, 6]

  let html = '<div class="zone-list">'

  for (const zone of allZones) {
    const isUnlocked = state.unlockedZones.includes(zone)
    const isActive = state.activeZone === zone
    const theme = ZONE_THEMES[zone]
    const name = ZONE_NAMES[zone]
    const cost = getZoneUnlockCost(zone)
    const canUnlock = canUnlockZone(state, zone)
    const prevUnlocked = zone === 1 || state.unlockedZones.includes((zone - 1) as ZoneId)

    // Discovery progress
    const zoneSlimes = getZoneSlimes(zone)
    const discovered = zoneSlimes.filter(s => !!state.collection[s.id]).length
    const total = zoneSlimes.length
    const progressPct = total > 0 ? (discovered / total) * 100 : 0

    let statusText = ''
    let actionHtml = ''

    if (isActive) {
      statusText = '✓ Currently Active'
    } else if (isUnlocked) {
      statusText = `${discovered}/${total} slimes discovered`
    } else if (!prevUnlocked) {
      statusText = 'Unlock previous zone first'
    } else {
      statusText = `Requires ${formatNumber(cost)} 💧`
    }

    if (isUnlocked && !isActive) {
      actionHtml = `
        <button class="btn btn--secondary btn--sm" data-zone-action="switch" data-zone="${zone}">
          Switch Zone
        </button>
      `
    } else if (!isUnlocked && prevUnlocked) {
      actionHtml = `
        <button class="btn ${canUnlock ? 'btn--primary' : 'btn--secondary'} btn--sm"
          data-zone-action="unlock" data-zone="${zone}"
          ${!canUnlock ? 'disabled' : ''}>
          Unlock — ${formatNumber(cost)} 💧
        </button>
      `
    }

    html += `
      <div class="zone-item ${isActive ? 'active-zone' : ''} ${!isUnlocked ? 'locked' : ''}"
        style="${isActive ? `border-color:${theme.accent}` : ''}">
        <div class="zone-item__header">
          <div class="zone-item__emoji">${theme.emoji}</div>
          <div class="zone-item__info">
            <div class="zone-item__name">${name}</div>
            <div class="zone-item__status">${statusText}</div>
          </div>
          ${actionHtml}
        </div>

        ${isUnlocked ? `
          <div class="zone-item__progress">
            <div class="zone-item__progress-bar">
              <div class="zone-item__progress-fill"
                style="width:${progressPct}%;background:${theme.accent}">
              </div>
            </div>
            <div class="zone-item__progress-text">
              <span>${discovered} discovered</span>
              <span>${total} total</span>
            </div>
          </div>
        ` : ''}
      </div>
    `
  }

  html += '</div>'
  list.innerHTML = html
}
