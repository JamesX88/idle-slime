import { ZONE_UNLOCK_COSTS, PITY_SUMMON_THRESHOLD, PITY_REDUCTION } from '../data/config'
import { getState, setState } from './state'
import { getZoneSummonPool, weightedSummon, pitySummon } from './slimes'
import type { ZoneId, SlimeId, OwnedSlime } from './types'
import { emitDiscovery } from './events'

export function canUnlockZone(zoneId: ZoneId): boolean {
  const state = getState()
  const cost = ZONE_UNLOCK_COSTS[zoneId] ?? Infinity
  return !state.unlockedZones.includes(zoneId) && state.goo >= cost
}

export function unlockZone(zoneId: ZoneId): void {
  const state = getState()
  const cost = ZONE_UNLOCK_COSTS[zoneId] ?? Infinity
  if (state.goo < cost || state.unlockedZones.includes(zoneId)) return

  setState(s => {
    s.goo -= cost
    s.unlockedZones = [...s.unlockedZones, zoneId].sort() as ZoneId[]
  })

  // Zone 6 secret: unlock all 6 zones
  checkZone6Secret()
}

export function setActiveZone(zoneId: ZoneId): void {
  setState(s => { s.activeZone = zoneId })
}

// ---------------------------------------------------------------------------
// Summoning
// ---------------------------------------------------------------------------

export function getSummonCost(zoneId: ZoneId): number {
  const pool = getZoneSummonPool(zoneId)
  // Cost is based on the cheapest available: if all common owned, rises slightly
  // Simple rule: base is 25 (Common price) — the detailed cost is for the rarity drawn
  // We show 25💧 as the listed cost (minimum)
  return 25
}

export function canSummon(zoneId: ZoneId): boolean {
  const state = getState()
  return state.unlockedZones.includes(zoneId) && state.goo >= getSummonCost(zoneId)
}

export function performSummon(zoneId: ZoneId): SlimeId | null {
  const state = getState()
  const pool = getZoneSummonPool(zoneId)
  if (!pool.length) return null

  const pityCount = state.summonPity[zoneId] ?? 0
  const pityThreshold = getPityThreshold(state.discoveryLevel)
  const ownedIds = new Set(Object.keys(state.collection) as SlimeId[])

  // Only draw from rarities the player can currently afford
  const costMap: Record<string, number> = { Common: 25, Uncommon: 100, Rare: 500 }
  const affordablePool = pool.filter(s => (costMap[s.rarity] ?? 25) <= state.goo)
  if (!affordablePool.length) return null

  let drawn = pityCount >= pityThreshold
    ? pitySummon(affordablePool, ownedIds)
    : weightedSummon(affordablePool)

  const cost = costMap[drawn.rarity] ?? 25

  const isNew = !state.collection[drawn.id]

  setState(s => {
    s.goo -= cost

    if (s.collection[drawn.id]) {
      s.collection[drawn.id]!.count += 1
    } else {
      const owned: OwnedSlime = {
        id: drawn.id,
        count: 1,
        level: 1,
        discoveredAt: Date.now(),
        discoveryNumber: ++s.totalDiscoveries,
      }
      s.collection[drawn.id] = owned
    }

    // Reset pity on new discovery, else increment
    s.summonPity[zoneId] = isNew ? 0 : pityCount + 1
  })

  if (isNew) {
    emitDiscovery(drawn.id)
    // Award Prism Shard on discovery
    setState(s => { s.prismShards += 1 })
  }

  return drawn.id
}

function getPityThreshold(discoveryLevel: number): number {
  if (discoveryLevel >= 13) return PITY_REDUCTION[13] ?? 5
  if (discoveryLevel >= 2) return PITY_REDUCTION[2] ?? 7
  return PITY_SUMMON_THRESHOLD
}

function checkZone6Secret(): void {
  const state = getState()
  if (state.unlockedZones.length === 6) {
    const secret = state.zoneSecrets.find(s => s.zoneId === 6)
    if (secret && !secret.completed) {
      setState(s => {
        const sec = s.zoneSecrets.find(z => z.zoneId === 6)
        if (sec) {
          sec.progress = 1
          sec.completed = true
        }
      })
      awardSecretSlime('150')
    }
  }
}

export function awardSecretSlime(id: SlimeId): void {
  const state = getState()
  const isNew = !state.collection[id]

  setState(s => {
    if (s.collection[id]) {
      s.collection[id]!.count += 1
    } else {
      s.collection[id] = {
        id,
        count: 1,
        level: 1,
        discoveredAt: Date.now(),
        discoveryNumber: ++s.totalDiscoveries,
      }
    }
  })

  if (isNew) {
    emitDiscovery(id)
    setState(s => { s.prismShards += 1 })
  }
}
