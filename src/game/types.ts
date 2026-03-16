export type SlimeId = string   // zero-padded 3 digits: "001"–"527"
export type ZoneId = 1 | 2 | 3 | 4 | 5 | 6
export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic'
export type DiscoveryType = 'Zone' | 'Breed' | 'Special'

export interface SlimeDef {
  id: SlimeId
  name: string
  rarity: Rarity
  discovery: DiscoveryType
  zone: ZoneId | null
  parent1: SlimeId | null
  parent2: SlimeId | null
  baseGooPerSec: number
  lore: string
  element: string[]
  favoriteFood: string
  notes: string
}

export interface OwnedSlime {
  id: SlimeId
  count: number             // copies owned (all share one level)
  level: number             // 1–10
  discoveredAt: number      // unix timestamp
  discoveryNumber: number   // e.g. 47th slime discovered
}

export type BreedSlotStatus = 'idle' | 'breeding' | 'locked'

export interface BreedSlot {
  slotIndex: number
  status: BreedSlotStatus
  parent1: SlimeId | null
  parent2: SlimeId | null
  startTime: number | null  // unix timestamp breed started
  cooldownMs: number        // computed, not stored
}

export interface ZoneSecret {
  zoneId: ZoneId
  resultSlimeId: SlimeId
  triggerType: 'TAP_N_TIMES' | 'REACH_GOO_THRESHOLD' | 'HAVE_N_TYPE_SLIMES' | 'BREED_COUNT'
  target: number
  progress: number
  completed: boolean
  description: string        // shown in UI after Discovery Lv.8
}

export interface GameState {
  // Currencies
  goo: number
  essence: number
  prismShards: number

  // Zones
  unlockedZones: ZoneId[]
  activeZone: ZoneId

  // Pity counter per zone (resets on new discovery in that zone)
  summonPity: Partial<Record<ZoneId, number>>

  // Collection
  collection: Record<SlimeId, OwnedSlime>

  // Upgrades
  tapPowerLevel: number    // 0 = base (1 goo/tap), 1–15 upgraded
  outputLevel: number      // 0 = base, 1–20 upgraded
  discoveryLevel: number   // 0 = base, 1–15 upgraded

  // Breed slots (always 4 entries, locked/unlocked via status)
  breedSlots: [BreedSlot, BreedSlot, BreedSlot, BreedSlot]

  // Zone secrets
  zoneSecrets: ZoneSecret[]

  // Meta
  totalBreeds: number
  totalDiscoveries: number
  lastSaveTime: number
  firstPlayTime: number

  // Settings
  soundEnabled: boolean
  musicEnabled: boolean
  reduceMotion: boolean
  highContrast: boolean
  largeText: boolean
  notificationsEnabled: boolean
}
