// specials.ts — Centralized special/secret slime trigger evaluation
//
// All special slimes (IDs 900–930) have their unlock conditions evaluated here.
// No other module should contain special-trigger logic.
//
// Special IDs:
//   900 — Mudslime            (failed breed)
//   901 — Mirror Slime        (self-reflective breed chain)
//   902 — Glitch Slime        (999 taps without spending)
//   903 — Lucky Slime         (0.1% breed chance)
//   904 — Oversized Slime     (100+ copies in collection)
//   905 — Miniature Slime     (first max-level slime)
//   906 — Elder Slime         (slime at max level for 24h)
//   907 — Haunted Slime       (breed after midnight)
//   908 — Curious Slime       (50 consecutive taps on same slime)
//   909 — Slime King          (all Zone 3 slimes)
//   910 — Slime Queen         (all Zone 4 slimes)
//   911 — Ancient Slime       (100 total breeds)
//   912 — Cosmic Jester Slime (breed with Mudslime)
//   913 — Primordial Goo      (all 6 zone apex Epics)
//   914 — The Great Slime (True Form) (complete Slimepedia)
//   916 — Meadow Phantom Slime  (Zone 1 secret: 200 total Zone 1 summons)
//   917 — Crystal Specter Slime (Zone 2 secret: merge 10 Zone 2 slimes in session)
//   918 — Ember Wraith Slime    (Zone 3 secret: 3 Zone 3 slimes at level 10)
//   919 — Frost Revenant Slime  (Zone 4 secret: breed after 1h idle)
//   920 — Jungle Phantom Slime  (Zone 5 secret: discover all Zone 5 Breed slimes)
//   921 — Void Specter Slime    (Zone 6 secret: collect all Zone 6 Legendaries)
//
// Call the appropriate check function after each relevant game event:
//   checkTapSpecials(state)     — after every tap
//   checkSummonSpecials(state)  — after every summon
//   checkBreedSpecials(state, resultId, parent1, parent2) — after every breed collect
//   checkFeedSpecials(state)    — after every feed
//   checkTimeSpecials(state)    — on the 60-second timer tick

import type { GameState, SlimeId } from './state'
import { getSlime, getAllSlimes } from './slimes'

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
  // 902 — Glitch Slime: exactly 999 taps without spending Goo
  if (!state.unlockedSpecials.has('902') && state.tapsSinceSpend === 999) {
    addSpecialSlime(state, '902')
  }

  // 908 — Curious Slime: tap the same slime 50 consecutive times
  if (!state.unlockedSpecials.has('908') && state.consecutiveTapCount >= 50) {
    addSpecialSlime(state, '908')
  }
}

