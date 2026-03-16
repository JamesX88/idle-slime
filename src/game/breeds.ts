import { MERGE_COUNT_REQUIRED, ESSENCE_PER_MERGE, ESSENCE_PER_MAX_LEVEL, MAX_SLIME_LEVEL } from '../data/config'
import { getState, setState } from './state'
import { resolveBreed, getSlime, MUDSLIME_ID } from './slimes'
import { emitDiscovery, emitBreed, emitMerge } from './events'
import { getBreedCooldownMs } from './upgrades'
import type { SlimeId, OwnedSlime } from './types'

// ---------------------------------------------------------------------------
// Feeding
// ---------------------------------------------------------------------------

import { feedCost } from './economy'

export function canFeed(id: SlimeId): boolean {
  const state = getState()
  const owned = state.collection[id]
  if (!owned || owned.level >= MAX_SLIME_LEVEL) return false
  return state.goo >= feedCost(owned)
}

export function feed(id: SlimeId): void {
  if (!canFeed(id)) return
  const state = getState()
  const owned = state.collection[id]!
  const cost = feedCost(owned)

  setState(s => {
    s.goo -= cost
    s.collection[id]!.level += 1
    if (s.collection[id]!.level === MAX_SLIME_LEVEL) {
      s.essence += ESSENCE_PER_MAX_LEVEL
    }
  })
}

// ---------------------------------------------------------------------------
// Merging
// ---------------------------------------------------------------------------

export function canMerge(id: SlimeId): boolean {
  const state = getState()
  const owned = state.collection[id]
  return !!owned && owned.count >= MERGE_COUNT_REQUIRED
}

export function merge(id: SlimeId): void {
  if (!canMerge(id)) return
  const def = getSlime(id)
  if (!def) return

  // Determine result: next rarity tier of the same species doesn't exist in GDD,
  // so merge produces Essence + shard at max rarity; or for zone slimes, a
  // random uncommon breed is not in scope — per GDD: "merge 3 identical → 1 of next rarity tier"
  // For v1: merging gives Essence (always), placeholder for rarity-up result.

  setState(s => {
    s.collection[id]!.count -= MERGE_COUNT_REQUIRED
    if (s.collection[id]!.count === 0) delete s.collection[id]
    s.essence += ESSENCE_PER_MERGE
  })

  emitMerge(id)
}

// ---------------------------------------------------------------------------
// Breeding
// ---------------------------------------------------------------------------

export function canStartBreed(slotIndex: number, parent1: SlimeId, parent2: SlimeId): boolean {
  const state = getState()
  const slot = state.breedSlots[slotIndex]
  if (!slot || slot.status !== 'idle') return false
  if (parent1 === parent2) return false
  const p1 = state.collection[parent1]
  const p2 = state.collection[parent2]
  return !!p1 && !!p2 && p1.count > 0 && p2.count > 0
}

export function startBreed(slotIndex: number, parent1: SlimeId, parent2: SlimeId): void {
  if (!canStartBreed(slotIndex, parent1, parent2)) return
  const cooldownMs = getBreedCooldownMs()

  setState(s => {
    // Consume parents
    s.collection[parent1]!.count -= 1
    if (s.collection[parent1]!.count === 0) delete s.collection[parent1]
    s.collection[parent2]!.count -= 1
    if (s.collection[parent2]!.count === 0) delete s.collection[parent2]

    const slot = s.breedSlots[slotIndex]!
    slot.status = 'breeding'
    slot.parent1 = parent1
    slot.parent2 = parent2
    slot.startTime = Date.now()
    slot.cooldownMs = cooldownMs
  })
}

export function tickBreedSlots(): void {
  const state = getState()
  const now = Date.now()

  for (let i = 0; i < state.breedSlots.length; i++) {
    const slot = state.breedSlots[i]!
    if (slot.status !== 'breeding' || !slot.startTime) continue

    const elapsed = now - slot.startTime
    if (elapsed < slot.cooldownMs) continue

    // Resolve breed
    const parent1 = slot.parent1!
    const parent2 = slot.parent2!
    const resultId = resolveBreed(parent1, parent2)
    const isNew = !state.collection[resultId]

    setState(s => {
      const slot = s.breedSlots[i]!
      slot.status = 'idle'
      slot.parent1 = null
      slot.parent2 = null
      slot.startTime = null

      if (s.collection[resultId]) {
        s.collection[resultId]!.count += 1
      } else {
        const owned: OwnedSlime = {
          id: resultId,
          count: 1,
          level: 1,
          discoveredAt: Date.now(),
          discoveryNumber: ++s.totalDiscoveries,
        }
        s.collection[resultId] = owned
      }

      s.totalBreeds += 1
    })

    emitBreed(resultId)
    if (isNew) {
      emitDiscovery(resultId)
      setState(s => { s.prismShards += 1 })
    }

    // Check breed-based zone secrets
    checkBreedSecrets()
    // Check Ancient Slime (100 breeds)
    checkAncientSlime()
  }
}

function checkBreedSecrets(): void {
  const state = getState()
  const secret = state.zoneSecrets.find(s => s.zoneId === state.activeZone && s.triggerType === 'BREED_COUNT')
  if (!secret || secret.completed) return

  setState(s => {
    const sec = s.zoneSecrets.find(z => z.zoneId === s.activeZone && z.triggerType === 'BREED_COUNT')
    if (!sec || sec.completed) return
    sec.progress += 1
    if (sec.progress >= sec.target) {
      sec.completed = true
      // Award the secret slime
      import('./zones').then(({ awardSecretSlime }) => awardSecretSlime(sec.resultSlimeId))
    }
  })
}

function checkAncientSlime(): void {
  const state = getState()
  if (state.totalBreeds >= 100 && !state.collection['524']) {
    import('./zones').then(({ awardSecretSlime }) => awardSecretSlime('524'))
  }
}
