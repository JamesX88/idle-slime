// Breed resolution logic
import breedTableData from '../data/breeds.json'
import type { SlimeId, GameState } from './state'
import { MUDSLIME_ID, LUCKY_SLIME_ID, LUCKY_SLIME_CHANCE, BREED_COOLDOWN_MS, BREED_FAIL_COOLDOWN_MS } from '../data/config'
import { checkBreedSpecials } from './specials'

const breedTable: Record<string, SlimeId> = breedTableData as Record<string, SlimeId>

export function resolveBreed(parent1: SlimeId, parent2: SlimeId): SlimeId {
  if (parent1 === parent2) return MUDSLIME_ID // same species — should use Merge
  const key = [parent1, parent2].sort().join('+')
  const result = breedTable[key]
  if (!result) return MUDSLIME_ID

  // Lucky Slime chance
  if (Math.random() < LUCKY_SLIME_CHANCE) return LUCKY_SLIME_ID

  return result
}

export function getBreedCooldown(state: GameState): number {
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
    const p2AfterConsume = state.collection[parent2]
    if (!p2AfterConsume || p2AfterConsume.count < 1) {
      // Restore — guard against edge case
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

/**
 * Collect a completed breed result. Fully self-contained:
 * - Adds result to collection
 * - Increments totalBreeds and totalDiscoveries
 * - Grants a Prism Shard for new discoveries
 * - Applies failed-breed short cooldown for Mudslime results
 * - Fires checkBreedSpecials with parent context
 *
 * Returns a descriptor for the UI to present feedback.
 */
export function collectBreedResult(
  state: GameState,
  slotId: number,
): { resultId: SlimeId; isNew: boolean; parent1: SlimeId | null; parent2: SlimeId | null } | null {
  const slot = state.breedSlots[slotId]
  if (!slot || slot.resultId === null) return null

  const resultId = slot.resultId
  const parent1 = slot.parent1
  const parent2 = slot.parent2
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

  // Apply failed breed short cooldown
  if (isFailed) {
    slot.startTime = Date.now() - slot.cooldownMs + BREED_FAIL_COOLDOWN_MS
  }

  // Reset slot
  slot.parent1 = null
  slot.parent2 = null
  slot.startTime = null
  slot.resultId = null

  // Evaluate all breed-triggered special conditions (centralized in specials.ts)
  checkBreedSpecials(state, resultId, parent1, parent2)

  return { resultId, isNew, parent1, parent2 }
}

export function unlockBreedSlot(state: GameState, slotId: number): void {
  if (state.breedSlots[slotId]) {
    state.breedSlots[slotId].locked = false
  }
}
