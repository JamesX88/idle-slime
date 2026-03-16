// Upgrades screen — three tracks: Tap Power, Slime Output, Discovery
import { getState, setState, subscribe } from '../../game/state'
import { getTapUpgradeCost, getOutputUpgradeCost, getDiscoveryUpgradeCost } from '../../game/economy'
import { upgradeTap, upgradeOutput, upgradeDiscovery } from '../../game/upgrades'
import { formatNumber } from '../../game/slimes'
import {
  TAP_UPGRADE_MAX_LEVEL, OUTPUT_UPGRADE_MAX_LEVEL, DISCOVERY_UPGRADE_MAX_LEVEL,
  TAP_UPGRADE_NAMES, OUTPUT_UPGRADE_NAMES, DISCOVERY_UPGRADES,
  OUTPUT_MULTIPLIERS,
} from '../../data/config'
import { navigateBack } from '../router'
import { showNotif } from '../components/notif'

type Track = 'tap' | 'output' | 'discovery'

let _activeTrack: Track = 'tap'

export function buildUpgradesScreen(container: HTMLElement): void {
  container.innerHTML = `
    <div class="screen-header">
      <button class="back-btn" id="upg-back">←</button>
      <div class="screen-header__title">Upgrades</div>
    </div>

    <div class="upgrade-tabs">
      <button class="upgrade-tab active" data-track="tap">
        <span class="upgrade-tab__icon">👆</span>
        <span>Tap Power</span>
      </button>
      <button class="upgrade-tab" data-track="output">
        <span class="upgrade-tab__icon">🌀</span>
        <span>Output</span>
      </button>
      <button class="upgrade-tab" data-track="discovery">
        <span class="upgrade-tab__icon">🔍</span>
        <span>Discovery</span>
      </button>
    </div>

    <div class="scroll-content" id="upg-content"></div>
  `

  // Back button
  container.querySelector('#upg-back')!.addEventListener('click', () => navigateBack())

  // Tab switching — event delegation
  const tabs = container.querySelector('.upgrade-tabs')!
  tabs.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-track]') as HTMLElement | null
    if (!btn) return
    _activeTrack = btn.dataset.track as Track
    tabs.querySelectorAll('.upgrade-tab').forEach(t => t.classList.remove('active'))
    btn.classList.add('active')
    renderContent(container)
  })

  // Upgrade button — event delegation on content
  const content = container.querySelector('#upg-content')!
  content.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('#do-upgrade') as HTMLElement | null
    if (!btn || btn.hasAttribute('disabled')) return

    let success = false
    setState(state => {
      if (_activeTrack === 'tap') success = upgradeTap(state)
      else if (_activeTrack === 'output') success = upgradeOutput(state)
      else if (_activeTrack === 'discovery') success = upgradeDiscovery(state)
    })

    if (success) {
      renderContent(container)
    } else {
      showNotif('Not enough resources!')
    }
  })

  // Refresh on screen-change event
  window.addEventListener('screen-change', (e: Event) => {
    const detail = (e as CustomEvent).detail
    if (detail.screen === 'upgrades') renderContent(container)
  })

  subscribe(() => renderContent(container))
  renderContent(container)
}

function renderContent(container: HTMLElement): void {
  const content = container.querySelector('#upg-content')
  if (!content) return

  const state = getState()

  if (_activeTrack === 'tap') {
    renderTapTrack(content as HTMLElement, state)
  } else if (_activeTrack === 'output') {
    renderOutputTrack(content as HTMLElement, state)
  } else {
    renderDiscoveryTrack(content as HTMLElement, state)
  }
}

