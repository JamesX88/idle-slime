import {
  TAP_POWER,
  OUTPUT_MULTIPLIERS,
  BREED_SLOT_UNLOCKS,
  BREED_SLOT_4_SHARD_COST,
  BREED_COOLDOWN_REDUCTION,
} from '../data/config'
import { getState, setState } from './state'

// ---------------------------------------------------------------------------
// Tap Power
// ---------------------------------------------------------------------------

const TAP_COSTS: number[] = [25, 75, 225, 675, 2025, 6075, 18225, 54675, 164025, 492075, 1476225, 4428675, 13286025, 39858075, 119574225]

export function tapUpgradeCost(): number {
  const level = getState().tapPowerLevel
  return TAP_COSTS[level] ?? Infinity
}

export function canUpgradeTap(): boolean {
  const state = getState()
  const cost = tapUpgradeCost()
  return state.tapPowerLevel < TAP_POWER.length - 1 && state.goo >= cost
}

export function upgradeTap(): void {
  if (!canUpgradeTap()) return
  const cost = tapUpgradeCost()
  setState(s => {
    s.goo -= cost
    s.tapPowerLevel += 1
  })
  checkBreedSlotUnlock()
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const OUTPUT_COSTS: number[] = [50, 140, 392, 1098, 3074, 8607, 24100, 67480, 188944, 529043, 1481320, 4147697, 11613551, 32517943, 91050240, 254940672, 713833882, 1998734870, 5596457636, 15670081381]

export function outputUpgradeCost(): number {
  const level = getState().outputLevel
  return OUTPUT_COSTS[level] ?? Infinity
}

export function canUpgradeOutput(): boolean {
  const state = getState()
  const cost = outputUpgradeCost()
  return state.outputLevel < OUTPUT_MULTIPLIERS.length - 1 && state.goo >= cost
}

export function upgradeOutput(): void {
  if (!canUpgradeOutput()) return
  const cost = outputUpgradeCost()
  setState(s => {
    s.goo -= cost
    s.outputLevel += 1
  })
}

// ---------------------------------------------------------------------------
// Discovery
// ---------------------------------------------------------------------------

const DISCOVERY_COSTS: number[] = [5, 12, 25, 50, 80, 120, 175, 200, 300, 400, 500, 600, 750, 900, 1200]

export function discoveryUpgradeCost(): number {
  const level = getState().discoveryLevel
  return DISCOVERY_COSTS[level] ?? Infinity
}

export function canUpgradeDiscovery(): boolean {
  const state = getState()
  const cost = discoveryUpgradeCost()
  const maxLevel = DISCOVERY_COSTS.length
  if (state.discoveryLevel >= maxLevel) return false
  if (state.discoveryLevel + 1 === 15 && state.prismShards < BREED_SLOT_4_SHARD_COST) return false
  return state.essence >= cost
}

export function upgradeDiscovery(): void {
  if (!canUpgradeDiscovery()) return
  const cost = discoveryUpgradeCost()
  const nextLevel = getState().discoveryLevel + 1

  setState(s => {
    s.essence -= cost
    if (nextLevel === 15) s.prismShards -= BREED_SLOT_4_SHARD_COST
    s.discoveryLevel = nextLevel
  })

  checkBreedSlotUnlock()
  updateBreedCooldowns()
}

// ---------------------------------------------------------------------------
// Breed slot management
// ---------------------------------------------------------------------------

function checkBreedSlotUnlock(): void {
  const state = getState()
  const targetSlots = BREED_SLOT_UNLOCKS[state.discoveryLevel] ?? 1

  setState(s => {
    for (let i = 1; i < targetSlots; i++) {
      if (s.breedSlots[i]?.status === 'locked') {
        s.breedSlots[i]!.status = 'idle'
      }
    }
  })
}

function updateBreedCooldowns(): void {
  const state = getState()
  let cooldown = 45_000
  for (const [lvl, mult] of Object.entries(BREED_COOLDOWN_REDUCTION)) {
    if (state.discoveryLevel >= parseInt(lvl)) {
      cooldown = Math.floor(45_000 * mult)
    }
  }
  setState(s => {
    for (const slot of s.breedSlots) {
      slot.cooldownMs = cooldown
    }
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getBreedCooldownMs(): number {
  const state = getState()
  let cooldown = 45_000
  for (const [lvl, mult] of Object.entries(BREED_COOLDOWN_REDUCTION)) {
    if (state.discoveryLevel >= parseInt(lvl)) {
      cooldown = Math.floor(45_000 * mult)
    }
  }
  return cooldown
}
