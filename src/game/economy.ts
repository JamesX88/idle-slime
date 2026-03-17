// Economy — production calculations, costs, and currency operations
import type { GameState, ZoneId, SlimeId } from './state'
import { getSlime, getZoneSlimes, getAllSlimes } from './slimes'
import {
  LEVEL_UP_MULTIPLIER, FEED_COST_MULTIPLIER, FEED_BASE,
  FAVORITE_FOOD_DISCOUNT, OUTPUT_MULTIPLIERS,
  TAP_UPGRADE_BASE_COST, TAP_UPGRADE_COST_MULT,
  OUTPUT_UPGRADE_BASE_COST, OUTPUT_UPGRADE_COST_MULT,
  DISCOVERY_UPGRADE_COSTS, SUMMON_COST,
  ZONE_COSTS, GOO_PER_TAP_BASE, MAX_LEVEL,
} from '../data/config'
import { checkFeedSpecials } from './specials'

// ---- Production ----

/**
 * Compute the Goo/sec output for a single owned slime.
 * Accepts an optional pre-computed rarityCount cache to avoid O(n²) work
 * when called in a loop from computeTotalProduction.
 */
export function computeSlimeOutput(
  state: GameState,
  id: SlimeId,
  rarityCount?: Record<string, number>,
): number {
  const owned = state.collection[id]
  if (!owned) return 0
  const def = getSlime(id)
  if (!def) return 0

  const base = def.baseGooPerSec
  const levelMult = Math.pow(LEVEL_UP_MULTIPLIER, owned.level - 1)
  const outputMult = getOutputMultiplier(state.outputLevel)

  // Synergy bonus (Output lv5+): +2% per same-rarity slime, up to 20 slimes.
  // Uses pre-computed cache when available to keep this O(1).
  let synergyBonus = 0
  if (state.outputLevel >= 5) {
    const count = rarityCount
      ? (rarityCount[def.rarity] ?? 0)
      : Object.values(state.collection).filter(o => getSlime(o.id)?.rarity === def.rarity).length
    synergyBonus = Math.min(count, 20) * 0.02
  }

  // Zone mastery bonus (Output lv10+): +15% if all zone slimes discovered
  let zoneMasteryBonus = 0
  if (state.outputLevel >= 10 && def.zone) {
    if (isZoneMastered(state, def.zone)) {
      zoneMasteryBonus = 0.15
    }
  }

  return base * levelMult * outputMult * (1 + synergyBonus) * (1 + zoneMasteryBonus) * owned.count
}

/**
 * Build a rarity → count map for all owned slimes.
 * Used by computeTotalProduction to avoid O(n²) synergy calculation.
 */
export function buildRarityCountCache(
  collection: GameState['collection'],
): Record<string, number> {
  const cache: Record<string, number> = {}
  for (const owned of Object.values(collection)) {
    const def = getSlime(owned.id)
    if (!def) continue
    cache[def.rarity] = (cache[def.rarity] ?? 0) + 1
  }
  return cache
}

/**
 * Compute total passive Goo/sec across the entire collection.
 * Builds the rarity cache once and passes it to each per-slime call.
 */
export function computeTotalProduction(state: GameState): number {
  const rarityCount = buildRarityCountCache(state.collection)
  let total = 0
  for (const id of Object.keys(state.collection)) {
    total += computeSlimeOutput(state, id, rarityCount)
  }
  return total
}

export function getOutputMultiplier(level: number): number {
  return OUTPUT_MULTIPLIERS[Math.min(level, OUTPUT_MULTIPLIERS.length - 1)] ?? 1
}

function isZoneMastered(state: GameState, zone: ZoneId): boolean {
  const zoneSlimes = getZoneSlimes(zone)
  return zoneSlimes.every(s => !!state.collection[s.id])
}

// ---- Tap ----

export function getGooPerTap(state: GameState): number {
  const level = state.tapPowerLevel
  return GOO_PER_TAP_BASE * Math.pow(2, level)
}

// ---- Feed / Level ----