function renderTapTrack(content: HTMLElement, state: ReturnType<typeof getState>): void {
  const level = state.tapPowerLevel
  const maxLevel = TAP_UPGRADE_MAX_LEVEL
  const isMax = level >= maxLevel
  const cost = isMax ? 0 : getTapUpgradeCost(level)
  const canAfford = state.goo >= cost
  const currentGpp = Math.pow(2, level)
  const nextGpp = Math.pow(2, level + 1)
  const currentName = TAP_UPGRADE_NAMES[level] || 'Base Tap'
  const nextName = TAP_UPGRADE_NAMES[level + 1] || '—'

  // Milestones
  const milestones = [
    { level: 5, text: 'Tap Burst ability unlocked (hold for 10× burst)' },
    { level: 10, text: 'Tapping slimes has 10% chance to drop Essence' },
    { level: 15, text: 'Big Bang Tap — maximum tap power reached' },
  ]

  content.innerHTML = `
    <div class="upgrade-card">
      <div class="upgrade-card__level">Level ${level} / ${maxLevel}</div>
      <div class="upgrade-card__name">${isMax ? currentName : nextName}</div>
      <div class="upgrade-card__effect">
        ${isMax
          ? `<strong>${formatNumber(currentGpp)} Goo/tap</strong> — Maximum reached!`
          : `${formatNumber(currentGpp)} → <strong>${formatNumber(nextGpp)} Goo/tap</strong>`
        }
      </div>
      <div class="upgrade-card__cost">
        <span>You have: <span style="color:var(--color-goo)">${formatNumber(state.goo)} 💧</span></span>
        ${isMax ? '<span style="color:var(--color-success)">✓ MAX</span>' : `<span class="upgrade-card__cost-value">${formatNumber(cost)} 💧</span>`}
      </div>
      ${!isMax ? `
        <button id="do-upgrade" class="btn btn--primary" ${!canAfford ? 'disabled' : ''}>
          Upgrade — ${formatNumber(cost)} 💧
        </button>
      ` : ''}
    </div>

    <div class="upgrade-progress" style="margin:0 16px">
      <div style="display:flex;justify-content:space-between;font-size:var(--font-size-sm);color:var(--color-text-muted)">
        <span>Progress</span>
        <span>${level} / ${maxLevel}</span>
      </div>
      <div class="upgrade-progress__bar">
        <div class="upgrade-progress__fill" style="width:${(level / maxLevel) * 100}%"></div>
      </div>
    </div>

    <div class="milestones-list">
      <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Milestones</div>
      ${milestones.map(m => `
        <div class="milestone-item ${level >= m.level ? 'achieved' : ''}">
          <span class="milestone-item__level">Lv.${m.level}</span>
          <span class="milestone-item__text">${m.text}</span>
          ${level >= m.level ? '<span style="color:var(--color-success)">✓</span>' : ''}
        </div>
      `).join('')}
    </div>
  `
}

function renderOutputTrack(content: HTMLElement, state: ReturnType<typeof getState>): void {
  const level = state.outputLevel
  const maxLevel = OUTPUT_UPGRADE_MAX_LEVEL
  const isMax = level >= maxLevel
  const cost = isMax ? 0 : getOutputUpgradeCost(level)
  const canAfford = state.goo >= cost
  const currentMult = OUTPUT_MULTIPLIERS[level] ?? 1
  const nextMult = OUTPUT_MULTIPLIERS[level + 1] ?? currentMult
  const currentName = OUTPUT_UPGRADE_NAMES[level] || 'Base Output'
  const nextName = OUTPUT_UPGRADE_NAMES[level + 1] || '—'

  const milestones = [
    { level: 5, text: 'Slime Synergy: same-rarity slimes boost each other +2% (up to 20)' },
    { level: 10, text: 'Zone Mastery: +15% from zones where all slimes are discovered' },
    { level: 15, text: 'Background trickle: 10% passive rate while app is unfocused' },
    { level: 20, text: 'Mythic slimes generate 1 Essence per 60s passively' },
  ]

  content.innerHTML = `
    <div class="upgrade-card">
      <div class="upgrade-card__level">Level ${level} / ${maxLevel}</div>
      <div class="upgrade-card__name">${isMax ? currentName : nextName}</div>
      <div class="upgrade-card__effect">
        ${isMax
          ? `<strong>×${currentMult.toFixed(2)} global multiplier</strong> — Maximum reached!`
          : `×${currentMult.toFixed(2)} → <strong>×${nextMult.toFixed(2)} global Goo/sec</strong>`
        }
      </div>
      <div class="upgrade-card__cost">
        <span>You have: <span style="color:var(--color-goo)">${formatNumber(state.goo)} 💧</span></span>
        ${isMax ? '<span style="color:var(--color-success)">✓ MAX</span>' : `<span class="upgrade-card__cost-value">${formatNumber(cost)} 💧</span>`}
      </div>
      ${!isMax ? `
        <button id="do-upgrade" class="btn btn--primary" ${!canAfford ? 'disabled' : ''}>
          Upgrade — ${formatNumber(cost)} 💧
        </button>
      ` : ''}
    </div>

    <div class="upgrade-progress" style="margin:0 16px">
      <div style="display:flex;justify-content:space-between;font-size:var(--font-size-sm);color:var(--color-text-muted)">
        <span>Progress</span>
        <span>${level} / ${maxLevel}</span>
      </div>
      <div class="upgrade-progress__bar">
        <div class="upgrade-progress__fill" style="width:${(level / maxLevel) * 100}%"></div>
      </div>
    </div>

    <div class="milestones-list">
      <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Milestones</div>
      ${milestones.map(m => `
        <div class="milestone-item ${level >= m.level ? 'achieved' : ''}">
          <span class="milestone-item__level">Lv.${m.level}</span>
          <span class="milestone-item__text">${m.text}</span>
          ${level >= m.level ? '<span style="color:var(--color-success)">✓</span>' : ''}
        </div>
      `).join('')}
    </div>
  `
}

