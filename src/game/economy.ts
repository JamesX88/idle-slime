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

// ---- Production ----

export function computeSlimeOutput(state: GameState, id: SlimeId): number {
  const owned = state.collection[id]
  if (!owned) return 0
  const def = getSlime(id)
  if (!def) return 0

  const base = def.baseGooPerSec
  const levelMult = Math.pow(LEVEL_UP_MULTIPLIER, owned.level - 1)
  const outputMult = getOutputMultiplier(state.outputLevel)

  // Synergy bonus (Output lv5+): +2% per same-rarity slime, up to 20 slimes
  let synergyBonus = 0
  if (state.outputLevel >= 5) {
    const sameRarityCount = Object.values(state.collection)
      .filter(o => getSlime(o.id)?.rarity === def.rarity).length
    synergyBonus = Math.min(sameRarityCount, 20) * 0.02
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

export function computeTotalProduction(state: GameState): number {
  let total = 0
  for (const id of Object.keys(state.collection)) {
    total += computeSlimeOutput(state, id)
  }
  return total
}

export function getOutputMultiplier(level: number): number {
  return OUTPUT_MULTIPLIERS[Math.min(level, OUTPUT_MULTIPLIERS.length - 1)] ?? 1
}

function isZoneMastered(state: GameState, zone: ZoneId): boolean {
  // All zone-native slimes discovered
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
  // (Favorite food is cosmetic — we apply discount always for simplicity, flavor hook)
  cost = Math.floor(cost * (1 - discountLevel * 0.5)) // 50% chance to be fav food — simplified

  return Math.floor(cost)
}

export function canFeed(state: GameState, id: SlimeId): boolean {
  const cost = getFeedCost(state, id)
  if (cost === null) return false
  return state.goo >= cost
}

export function feedSlime(state: GameState, id: SlimeId): { essenceGained: number; maxLevelReached: boolean } {
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

  return { essenceGained, maxLevelReached }
}

// ---- Merge ----

export function getMergeCount(state: GameState, id: SlimeId): number {
  return state.collection[id]?.count ?? 0
}

export function canMerge(state: GameState, id: SlimeId): boolean {
  return getMergeCount(state, id) >= 3
}

export function mergeSlimes(state: GameState, id: SlimeId): { resultId: SlimeId | null; essenceGained: number; shardsGained: number } {
  const owned = state.collection[id]
  if (!owned || owned.count < 3) return { resultId: null, essenceGained: 0, shardsGained: 0 }

  const def = getSlime(id)
  if (!def) return { resultId: null, essenceGained: 0, shardsGained: 0 }

  owned.count -= 3

  // Find next rarity tier
  const rarityChain: string[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic']
  const currentIdx = rarityChain.indexOf(def.rarity)
  const nextRarity = rarityChain[currentIdx + 1]

  let essenceGained = 1 // ESSENCE_PER_MERGE
  let shardsGained = 0
  let resultId: SlimeId | null = null

  if (!nextRarity) {
    // Max rarity merge — return essence + shards instead
    essenceGained = 10
    shardsGained = 3
    state.essence += essenceGained
    state.prismShards += shardsGained
    if (owned.count <= 0) delete state.collection[id]
    return { resultId: null, essenceGained, shardsGained }
  }

  state.essence += essenceGained

  // Find a slime of the next rarity tier in the same zone or related
  // Simple approach: find any zone slime of next rarity in same zone
  const candidates = getAllSlimes().filter(s =>
    s.rarity === nextRarity &&
    s.zone === def.zone &&
    s.discovery === 'Zone'
  )

  if (candidates.length > 0) {
    resultId = candidates[Math.floor(Math.random() * candidates.length)].id
  } else {
    // Fallback: any slime of next rarity
    const fallback = (getAllSlimes() as ReturnType<typeof getAllSlimes>).filter(s => s.rarity === nextRarity && s.discovery === 'Zone')
    if (fallback.length > 0) {
      resultId = fallback[Math.floor(Math.random() * fallback.length)].id
    }
  }

  if (owned.count <= 0) delete state.collection[id]

  return { resultId, essenceGained, shardsGained }
}

// ---- Summon ----

export function getSummonCost(rarity: string): number {
  return SUMMON_COST[rarity] ?? SUMMON_COST.Common
}

export function canSummon(state: GameState): boolean {
  // Minimum summon cost is 25 (Common)
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