export function getFeedCost(state: GameState, id: SlimeId): number | null {
  const owned = state.collection[id]
  if (!owned || owned.level >= MAX_LEVEL) return null
  const def = getSlime(id)
  if (!def) return null

  const base = FEED_BASE[def.rarity] ?? FEED_BASE.Common
  let cost = base * Math.pow(FEED_COST_MULTIPLIER, owned.level - 1)

  // Favorite food discount
  const discountLevel = state.discoveryLevel >= 5 ? 0.40 : FAVORITE_FOOD_DISCOUNT
  // Simplified: apply discount at 50% probability (flavor hook)
  cost = Math.floor(cost * (1 - discountLevel * 0.5))

  return Math.floor(cost)
}

export function canFeed(state: GameState, id: SlimeId): boolean {
  const cost = getFeedCost(state, id)
  if (cost === null) return false
  return state.goo >= cost
}

/**
 * Feed a slime, levelling it up. Fully self-contained:
 * - Deducts Goo cost
 * - Increments level
 * - Grants Essence at max level
 * - Tracks max-level metadata
 * - Fires checkFeedSpecials (Miniature Slime trigger)
 *
 * Returns a descriptor for the UI to present feedback.
 */
export function feedSlime(
  state: GameState,
  id: SlimeId,
): { essenceGained: number; maxLevelReached: boolean } {
  const cost = getFeedCost(state, id)
  if (cost === null || state.goo < cost) return { essenceGained: 0, maxLevelReached: false }

  state.goo -= cost
  state.collection[id].level++
  state.tapsSinceSpend = 0

  let essenceGained = 0
  let maxLevelReached = false

  if (state.collection[id].level >= MAX_LEVEL) {
    essenceGained = 5 // ESSENCE_PER_MAX_LEVEL
    state.essence += essenceGained
    maxLevelReached = true
    if (!state.maxLevelEverReached) {
      state.maxLevelEverReached = true
      state.maxLevelSlimeId = id
      state.maxLevelReachedAt = Date.now()
    }
  }

  // Trigger feed-based specials (e.g., Miniature Slime)
  checkFeedSpecials(state)

  return { essenceGained, maxLevelReached }
}

// ---- Merge ----

export function getMergeCount(state: GameState, id: SlimeId): number {
  return state.collection[id]?.count ?? 0
}

export function canMerge(state: GameState, id: SlimeId): boolean {
  return getMergeCount(state, id) >= 3
}

/**
 * Merge 3 identical slimes. Fully self-contained:
 * - Consumes 3 copies of the source slime
 * - Determines the result deterministically (see getMergeResult)
 * - Adds the result to the collection
 * - Increments totalDiscoveries and grants a Prism Shard for new discoveries
 * - Grants Essence (and extra Shards for max-rarity merges)
 *
 * Returns a descriptor for the UI to present feedback.
 */
