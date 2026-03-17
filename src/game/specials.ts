// specials.ts — Centralized special/secret slime trigger evaluation
//
// All 15 special slimes (IDs 513–527) have their unlock conditions evaluated
// here. No other module should contain special-trigger logic.
//
// Call the appropriate check function after each relevant game event:
//   checkTapSpecials(state)     — after every tap
//   checkSummonSpecials(state)  — after every summon
//   checkBreedSpecials(state, resultId, parent1, parent2) — after every breed collect
//   checkFeedSpecials(state)    — after every feed
//   checkTimeSpecials(state)    — on the 60-second timer tick

import type { GameState, SlimeId } from './state'
import { getSlime } from './slimes'

// ---- Internal: add a special slime to the collection ----
// Returns true if this was a new discovery, false if already owned.
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
  state.unlockedSpecials.add(id)
  return true
}

// ---- Tap-triggered specials ----
// Call after incrementing state.tapCount / state.tapsSinceSpend.
export function checkTapSpecials(state: GameState): void {
  // 515 — Glitch Slime: exactly 999 taps without spending Goo
  if (!state.unlockedSpecials.has('515') && state.tapsSinceSpend === 999) {
    addSpecialSlime(state, '515')
  }

  // 521 — Curious Slime: tap the same slime 50 consecutive times
  if (!state.unlockedSpecials.has('521') && state.consecutiveTapCount >= 50) {
    addSpecialSlime(state, '521')
  }
}

// ---- Summon-triggered specials ----
// Call after a successful summon mutates the collection.
export function checkSummonSpecials(state: GameState): void {
  // 517 — Oversized Slime: 100+ total slime copies in collection simultaneously
  if (!state.unlockedSpecials.has('517')) {
    const total = Object.values(state.collection).reduce((sum, o) => sum + o.count, 0)
    if (total >= 100) {
      addSpecialSlime(state, '517')
    }
  }

  // 522 — Slime King: all 25 Zone 3 slimes discovered
  if (!state.unlockedSpecials.has('522') && state.unlockedZones.includes(3)) {
    const zone3Count = Object.keys(state.collection).filter(id => {
      const def = getSlime(id)
      return def?.zone === 3
    }).length
    if (zone3Count >= 25) {
      addSpecialSlime(state, '522')
    }
  }

  // 523 — Slime Queen: all 25 Zone 4 slimes discovered
  if (!state.unlockedSpecials.has('523') && state.unlockedZones.includes(4)) {
    const zone4Count = Object.keys(state.collection).filter(id => {
      const def = getSlime(id)
      return def?.zone === 4
    }).length
    if (zone4Count >= 25) {
      addSpecialSlime(state, '523')
    }
  }

  // 526 — Primordial Goo: collect all 6 zone apex Epics (one per biome)
  if (!state.unlockedSpecials.has('526')) {
    const apexIds = ['162', '174', '186', '198', '210', '222']
    if (apexIds.every(id => !!state.collection[id])) {
      addSpecialSlime(state, '526')
    }
  }

  // 527 — The Great Slime (True Form): all 526 other slimes collected
  if (!state.unlockedSpecials.has('527')) {
    const count = Object.keys(state.collection).filter(id => id !== '527').length
    if (count >= 526) {
      addSpecialSlime(state, '527')
    }
  }
}

// ---- Breed-triggered specials ----
// Call after collectBreedResult mutates the collection.
// parent1 / parent2 are the IDs of the slimes that were bred.
export function checkBreedSpecials(
  state: GameState,
  resultId: SlimeId,
  parent1: SlimeId | null,
  parent2: SlimeId | null,
): void {
  // 514 — Mirror Slime: breed a slime with the result of breeding that same slime.
  // Condition: parent1 and parent2 are the same species as the result (i.e., the
  // player bred X + X-derived-result, producing X again). We detect this by
  // checking if the result's parents include one of the current parents.
  if (!state.unlockedSpecials.has('514') && parent1 && parent2) {
    const resultDef = getSlime(resultId)
    if (resultDef?.parent1 && resultDef?.parent2) {
      const resultParents = new Set([resultDef.parent1, resultDef.parent2])
      if (resultParents.has(parent1) || resultParents.has(parent2)) {
        // One of the parents of this breed is also a parent of the result — mirror chain
        addSpecialSlime(state, '514')
      }
    }
  }

  // 524 — Ancient Slime: 100 total successful breed operations
  if (!state.unlockedSpecials.has('524') && state.totalBreeds >= 100) {
    addSpecialSlime(state, '524')
  }

  // 525 — Cosmic Jester Slime: breed any slime with a Mudslime (513) as a parent
  if (!state.unlockedSpecials.has('525') && parent1 && parent2) {
    if (parent1 === '513' || parent2 === '513') {
      addSpecialSlime(state, '525')
    }
  }

  // 520 — Haunted Slime: breed any two slimes after midnight (local time)
  if (!state.unlockedSpecials.has('520')) {
    const now = new Date()
    const hour = now.getHours()
    if (hour === 0 || hour === 1) {
      // Between midnight and 2 AM local time
      addSpecialSlime(state, '520')
    }
  }

  // Re-check summon-style collection-count specials in case a breed pushed them over
  checkSummonSpecials(state)
}

// ---- Feed-triggered specials ----
// Call after feedSlime mutates the collection.
export function checkFeedSpecials(state: GameState): void {
  // 518 — Miniature Slime: first time any slime reaches max level
  if (!state.unlockedSpecials.has('518') && state.maxLevelEverReached) {
    addSpecialSlime(state, '518')
  }
}

// ---- Time-triggered specials ----
// Called on the 60-second interval tick.
export function checkTimeSpecials(state: GameState): void {
  // 519 — Elder Slime: a slime stays at max level for 24 real-world hours
  if (!state.unlockedSpecials.has('519') && state.maxLevelReachedAt !== null) {
    const hoursElapsed = (Date.now() - state.maxLevelReachedAt) / (1000 * 60 * 60)
    if (hoursElapsed >= 24) {
      addSpecialSlime(state, '519')
    }
  }
}
