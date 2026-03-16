import {
  PASSIVE_GOO_BASE,
  LEVEL_UP_MULTIPLIER,
  FEED_COST_MULTIPLIER,
  FEED_BASE_COST,
  OUTPUT_MULTIPLIERS,
  SYNERGY_BONUS_PER_SLIME,
  SYNERGY_MAX_SLIMES,
  ZONE_COMPLETION_BONUS,
  TAP_POWER,
  GOO_PER_TAP_BASE,
} from '../data/config'
import type { GameState, OwnedSlime, ZoneId } from './types'
import { getSlime, getZoneSummonPool } from './slimes'

// ---------------------------------------------------------------------------
// Production
// ---------------------------------------------------------------------------

export function slimeGooPerSec(owned: OwnedSlime): number {
  const def = getSlime(owned.id)
  if (!def) return 0
  const base = PASSIVE_GOO_BASE[def.rarity] ?? 0.5
  return base * Math.pow(LEVEL_UP_MULTIPLIER, owned.level - 1)
}

export function computeTotalProduction(state: GameState): number {
  const outputMult = OUTPUT_MULTIPLIERS[state.outputLevel] ?? 1.0
  const rarityGroups: Record<string, number> = {}

  let total = 0

  for (const owned of Object.values(state.collection)) {
    const def = getSlime(owned.id)
    if (!def) continue

    const perSlime = slimeGooPerSec(owned)
    const zoneBonus = getZoneMasteryBonus(state, def.zone)
    const count = owned.count

    total += perSlime * count * outputMult * (1 + zoneBonus)

    // Track rarity counts for synergy
    rarityGroups[def.rarity] = (rarityGroups[def.rarity] ?? 0) + count
  }

  // Apply synergy bonus globally (rough approximation per rarity group)
  let synergyMult = 0
  for (const count of Object.values(rarityGroups)) {
    const capped = Math.min(count, SYNERGY_MAX_SLIMES)
    synergyMult += capped * SYNERGY_BONUS_PER_SLIME
  }

  return total * (1 + synergyMult)
}

function getZoneMasteryBonus(state: GameState, zone: ZoneId | null): number {
  if (!zone) return 0
  if (isZoneComplete(state, zone)) return ZONE_COMPLETION_BONUS
  return 0
}

function isZoneComplete(state: GameState, zone: ZoneId): boolean {
  const pool = getZoneSummonPool(zone)
  return pool.every(s => state.collection[s.id] !== undefined)
}

// ---------------------------------------------------------------------------
// Tapping
// ---------------------------------------------------------------------------

export function gooPerTap(state: GameState): number {
  return (TAP_POWER[state.tapPowerLevel] ?? GOO_PER_TAP_BASE)
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------

export function feedCost(owned: OwnedSlime): number {
  const def = getSlime(owned.id)
  if (!def) return Infinity
  const base = FEED_BASE_COST[def.rarity] ?? 50
  return Math.floor(base * Math.pow(FEED_COST_MULTIPLIER, owned.level - 1))
}

export function feedCostWithBonus(owned: OwnedSlime, bonusFraction: number): number {
  return Math.floor(feedCost(owned) * (1 - bonusFraction))
}

// ---------------------------------------------------------------------------
// Number formatting
// ---------------------------------------------------------------------------

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']

export function formatGoo(n: number): string {
  if (!isFinite(n) || isNaN(n)) return '0'
  if (n < 1000) return Math.floor(n).toString()

  const tier = Math.floor(Math.log10(Math.abs(n)) / 3)
  const suffix = SUFFIXES[tier] ?? `e${tier * 3}`
  const scaled = n / Math.pow(1000, tier)
  const fixed = scaled >= 100 ? scaled.toFixed(0) : scaled >= 10 ? scaled.toFixed(1) : scaled.toFixed(2)
  return `${fixed}${suffix}`
}

export function formatRate(n: number): string {
  return `${formatGoo(n)}/s`
}