export function mergeSlimes(
  state: GameState,
  id: SlimeId,
): { resultId: SlimeId | null; isNew: boolean; essenceGained: number; shardsGained: number } {
  const owned = state.collection[id]
  if (!owned || owned.count < 3) {
    return { resultId: null, isNew: false, essenceGained: 0, shardsGained: 0 }
  }

  const def = getSlime(id)
  if (!def) {
    return { resultId: null, isNew: false, essenceGained: 0, shardsGained: 0 }
  }

  owned.count -= 3
  if (owned.count <= 0) delete state.collection[id]

  const rarityChain: string[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic']
  const currentIdx = rarityChain.indexOf(def.rarity)
  const nextRarity = rarityChain[currentIdx + 1]

  let essenceGained = 1 // ESSENCE_PER_MERGE
  let shardsGained = 0
  let resultId: SlimeId | null = null
  let isNew = false

  if (!nextRarity) {
    // Max rarity merge — return Essence + Shards instead of a new slime
    essenceGained = 10
    shardsGained = 3
    state.essence += essenceGained
    state.prismShards += shardsGained
    return { resultId: null, isNew: false, essenceGained, shardsGained }
  }

  state.essence += essenceGained

  // Deterministic merge result: lowest-ID undiscovered zone slime of the next
  // rarity in the same zone. Falls back to lowest-ID discovered zone slime of
  // next rarity in the same zone, then globally.
  resultId = getMergeResult(state, def.zone, nextRarity)

  if (resultId) {
    isNew = !state.collection[resultId]
    if (state.collection[resultId]) {
      state.collection[resultId].count++
    } else {
      state.totalDiscoveries++
      state.collection[resultId] = {
        id: resultId,
        count: 1,
        level: 1,
        discoveredAt: Date.now(),
        discoveryNumber: state.totalDiscoveries,
      }
      if (isNew) {
        state.prismShards++
        shardsGained++
      }
    }
  }

  return { resultId, isNew, essenceGained, shardsGained }
}

/**
 * Determine the deterministic merge output: the lowest-ID zone-discoverable
 * slime of `nextRarity` in `zone` that the player has not yet discovered.
 * If all same-zone slimes of that rarity are already owned, returns the
 * lowest-ID same-zone slime of that rarity (giving a duplicate copy).
 * Falls back globally if no same-zone candidates exist.
 */
function getMergeResult(
  state: GameState,
  zone: ZoneId | null,
  nextRarity: string,
): SlimeId | null {
  const allSlimes = getAllSlimes()

  // Priority 1: undiscovered same-zone slime of next rarity
  if (zone !== null) {
    const sameZoneUndiscovered = allSlimes.filter(
      s => s.rarity === nextRarity && s.zone === zone && s.discovery === 'Zone' && !state.collection[s.id]
    )
    if (sameZoneUndiscovered.length > 0) {
      // Sort by numeric ID ascending — deterministic
      sameZoneUndiscovered.sort((a, b) => parseInt(a.id) - parseInt(b.id))
      return sameZoneUndiscovered[0].id
    }

    // Priority 2: already-discovered same-zone slime (gives a duplicate)
    const sameZoneAny = allSlimes.filter(
      s => s.rarity === nextRarity && s.zone === zone && s.discovery === 'Zone'
    )
    if (sameZoneAny.length > 0) {
      sameZoneAny.sort((a, b) => parseInt(a.id) - parseInt(b.id))
      return sameZoneAny[0].id
    }
  }

  // Priority 3: any undiscovered zone slime globally
  const globalUndiscovered = allSlimes.filter(
    s => s.rarity === nextRarity && s.discovery === 'Zone' && !state.collection[s.id]
  )
  if (globalUndiscovered.length > 0) {
    globalUndiscovered.sort((a, b) => parseInt(a.id) - parseInt(b.id))
    return globalUndiscovered[0].id
  }

  // Priority 4: any zone slime globally
  const globalAny = allSlimes.filter(s => s.rarity === nextRarity && s.discovery === 'Zone')
  if (globalAny.length > 0) {
    globalAny.sort((a, b) => parseInt(a.id) - parseInt(b.id))
    return globalAny[0].id
  }

  return null
}

// ---- Summon ----

export function getSummonCost(rarity: string): number {
  return SUMMON_COST[rarity] ?? SUMMON_COST.Common
}

export function canSummon(state: GameState): boolean {
  return state.goo >= SUMMON_COST.Common
}

// ---- Zone unlock ----

export function getZoneUnlockCost(zone: ZoneId): number {
  return ZONE_COSTS[zone] ?? 0
}

export function canUnlockZone(state: GameState, zone: ZoneId): boolean {
  if (state.unlockedZones.includes(zone)) return false
  const prevZone = (zone - 1) as ZoneId
  if (!state.unlockedZones.includes(prevZone)) return false
  return state.goo >= getZoneUnlockCost(zone)
}

export function unlockZone(state: GameState, zone: ZoneId): boolean {
  if (!canUnlockZone(state, zone)) return false
  const cost = getZoneUnlockCost(zone)
  state.goo -= cost
  state.unlockedZones.push(zone)
  state.tapsSinceSpend = 0
  return true
}

// ---- Upgrade costs ----

export function getTapUpgradeCost(currentLevel: number): number {
  return Math.floor(TAP_UPGRADE_BASE_COST * Math.pow(TAP_UPGRADE_COST_MULT, currentLevel))
}

export function getOutputUpgradeCost(currentLevel: number): number {
  return Math.floor(OUTPUT_UPGRADE_BASE_COST * Math.pow(OUTPUT_UPGRADE_COST_MULT, currentLevel))
}

export function getDiscoveryUpgradeCost(currentLevel: number): number {
  return DISCOVERY_UPGRADE_COSTS[currentLevel + 1] ?? 9999
}
