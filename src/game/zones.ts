// Zone summoning and exploration logic
import type { GameState, ZoneId, SlimeId } from './state'
import { getSummonableSlimes, getSlime } from './slimes'
import { SUMMON_COST, PITY_SUMMON_THRESHOLD } from '../data/config'
import { checkSummonSpecials, checkTapSpecials, checkTimeSpecials } from './specials'

// Re-export checkTapSpecials and checkTimeSpecials so existing callers
// (main-screen.ts, tick.ts) can import from zones.ts without changes.
export { checkTapSpecials, checkTimeSpecials }

/**
 * Perform a weighted random summon from the active zone pool.
 * Fully self-contained: deducts Goo, adds slime to collection, updates
 * pity counter, grants Prism Shard on first discovery, and fires
 * checkSummonSpecials to evaluate any collection-milestone special slimes.
 */
export function performSummon(
  state: GameState,
): { slimeId: SlimeId; isNew: boolean; cost: number } | null {
  const zone = state.activeZone
  const pool = getSummonableSlimes(zone)
  if (pool.length === 0) return null

  const canAffordCommon = state.goo >= SUMMON_COST.Common
  if (!canAffordCommon) return null

  // Pity system: guarantee an undiscovered slime after N summons without a new one
  const pityThreshold = state.discoveryLevel >= 13 ? 5 : state.discoveryLevel >= 2 ? 7 : PITY_SUMMON_THRESHOLD
  const isPityTrigger = (state.summonsSinceNew[zone] ?? 0) >= pityThreshold

  let candidates = pool

  if (isPityTrigger) {
    const undiscovered = pool.filter(s => !state.collection[s.id])
    if (undiscovered.length > 0) {
      candidates = undiscovered
    }
  }

  // Filter by affordability
  const affordable = candidates.filter(s => state.goo >= (SUMMON_COST[s.rarity] ?? SUMMON_COST.Common))
  if (affordable.length === 0) return null

  // Weighted by rarity (Common most likely)
  const weights: Record<string, number> = { Common: 60, Uncommon: 30, Rare: 10 }
  const weightedPool: SlimeId[] = []
  for (const s of affordable) {
    const w = weights[s.rarity] ?? 5
    for (let i = 0; i < w; i++) weightedPool.push(s.id)
  }

  const pickedId = weightedPool[Math.floor(Math.random() * weightedPool.length)]
  const picked = getSlime(pickedId)
  if (!picked) return null

  const cost = SUMMON_COST[picked.rarity] ?? SUMMON_COST.Common
  if (state.goo < cost) return null

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

  // Update pity counter
  if (isNew) {
    state.summonsSinceNew[zone] = 0
  } else {
    state.summonsSinceNew[zone] = (state.summonsSinceNew[zone] ?? 0) + 1
  }

  // Evaluate all summon-triggered special conditions (centralized in specials.ts)
  checkSummonSpecials(state)

  return { slimeId: pickedId, isNew, cost }
}
