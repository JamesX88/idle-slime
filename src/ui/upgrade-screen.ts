import { getState, subscribe } from '../game/state'
import { canUpgradeTap, upgradeTap, tapUpgradeCost, canUpgradeOutput, upgradeOutput, outputUpgradeCost, canUpgradeDiscovery, upgradeDiscovery, discoveryUpgradeCost } from '../game/upgrades'
import { formatGoo } from '../game/economy'
import { TAP_POWER, OUTPUT_MULTIPLIERS } from '../data/config'

type Track = 'tap' | 'output' | 'discovery'

let activeTrack: Track = 'tap'

export function renderUpgradeScreen(container: HTMLElement, onBack: () => void): void {
  container.innerHTML = `
    <div class="topbar">
      <button class="btn btn--secondary" id="back-btn" style="width:auto;flex:0">← Back</button>
      <div style="font-weight:700">Upgrades</div>
      <div></div>
    </div>
    <div style="padding:12px 12px 0">
      <div class="upgrade-tabs">
        <button class="upgrade-tab active" data-track="tap">👆 Tap</button>
        <button class="upgrade-tab" data-track="output">🌀 Output</button>
        <button class="upgrade-tab" data-track="discovery">🔍 Discovery</button>
      </div>
    </div>
    <div class="upgrade-screen" id="upgrade-content"></div>
  `

  container.querySelector('#back-btn')?.addEventListener('click', onBack)

  container.querySelectorAll('.upgrade-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.upgrade-tab').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      activeTrack = (btn as HTMLElement).dataset['track'] as Track
      renderUpgrades(container)
    })
  })

  subscribe(() => renderUpgrades(container))
  renderUpgrades(container)
}

