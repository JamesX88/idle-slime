// Zone summoning and exploration logic
import type { GameState, ZoneId, SlimeId } from './state'
import { getSummonableSlimes, getSlime } from './slimes'
import {
  ZONE_SUMMON_COST,
  SUMMON_WEIGHTS,
  PITY_UNCOMMON_THRESHOLD,
  PITY_RARE_THRESHOLD,
  PITY_EPIC_THRESHOLD,
  PITY_LEGENDARY_THRESHOLD,
  PITY_MYTHIC_THRESHOLD,
} from '../data/config'
import { checkSummonSpecials, checkTapSpecials, checkTimeSpecials } from './specials'

// Re-export so existing callers (main-screen.ts, tick.ts) don't need to change.
export { checkTapSpecials, checkTimeSpecials }

// ---- Rarity ordering (0 = most common) ----
const RARITY_RANK: Record<string, number> = {
  Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4, Mythic: 5,
}

/**
 * Return the per-zone summon cost for a given rarity.
 * Falls back to zone 1 cost if the zone is not in the table.
 */
export function getZoneSummonCost(zone: number, rarity: string): number {
  const zoneCosts = ZONE_SUMMON_COST[zone] ?? ZONE_SUMMON_COST[1]
  return zoneCosts[rarity] ?? zoneCosts['Common']
}

/**
 * Return the cheapest summon cost in the active zone (the Common cost).
 * Used by the UI to show "can you afford to summon at all".
 */
export function getMinSummonCost(zone: number): number {
  return getZoneSummonCost(zone, 'Common')
}

// ---- Multi-tier pity helpers ----

function getPityThreshold(rarity: string, discoveryLevel: number): number {
  // Discovery upgrades reduce the Uncommon pity threshold
  const uncommonBase = discoveryLevel >= 13 ? 10 : discoveryLevel >= 2 ? 14 : PITY_UNCOMMON_THRESHOLD
  switch (rarity) {
    case 'Uncommon':  return uncommonBase
    case 'Rare':      return PITY_RARE_THRESHOLD
    case 'Epic':      return PITY_EPIC_THRESHOLD
    case 'Legendary': return PITY_LEGENDARY_THRESHOLD
    case 'Mythic':    return PITY_MYTHIC_THRESHOLD
    default:          return 9999
  }
}

/**
 * Determine the minimum rarity the next summon must produce based on
 * per-rarity pity counters. Returns the highest-priority pity override,
 * or null if no pity is active.
 */
function getPityMinRarity(state: GameState, zone: ZoneId): string | null {
  const counters = state.summonsSinceRarity?.[zone] ?? {}
  const dl = state.discoveryLevel

  // Check from highest rarity downward
  for (const rarity of ['Mythic', 'Legendary', 'Epic', 'Rare', 'Uncommon']) {
    const count = counters[rarity] ?? 0
    if (count >= getPityThreshold(rarity, dl)) {
      return rarity
    }
  }
  return null
}

/**
 * Update all pity counters after a summon.
 * For each rarity tier, if the result was at least that tier, reset the counter.
 * Otherwise, increment it.
 */
function updatePityCounters(state: GameState, zone: ZoneId, resultRarity: string): void {
  if (!state.summonsSinceRarity) state.summonsSinceRarity = {}
  if (!state.summonsSinceRarity[zone]) state.summonsSinceRarity[zone] = {}
  const counters = state.summonsSinceRarity[zone]
  const resultRank = RARITY_RANK[resultRarity] ?? 0

  for (const rarity of ['Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic']) {
    const requiredRank = RARITY_RANK[rarity]
    if (resultRank >= requiredRank) {
      counters[rarity] = 0
    } else {
      counters[rarity] = (counters[rarity] ?? 0) + 1
    }
  }
}

/**
 * Perform a weighted random summon from the active zone pool.
 *
 * Discovery-method gate: only slimes with discovery === 'Zone' are in the pool.
 * Merge-only and Breed-only slimes are NEVER summoned — they must be obtained
 * through their respective mechanics.
 *
 * Per-zone costs: each rarity has a different cost that scales with the zone
 * (~10× per zone to match goo production scaling).
 *
 * Multi-tier pity: after N summons without a rarity, the pool is filtered to
 * guarantee at least that rarity on the next pull.
 *
 * Fully self-contained: deducts Goo, adds slime to collection, updates pity
 * counters, grants Prism Shard on first discovery, fires checkSummonSpecials.
 */
export function performSummon(
  state: GameState,
): { slimeId: SlimeId; isNew: boolean; cost: number } | null {
  const zone = state.activeZone
  // getSummonableSlimes already filters to discovery === 'Zone' && !isSecret
  const pool = getSummonableSlimes(zone)
  if (pool.length === 0) return null

  const minCost = getMinSummonCost(zone)
  if (state.goo < minCost) return null

  // ---- Determine pity minimum rarity ----
  const pityMinRarity = getPityMinRarity(state, zone)
  const pityMinRank = pityMinRarity ? (RARITY_RANK[pityMinRarity] ?? 0) : -1

  // ---- Filter pool by affordability and pity ----
  let candidates = pool.filter(s => {
    const cost = getZoneSummonCost(zone, s.rarity)
    if (state.goo < cost) return false
    if (pityMinRank >= 0 && (RARITY_RANK[s.rarity] ?? 0) < pityMinRank) return false
    return true
  })

  // If pity filter leaves nothing affordable, fall back to full affordable pool
  if (candidates.length === 0) {
    candidates = pool.filter(s => state.goo >= getZoneSummonCost(zone, s.rarity))
  }
  if (candidates.length === 0) return null

  // ---- Weighted random selection ----
  // Use compressed weights (divide by 100) to keep the array manageable
  const weightedPool: SlimeId[] = []
  for (const s of candidates) {
    const w = SUMMON_WEIGHTS[s.rarity] ?? 1
    const pushCount = Math.max(1, Math.floor(w / 100))
    for (let i = 0; i < pushCount; i++) weightedPool.push(s.id)
  }

  const pickedId = weightedPool[Math.floor(Math.random() * weightedPool.length)]
  const picked = getSlime(pickedId)
  if (!picked) return null

  const cost = getZoneSummonCost(zone, picked.rarity)
  if (state.goo < cost) return null

  // ---- Apply summon ----
  state.goo -= cost
  state.tapsSinceSpend = 0

  const isNew = !state.collection[pickedId]
  if (state.collection[pickedId]) {
    state.collection[pickedId].count++
  } else {
    state.totalDiscoveries++
    state.collection[pickedId] = {
      id: pickedId,
      count: 1,
      level: 1,
      discoveredAt: Date.now(),
      discoveryNumber: state.totalDiscoveries,
    }
    state.zoneDiscoveries[zone] = (state.zoneDiscoveries[zone] ?? 0) + 1
    if (isNew) state.prismShards++
  }

  // ---- Track total summons per zone (for zone-secret triggers) ----
  state.totalSummonsByZone[zone] = (state.totalSummonsByZone?.[zone] ?? 0) + 1

  // ---- Update legacy single-tier pity (for discovery upgrade compatibility) ----
  if (isNew) {
    state.summonsSinceNew[zone] = 0
  } else {
    state.summonsSinceNew[zone] = (state.summonsSinceNew[zone] ?? 0) + 1
  }

  // ---- Update multi-tier pity counters ----
  updatePityCounters(state, zone, picked.rarity)

  // ---- Evaluate special conditions ----
  checkSummonSpecials(state)

  return { slimeId: pickedId, isNew, cost }
}
