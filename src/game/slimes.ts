import slimesData from '../data/slimes.json'
import breedsData from '../data/breeds.json'
import type { SlimeDef, SlimeId, ZoneId } from './types'

// ---------------------------------------------------------------------------
// Slime definitions
// ---------------------------------------------------------------------------

const ALL_SLIMES: SlimeDef[] = slimesData as SlimeDef[]
const SLIME_MAP = new Map<SlimeId, SlimeDef>(ALL_SLIMES.map(s => [s.id, s]))
const BREED_TABLE: Record<string, SlimeId> = breedsData as Record<string, SlimeId>

// Mudslime ID — result of incompatible breeds
export const MUDSLIME_ID: SlimeId = '513'

export function getSlime(id: SlimeId): SlimeDef | undefined {
  return SLIME_MAP.get(id)
}

export function getAllSlimes(): SlimeDef[] {
  return ALL_SLIMES
}

// ---------------------------------------------------------------------------
// Zone summoning pool
// ---------------------------------------------------------------------------

// Non-secret zone slimes (secret slimes have 'Zone N secret' in notes)
export function getZoneSummonPool(zoneId: ZoneId): SlimeDef[] {
  return ALL_SLIMES.filter(
    s => s.discovery === 'Zone' && s.zone === zoneId && !s.notes.includes('secret')
  )
}

// ---------------------------------------------------------------------------
// Breed resolution
// ---------------------------------------------------------------------------

export function resolveBreed(parent1: SlimeId, parent2: SlimeId): SlimeId {
  if (parent1 === parent2) return MUDSLIME_ID  // same species → incompatible (use merge instead)
  const key = [parent1, parent2].sort().join('+')
  return BREED_TABLE[key] ?? MUDSLIME_ID
}

// ---------------------------------------------------------------------------
// Rarity helpers
// ---------------------------------------------------------------------------

export const RARITY_ORDER = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic']

export function rarityIndex(rarity: string): number {
  return RARITY_ORDER.indexOf(rarity)
}

export function rarityColor(rarity: string): string {
  return {
    Common: 'var(--rarity-common)',
    Uncommon: 'var(--rarity-uncommon)',
    Rare: 'var(--rarity-rare)',
    Epic: 'var(--rarity-epic)',
    Legendary: 'var(--rarity-legendary)',
    Mythic: 'var(--rarity-mythic)',
  }[rarity] ?? 'var(--rarity-common)'
}

export function rarityIcon(rarity: string): string {
  return {
    Common: '⬜',
    Uncommon: '🟩',
    Rare: '🟦',
    Epic: '🟪',
    Legendary: '🟨',
    Mythic: '🌈',
  }[rarity] ?? '⬜'
}

// ---------------------------------------------------------------------------
// Summon weighting
// ---------------------------------------------------------------------------

const SUMMON_WEIGHTS: Record<string, number> = {
  Common: 70,
  Uncommon: 25,
  Rare: 5,
}

export function weightedSummon(pool: SlimeDef[]): SlimeDef {
  const totalWeight = pool.reduce((sum, s) => sum + (SUMMON_WEIGHTS[s.rarity] ?? 1), 0)
  let roll = Math.random() * totalWeight
  for (const slime of pool) {
    roll -= SUMMON_WEIGHTS[slime.rarity] ?? 1
    if (roll <= 0) return slime
  }
  return pool[pool.length - 1]!
}

// Pity: guarantee a non-owned species after N summons
export function pitySummon(
  pool: SlimeDef[],
  owned: Set<SlimeId>,
): SlimeDef {
  const unowned = pool.filter(s => !owned.has(s.id))
  if (unowned.length === 0) return weightedSummon(pool)
  // Pity picks lowest rarity unowned first
  unowned.sort((a, b) => rarityIndex(a.rarity) - rarityIndex(b.rarity))
  return unowned[0]!
}
