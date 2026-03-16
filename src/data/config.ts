// All tunable game constants. Change here — nowhere else.

export const GOO_PER_TAP_BASE = 1

export const PASSIVE_GOO_BASE: Record<string, number> = {
  Common: 0.5,
  Uncommon: 2.0,
  Rare: 10.0,
  Epic: 50.0,
  Legendary: 250.0,
  Mythic: 2000.0,
}

export const LEVEL_UP_MULTIPLIER = 1.5   // production multiplier per level
export const FEED_COST_MULTIPLIER = 2.5  // feed cost multiplier per level
export const MAX_SLIME_LEVEL = 10

export const FEED_BASE_COST: Record<string, number> = {
  Common: 50,
  Uncommon: 150,
  Rare: 500,
  Epic: 2000,
  Legendary: 10000,
  Mythic: 50000,
}

export const SUMMON_COST: Record<string, number> = {
  Common: 25,
  Uncommon: 100,
  Rare: 500,
}

export const MERGE_COUNT_REQUIRED = 3
export const ESSENCE_PER_MERGE = 1
export const ESSENCE_PER_MAX_LEVEL = 5
export const FAVORITE_FOOD_BONUS = 0.25  // 25% feed cost reduction

export const BREED_COOLDOWN_MS = 45_000
export const BREED_FAIL_COOLDOWN_MS = 15_000
export const MAX_BREED_SLOTS = 4

export const OFFLINE_CAP_HOURS = 8
export const SAVE_INTERVAL_MS = 30_000

export const PITY_SUMMON_THRESHOLD = 10

export const ZONE_UNLOCK_COSTS: Record<number, number> = {
  1: 0,
  2: 1_000,
  3: 15_000,
  4: 200_000,
  5: 5_000_000,
  6: 150_000_000,
}

// Output upgrade multipliers per level (index 0 = level 1)
export const OUTPUT_MULTIPLIERS = [
  1.0, 1.25, 1.5625, 1.953, 2.441, 3.052,
  3.815, 4.768, 5.960, 7.451, 9.313, 11.642,
  14.552, 18.190, 22.738, 28.422, 35.528, 44.410,
  55.512, 69.390, 86.738,
]

// Tap power per level (index 0 = base, index 1 = level 1 upgrade)
export const TAP_POWER: number[] = Array.from({ length: 16 }, (_, i) => Math.pow(2, i))

// Breed slot unlocks by Discovery upgrade level
export const BREED_SLOT_UNLOCKS: Record<number, number> = {
  4: 2,   // Discovery Lv.4 → 2 slots
  9: 3,   // Discovery Lv.9 → 3 slots
  15: 4,  // Discovery Lv.15 → 4 slots (also costs 50 Prism Shards)
}

export const BREED_SLOT_4_SHARD_COST = 50

// Breed cooldown reduction by Discovery level
export const BREED_COOLDOWN_REDUCTION: Record<number, number> = {
  3: 0.80,  // Lv.3: -20% → ×0.80
  7: 0.64,  // Lv.7: another -20% → ×0.80 of 0.80
  11: 0.544, // Lv.11: -15% of current → ×0.85
}

// Pity threshold reduction by Discovery level
export const PITY_REDUCTION: Record<number, number> = {
  2: 7,   // Lv.2 → pity at 7 summons
  13: 5,  // Lv.13 → pity at 5 summons
}

// Synergy bonus: per matching rarity slime in collection
export const SYNERGY_BONUS_PER_SLIME = 0.02  // +2% per slime, max 20
export const SYNERGY_MAX_SLIMES = 20

// Zone completion bonus per biome (+10% Goo/sec from that biome's slimes)
export const ZONE_COMPLETION_BONUS = 0.10

export const SCIENTIFIC_NOTATION_THRESHOLD = 1_000_000

// Slimepedia milestones: completion fraction → reward description
export const SLIMEPEDIA_MILESTONES = [
  { fraction: 0.10, reward: 'breed_slot_2_available' },
  { fraction: 0.25, reward: 'output_bonus_25pct' },
  { fraction: 0.50, reward: 'breed_slot_3_available' },
  { fraction: 0.75, reward: 'output_bonus_100pct' },
  { fraction: 0.90, reward: 'breed_slot_4_available' },
  { fraction: 1.00, reward: 'true_ending' },
]

export const TOTAL_SLIMES = 527
