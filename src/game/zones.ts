// Zone summoning and exploration logic
import type { GameState, ZoneId, SlimeId } from './state'
import { getSummonableSlimes, getSlime } from './slimes'
import { SUMMON_COST, PITY_SUMMON_THRESHOLD } from '../data/config'
import { addSpecialSlime } from './breeds'

// Weighted random summon from zone pool
export function performSummon(state: GameState): { slimeId: SlimeId; isNew: boolean; cost: number } | null {
  const zone = state.activeZone
  const pool = getSummonableSlimes(zone)
  if (pool.length === 0) return null

  // Determine what we can afford
  const canAffordRare = state.goo >= SUMMON_COST.Rare
  const canAffordUncommon = state.goo >= SUMMON_COST.Uncommon
  const canAffordCommon = state.goo >= SUMMON_COST.Common

  if (!canAffordCommon) return null

  // Pity system: if summonsSinceNew >= threshold, guarantee undiscovered slime
  const pityThreshold = state.discoveryLevel >= 13 ? 5 : state.discoveryLevel >= 2 ? 7 : PITY_SUMMON_THRESHOLD
  const isPityTrigger = (state.summonsSinceNew[zone] ?? 0) >= pityThreshold

  let candidates = pool

  if (isPityTrigger) {
    // Force undiscovered slime
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

  // Check special triggers
  checkSummonSpecials(state)

  return { slimeId: pickedId, isNew, cost }
}

function checkSummonSpecials(state: GameState): void {
  // Oversized Slime: 100+ slimes in collection
  if (!state.oversizedSlimeUnlocked) {
    const total = Object.values(state.collection).reduce((sum, o) => sum + o.count, 0)
    if (total >= 100) {
      state.oversizedSlimeUnlocked = true
      addSpecialSlime(state, '517')
    }
  }

  // Slime King: all 25 Zone 3 slimes
  if (!state.slimeKingUnlocked && state.unlockedZones.includes(3)) {
    const zone3Count = Object.keys(state.collection).filter(id => {
      const def = getSlime(id)
      return def?.zone === 3
    }).length
    if (zone3Count >= 25) {
      state.slimeKingUnlocked = true
      addSpecialSlime(state, '522')
    }
  }

  // Slime Queen: all 25 Zone 4 slimes
  if (!state.slimeQueenUnlocked && state.unlockedZones.includes(4)) {
    const zone4Count = Object.keys(state.collection).filter(id => {
      const def = getSlime(id)
      return def?.zone === 4
    }).length
    if (zone4Count >= 25) {
      state.slimeQueenUnlocked = true
      addSpecialSlime(state, '523')
    }
  }

  // Primordial Goo: all 6 zone apex Epics
  if (!state.primordialGooUnlocked) {
    const apexIds = ['162', '174', '186', '198', '210', '222']
    if (apexIds.every(id => !!state.collection[id])) {
      state.primordialGooUnlocked = true
      addSpecialSlime(state, '526')
    }
  }

  // True Form: all 526 other slimes
  if (!state.trueFormUnlocked) {
    const count = Object.keys(state.collection).filter(id => id !== '527').length
    if (count >= 526) {
      state.trueFormUnlocked = true
      addSpecialSlime(state, '527')
    }
  }
}

export function checkTapSpecials(state: GameState): void {
  // Glitch Slime: exactly 999 taps without spending
  if (!state.glitchSlimeUnlocked && state.tapsSinceSpend === 999) {
    state.glitchSlimeUnlocked = true
    addSpecialSlime(state, '515')
  }
}

export function checkTimeSpecials(state: GameState): void {
  // Elder Slime: a slime at max level for 24h
  if (!state.collection['519'] && state.maxLevelReachedAt) {
    const hoursElapsed = (Date.now() - state.maxLevelReachedAt) / (1000 * 60 * 60)
    if (hoursElapsed >= 24) {
      addSpecialSlime(state, '519')
    }
  }

  // Haunted Slime: breed after midnight
  // Checked in breed start
}