function renderDiscoveryTrack(content: HTMLElement, state: ReturnType<typeof getState>): void {
  const level = state.discoveryLevel
  const maxLevel = DISCOVERY_UPGRADE_MAX_LEVEL
  const isMax = level >= maxLevel
  const cost = isMax ? 0 : getDiscoveryUpgradeCost(level)
  const canAfford = state.essence >= cost
  const nextUpgrade = DISCOVERY_UPGRADES[level] // next to purchase (0-indexed = level 1)

  content.innerHTML = `
    <div class="upgrade-card">
      <div class="upgrade-card__level">Level ${level} / ${maxLevel}</div>
      <div class="upgrade-card__name">${isMax ? 'The Final Lab' : (nextUpgrade?.name ?? 'Max Reached')}</div>
      <div class="upgrade-card__effect">
        ${isMax
          ? '<strong>All Discovery upgrades unlocked!</strong>'
          : `<strong>${nextUpgrade?.effect ?? ''}</strong>`
        }
      </div>
      <div class="upgrade-card__cost">
        <span>You have: <span style="color:var(--color-essence)">${formatNumber(state.essence)} ✨</span></span>
        ${isMax ? '<span style="color:var(--color-success)">✓ MAX</span>' : `<span style="color:var(--color-essence);font-weight:700">${formatNumber(cost)} ✨</span>`}
      </div>
      ${!isMax ? `
        <button id="do-upgrade" class="btn btn--primary" ${!canAfford ? 'disabled' : ''}
          style="background:var(--color-essence);${!canAfford ? 'background:var(--color-surface-3);color:var(--color-text-dim)' : ''}">
          Upgrade — ${formatNumber(cost)} ✨
        </button>
      ` : ''}
    </div>

    <div class="upgrade-progress" style="margin:0 16px">
      <div style="display:flex;justify-content:space-between;font-size:var(--font-size-sm);color:var(--color-text-muted)">
        <span>Progress</span>
        <span>${level} / ${maxLevel}</span>
      </div>
      <div class="upgrade-progress__bar">
        <div class="upgrade-progress__fill" style="width:${(level / maxLevel) * 100}%;background:var(--color-essence)"></div>
      </div>
    </div>

    <div class="milestones-list">
      <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">All Upgrades</div>
      ${DISCOVERY_UPGRADES.map(u => `
        <div class="milestone-item ${level >= u.level ? 'achieved' : ''}">
          <span class="milestone-item__level">Lv.${u.level}</span>
          <div style="flex:1">
            <div style="font-size:var(--font-size-sm);font-weight:600">${u.name}</div>
            <div class="milestone-item__text">${u.effect}</div>
          </div>
          ${level >= u.level ? '<span style="color:var(--color-success)">✓</span>' : ''}
        </div>
      `).join('')}
    </div>
  `
}
