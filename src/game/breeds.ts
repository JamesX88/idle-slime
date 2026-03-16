// Breed resolution logic
import breedTableData from '../data/breeds.json'
import type { SlimeId, GameState } from './state'
import { MUDSLIME_ID, LUCKY_SLIME_ID, LUCKY_SLIME_CHANCE, BREED_COOLDOWN_MS, BREED_FAIL_COOLDOWN_MS } from '../data/config'
import { getSlime } from './slimes'

const breedTable: Record<string, SlimeId> = breedTableData as Record<string, SlimeId>

export function resolveBreed(parent1: SlimeId, parent2: SlimeId): SlimeId {
  if (parent1 === parent2) return MUDSLIME_ID // same species — should use merge
  const key = [parent1, parent2].sort().join('+')
  const result = breedTable[key]
  if (!result) return MUDSLIME_ID

  // Lucky Slime chance
  if (Math.random() < LUCKY_SLIME_CHANCE) return LUCKY_SLIME_ID

  return result
}

export function getBreedCooldown(state: GameState): number {
  // Apply Discovery upgrade reductions
  let ms = BREED_COOLDOWN_MS
  if (state.discoveryLevel >= 3) ms = Math.floor(ms * 0.8)   // -20%
  if (state.discoveryLevel >= 7) ms = Math.floor(ms * 0.8)   // -20% again
  if (state.discoveryLevel >= 11) ms = Math.floor(ms * 0.85) // -15% again
  return ms
}

export function startBreed(state: GameState, slotId: number, parent1: SlimeId, parent2: SlimeId): boolean {
  const slot = state.breedSlots[slotId]
  if (!slot || slot.locked || slot.startTime !== null) return false

  const p1Owned = state.collection[parent1]
  const p2Owned = state.collection[parent2]
  if (!p1Owned || !p2Owned) return false
  if (parent1 === parent2 && p1Owned.count < 2) return false
  if (parent1 !== parent2 && (p1Owned.count < 1 || p2Owned.count < 1)) return false

  // Consume parents
  p1Owned.count--
  if (p1Owned.count <= 0) delete state.collection[parent1]

  if (parent1 === parent2) {
    // Re-check after consuming first
    const p2AfterConsume = state.collection[parent2]
    if (!p2AfterConsume || p2AfterConsume.count < 1) {
      // Restore — shouldn't happen but guard
      if (!state.collection[parent1]) {
        state.collection[parent1] = { id: parent1, count: 1, level: 1, discoveredAt: Date.now(), discoveryNumber: 0 }
      } else {
        state.collection[parent1].count++
      }
      return false
    }
    p2AfterConsume.count--
    if (p2AfterConsume.count <= 0) delete state.collection[parent2]
  } else {
    p2Owned.count--
    if (p2Owned.count <= 0) delete state.collection[parent2]
  }

  const cooldown = getBreedCooldown(state)
  slot.parent1 = parent1
  slot.parent2 = parent2
  slot.startTime = Date.now()
  slot.cooldownMs = cooldown
  slot.resultId = null

  return true
}

export function tickBreeds(state: GameState): SlimeId[] {
  const completed: SlimeId[] = []
  const now = Date.now()

  for (const slot of state.breedSlots) {
    if (slot.locked || slot.startTime === null || slot.resultId !== null) continue
    if (now - slot.startTime >= slot.cooldownMs) {
      const result = resolveBreed(slot.parent1!, slot.parent2!)
      slot.resultId = result
      completed.push(result)
    }
  }

  return completed
}

export function collectBreedResult(state: GameState, slotId: number): { resultId: SlimeId; isNew: boolean } | null {
  const slot = state.breedSlots[slotId]
  if (!slot || slot.resultId === null) return null

  const resultId = slot.resultId
  const isNew = !state.collection[resultId]
  const isFailed = resultId === MUDSLIME_ID

  // Add to collection
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
    if (isNew && !isFailed) {
      state.prismShards++
    }
  }

  state.totalBreeds++

  // Apply failed breed cooldown if Mudslime
  const failCooldown = isFailed ? BREED_FAIL_COOLDOWN_MS : 0
  if (failCooldown > 0) {
    slot.startTime = Date.now() - slot.cooldownMs + failCooldown
  }

  // Reset slot
  slot.parent1 = null
  slot.parent2 = null
  slot.startTime = null
  slot.resultId = null

  // Check special breed triggers
  checkBreedSpecials(state, resultId)

  return { resultId, isNew }
}

function checkBreedSpecials(state: GameState, resultId: SlimeId): void {
  // Ancient Slime: 100 total breeds
  if (!state.ancientSlimeUnlocked && state.totalBreeds >= 100) {
    state.ancientSlimeUnlocked = true
    addSpecialSlime(state, '524')
  }

  // Cosmic Jester: breed any slime with Mudslime
  if (!state.cosmicJesterUnlocked && resultId === MUDSLIME_ID) {
    // The result was a mudslime — check if this was intentional (we can't tell, but we award it)
    // Actually: Cosmic Jester requires breeding WITH a mudslime as parent
    // This is checked in startBreed context — we'll handle it there
  }
}

export function addSpecialSlime(state: GameState, id: SlimeId): boolean {
  if (state.collection[id]) return false
  state.totalDiscoveries++
  state.collection[id] = {
    id,
    count: 1,
    level: 1,
    discoveredAt: Date.now(),
    discoveryNumber: state.totalDiscoveries,
  }
  state.prismShards++
  return true
}

export function unlockBreedSlot(state: GameState, slotId: number): void {
  if (state.breedSlots[slotId]) {
    state.breedSlots[slotId].locked = false
  }
}
