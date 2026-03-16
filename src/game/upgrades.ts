// Upgrade purchase and effect application
import type { GameState } from './state'
import {
  getTapUpgradeCost, getOutputUpgradeCost, getDiscoveryUpgradeCost,
} from './economy'
import {
  TAP_UPGRADE_MAX_LEVEL, OUTPUT_UPGRADE_MAX_LEVEL, DISCOVERY_UPGRADE_MAX_LEVEL,
} from '../data/config'
import { unlockBreedSlot } from './breeds'

export function upgradeTap(state: GameState): boolean {
  if (state.tapPowerLevel >= TAP_UPGRADE_MAX_LEVEL) return false
  const cost = getTapUpgradeCost(state.tapPowerLevel)
  if (state.goo < cost) return false
  state.goo -= cost
  state.tapPowerLevel++
  state.tapsSinceSpend = 0
  return true
}

export function upgradeOutput(state: GameState): boolean {
  if (state.outputLevel >= OUTPUT_UPGRADE_MAX_LEVEL) return false
  const cost = getOutputUpgradeCost(state.outputLevel)
  if (state.goo < cost) return false
  state.goo -= cost
  state.outputLevel++
  state.tapsSinceSpend = 0
  applyOutputMilestones(state)
  return true
}

export function upgradeDiscovery(state: GameState): boolean {
  if (state.discoveryLevel >= DISCOVERY_UPGRADE_MAX_LEVEL) return false
  const cost = getDiscoveryUpgradeCost(state.discoveryLevel)
  if (state.essence < cost) return false
  state.essence -= cost
  state.discoveryLevel++
  applyDiscoveryMilestones(state)
  return true
}

function applyOutputMilestones(state: GameState): void {
  // Level 5: Slime Synergy — handled in economy.ts computeSlimeOutput
  // Level 10: Zone Mastery — handled in economy.ts
  // Level 15: Background trickle — handled in tick.ts
  // Level 20: Mythic Essence — handled in tick.ts
}

function applyDiscoveryMilestones(state: GameState): void {
  // Level 4: Unlock breed slot 2
  if (state.discoveryLevel >= 4) {
    unlockBreedSlot(state, 1)
  }
  // Level 9: Unlock breed slot 3
  if (state.discoveryLevel >= 9) {
    unlockBreedSlot(state, 2)
  }
  // Level 15: Breed slot 4 becomes available (costs 50 Prism Shards to activate)
  // Handled in UI
}