function renderUpgrades(container: HTMLElement): void {
  const state = getState()
  const content = container.querySelector('#upgrade-content')
  if (!content) return

  if (activeTrack === 'tap') {
    const level = state.tapPowerLevel
    const maxLevel = TAP_POWER.length - 1
    const current = TAP_POWER[level] ?? 1
    const next = TAP_POWER[level + 1] ?? current
    const cost = tapUpgradeCost()
    const canUpgrade = canUpgradeTap()
    const pct = (level / maxLevel) * 100

    content.innerHTML = `
      <div style="padding:4px 12px 8px;font-size:var(--font-size-xs);color:var(--color-text-muted)">
        Current: ${formatGoo(current)} 💧/tap (Level ${level})
      </div>
      ${level < maxLevel ? `
        <div class="upgrade-card">
          <div class="upgrade-card__title">Level ${level} → ${level + 1}</div>
          <div class="upgrade-card__effect">
            ${formatGoo(current)} → ${formatGoo(next)} Goo per tap
            ${level + 1 === 5 ? '<br><strong>🎯 Milestone: Unlocks Tap Burst ability</strong>' : ''}
            ${level + 1 === 10 ? '<br><strong>🎯 Milestone: Essence drops from tapping</strong>' : ''}
          </div>
          <button class="btn btn--primary" id="upgrade-tap-btn" ${canUpgrade ? '' : 'disabled'}>
            Upgrade — ${formatGoo(cost)} 💧
          </button>
        </div>
      ` : '<div class="upgrade-card"><div class="upgrade-card__title">MAX LEVEL REACHED</div></div>'}
      <div style="padding:0 12px">
        <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-bottom:4px">Progress: ${level}/${maxLevel}</div>
        <div style="height:6px;background:var(--color-surface);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:var(--color-accent);border-radius:3px"></div>
        </div>
      </div>
    `
    content.querySelector('#upgrade-tap-btn')?.addEventListener('click', () => upgradeTap())
  }

  if (activeTrack === 'output') {
    const level = state.outputLevel
    const maxLevel = OUTPUT_MULTIPLIERS.length - 1
    const current = OUTPUT_MULTIPLIERS[level] ?? 1
    const next = OUTPUT_MULTIPLIERS[level + 1] ?? current
    const cost = outputUpgradeCost()
    const canUpgrade = canUpgradeOutput()
    const pct = (level / maxLevel) * 100

    content.innerHTML = `
      <div style="padding:4px 12px 8px;font-size:var(--font-size-xs);color:var(--color-text-muted)">
        Current multiplier: ×${current.toFixed(2)} (Level ${level})
      </div>
      ${level < maxLevel ? `
        <div class="upgrade-card">
          <div class="upgrade-card__title">Level ${level} → ${level + 1}</div>
          <div class="upgrade-card__effect">
            ×${current.toFixed(2)} → ×${next.toFixed(2)} global Goo/sec
            ${level + 1 === 5 ? '<br><strong>🎯 Milestone: Slime Synergy passive</strong>' : ''}
            ${level + 1 === 10 ? '<br><strong>🎯 Milestone: Zone Mastery bonus</strong>' : ''}
            ${level + 1 === 15 ? '<br><strong>🎯 Milestone: Background trickle income</strong>' : ''}
            ${level + 1 === 20 ? '<br><strong>🎯 Milestone: Mythic slimes generate Essence passively</strong>' : ''}
          </div>
          <button class="btn btn--primary" id="upgrade-output-btn" ${canUpgrade ? '' : 'disabled'}>
            Upgrade — ${formatGoo(cost)} 💧
          </button>
        </div>
      ` : '<div class="upgrade-card"><div class="upgrade-card__title">MAX LEVEL REACHED</div></div>'}
      <div style="padding:0 12px">
        <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-bottom:4px">Progress: ${level}/${maxLevel}</div>
        <div style="height:6px;background:var(--color-surface);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:var(--color-accent);border-radius:3px"></div>
        </div>
      </div>
    `
    content.querySelector('#upgrade-output-btn')?.addEventListener('click', () => upgradeOutput())
  }

  if (activeTrack === 'discovery') {
    const level = state.discoveryLevel
    const maxLevel = 15
    const cost = discoveryUpgradeCost()
    const canUpgrade = canUpgradeDiscovery()
    const pct = (level / maxLevel) * 100

    const DISCOVERY_EFFECTS: Record<number, string> = {
      1: 'Slimepedia shows silhouettes for undiscovered zone slimes',
      2: 'Pity counter reduced to 7 summons',
      3: 'Breed cooldown -20%',
      4: '🎯 Breed Slot 2 unlocked',
      5: 'Favorite food bonus: 25% → 40%',
      6: 'Slimepedia hints available (3 💎 for element tag)',
      7: 'Breed cooldown -20% more',
      8: 'Zone secret progress indicators visible',
      9: '🎯 Breed Slot 3 unlocked',
      10: 'Slimepedia Tier 2 hints (one parent revealed, 8 💎)',
      11: 'Breed cooldown -15% more',
      12: 'Mimic Slime reveals disguise in tooltip',
      13: 'Pity counter reduced to 5 summons',
      14: 'Slimepedia Tier 3 hints (both parents revealed, 15 💎)',
      15: '🎯 Breed Slot 4 unlocked (also costs 50 💎)',
    }

    content.innerHTML = `
      <div style="padding:4px 12px 8px;font-size:var(--font-size-xs);color:var(--color-text-muted)">
        Discovery Level ${level} / ${maxLevel} — Balance: ${formatGoo(state.essence)} ✨
      </div>
      ${level < maxLevel ? `
        <div class="upgrade-card">
          <div class="upgrade-card__title">Level ${level} → ${level + 1}</div>
          <div class="upgrade-card__effect">${DISCOVERY_EFFECTS[level + 1] ?? 'Improved discovery capabilities'}</div>
          ${level + 1 === 15 ? '<div style="font-size:var(--font-size-xs);color:var(--color-shard);margin-bottom:8px">Also requires 50 💎 Prism Shards</div>' : ''}
          <button class="btn btn--primary" id="upgrade-disc-btn" ${canUpgrade ? '' : 'disabled'}>
            Upgrade — ${formatGoo(cost)} ✨
          </button>
        </div>
      ` : '<div class="upgrade-card"><div class="upgrade-card__title">MAX LEVEL REACHED</div></div>'}
      <div style="padding:0 12px 12px">
        <div style="font-size:var(--font-size-xs);color:var(--color-text-muted);margin-bottom:4px">Progress: ${level}/${maxLevel}</div>
        <div style="height:6px;background:var(--color-surface);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:var(--color-accent);border-radius:3px"></div>
        </div>
      </div>
    `
    content.querySelector('#upgrade-disc-btn')?.addEventListener('click', () => upgradeDiscovery())
  }
}