// ---- Summon-triggered specials ----
// Call after a successful summon mutates the collection.
export function checkSummonSpecials(state: GameState): void {
  // 904 — Oversized Slime: 100+ total slime copies in collection simultaneously
  if (!state.unlockedSpecials.has('904')) {
    const total = Object.values(state.collection).reduce((sum, o) => sum + o.count, 0)
    if (total >= 100) {
      addSpecialSlime(state, '904')
    }
  }

  // 909 — Slime King: all Zone 3 slimes discovered (83 slimes in new roster)
  if (!state.unlockedSpecials.has('909') && state.unlockedZones.includes(3)) {
    const zone3All = getAllSlimes().filter(s => s.zone === 3)
    const zone3Owned = zone3All.filter(s => !!state.collection[s.id])
    if (zone3Owned.length >= zone3All.length && zone3All.length > 0) {
      addSpecialSlime(state, '909')
    }
  }

  // 910 — Slime Queen: all Zone 4 slimes discovered (83 slimes in new roster)
  if (!state.unlockedSpecials.has('910') && state.unlockedZones.includes(4)) {
    const zone4All = getAllSlimes().filter(s => s.zone === 4)
    const zone4Owned = zone4All.filter(s => !!state.collection[s.id])
    if (zone4Owned.length >= zone4All.length && zone4All.length > 0) {
      addSpecialSlime(state, '910')
    }
  }

  // 913 — Primordial Goo: collect all 6 zone apex Epics (discovery=Zone, rarity=Epic, one per zone)
  if (!state.unlockedSpecials.has('913')) {
    const apexEpics = getAllSlimes().filter(
      s => s.rarity === 'Epic' && s.discovery === 'Zone' && s.zone !== null
    )
    // Group by zone and take the first per zone (lowest ID = first generated)
    const zoneApexIds: string[] = []
    for (let z = 1; z <= 6; z++) {
      const zoneApex = apexEpics.filter(s => s.zone === z).sort((a, b) => parseInt(a.id) - parseInt(b.id))
      if (zoneApex.length > 0) zoneApexIds.push(zoneApex[0].id)
    }
    if (zoneApexIds.length === 6 && zoneApexIds.every(id => !!state.collection[id])) {
      addSpecialSlime(state, '913')
    }
  }

  // 914 — The Great Slime (True Form): all other slimes collected
  if (!state.unlockedSpecials.has('914')) {
    const totalSlimes = getAllSlimes().filter(s => s.id !== '914').length
    const owned = Object.keys(state.collection).filter(id => id !== '914').length
    if (owned >= totalSlimes && totalSlimes > 0) {
      addSpecialSlime(state, '914')
    }
  }

  // ---- Zone secrets (summon-triggered) ----

  // 916 — Meadow Phantom Slime: summon 200 total Zone 1 slimes
  if (!state.unlockedSpecials.has('916') && state.unlockedZones.includes(1)) {
    const zone1Summons = state.totalSummonsByZone?.[1] ?? 0
    if (zone1Summons >= 200) {
      addSpecialSlime(state, '916')
    }
  }

  // 921 — Void Specter Slime: collect all Zone 6 Legendary slimes
  if (!state.unlockedSpecials.has('921') && state.unlockedZones.includes(6)) {
    const zone6Legs = getAllSlimes().filter(s => s.zone === 6 && s.rarity === 'Legendary')
    if (zone6Legs.length > 0 && zone6Legs.every(s => !!state.collection[s.id])) {
      addSpecialSlime(state, '921')
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
  // 901 — Mirror Slime: breed a slime with the result of breeding that same slime.
  // Condition: one of the current parents is also a parent of the result.
  if (!state.unlockedSpecials.has('901') && parent1 && parent2) {
    const resultDef = getSlime(resultId)
    if (resultDef?.parent1 && resultDef?.parent2) {
      const resultParents = new Set([resultDef.parent1, resultDef.parent2])
      if (resultParents.has(parent1) || resultParents.has(parent2)) {
        addSpecialSlime(state, '901')
      }
    }
  }

  // 903 — Lucky Slime: 0.1% chance on any successful breed
  if (!state.unlockedSpecials.has('903') && Math.random() < 0.001) {
    addSpecialSlime(state, '903')
  }

  // 911 — Ancient Slime: 100 total successful breed operations
  if (!state.unlockedSpecials.has('911') && state.totalBreeds >= 100) {
    addSpecialSlime(state, '911')
  }

  // 912 — Cosmic Jester Slime: breed any slime with a Mudslime (900) as a parent
  if (!state.unlockedSpecials.has('912') && parent1 && parent2) {
    if (parent1 === '900' || parent2 === '900') {
      addSpecialSlime(state, '912')
    }
  }

  // 907 — Haunted Slime: breed any two slimes after midnight (local time)
  if (!state.unlockedSpecials.has('907')) {
    const hour = new Date().getHours()
    if (hour === 0 || hour === 1) {
      addSpecialSlime(state, '907')
    }
  }

  // 920 — Jungle Phantom Slime: discover all Zone 5 Breed slimes
  if (!state.unlockedSpecials.has('920') && state.unlockedZones.includes(5)) {
    const zone5Breeds = getAllSlimes().filter(s => s.zone === 5 && s.discovery === 'Breed')
    if (zone5Breeds.length > 0 && zone5Breeds.every(s => !!state.collection[s.id])) {
      addSpecialSlime(state, '920')
    }
  }

  // Re-check collection-count specials in case a breed pushed them over
  checkSummonSpecials(state)
}

// ---- Feed-triggered specials ----
// Call after feedSlime mutates the collection.
export function checkFeedSpecials(state: GameState): void {
  // 905 — Miniature Slime: first time any slime reaches max level
  if (!state.unlockedSpecials.has('905') && state.maxLevelEverReached) {
    addSpecialSlime(state, '905')
  }

  // 918 — Ember Wraith Slime: 3 Zone 3 slimes all at level 10 simultaneously
  if (!state.unlockedSpecials.has('918') && state.unlockedZones.includes(3)) {
    const zone3MaxLevel = Object.values(state.collection).filter(o => {
      const def = getSlime(o.id)
      return def?.zone === 3 && o.level >= 10
    })
    if (zone3MaxLevel.length >= 3) {
      addSpecialSlime(state, '918')
    }
  }
}

// ---- Time-triggered specials ----
// Called on the 60-second interval tick.
export function checkTimeSpecials(state: GameState): void {
  // 906 — Elder Slime: a slime stays at max level for 24 real-world hours
  if (!state.unlockedSpecials.has('906') && state.maxLevelReachedAt !== null) {
    const hoursElapsed = (Date.now() - state.maxLevelReachedAt) / (1000 * 60 * 60)
    if (hoursElapsed >= 24) {
      addSpecialSlime(state, '906')
    }
  }

  // 919 — Frost Revenant Slime: breed in Zone 4 after device has been idle for 1 hour
  // We detect "idle" as: lastSaveTime was > 1 hour ago (meaning no save = no activity)
  if (!state.unlockedSpecials.has('919') && state.unlockedZones.includes(4)) {
    const idleMs = Date.now() - state.lastSaveTime
    const idleHours = idleMs / (1000 * 60 * 60)
    if (idleHours >= 1 && state.activeZone === 4) {
      addSpecialSlime(state, '919')
    }
  }

  // 917 — Crystal Specter Slime: merge 10 Zone 2 slimes in a single session
  // Tracked via state.sessionMergesByZone (incremented in economy.ts mergeSlimes)
  if (!state.unlockedSpecials.has('917') && state.unlockedZones.includes(2)) {
    const sessionMerges = state.sessionMergesByZone?.[2] ?? 0
    if (sessionMerges >= 10) {
      addSpecialSlime(state, '917')
    }
  }
}
