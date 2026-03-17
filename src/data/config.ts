// All tunable game constants — exposed here for easy balancing
// Values sourced from economy.md and upgrade-trees.md

export const GAME_VERSION = '1.0.0'
export const SAVE_KEY = 'idle-slime-save'

// --- Tap ---
export const GOO_PER_TAP_BASE = 1
export const TAP_BURST_MULTIPLIER = 10
export const TAP_BURST_COOLDOWN_MS = 30_000
export const TAP_BURST_HOLD_MS = 3_000

// --- Production ---
export const LEVEL_UP_MULTIPLIER = 1.5   // +50% per level
export const MAX_LEVEL = 10

// --- Feed costs (base cost for level 1→2 by rarity) ---
export const FEED_COST_MULTIPLIER = 2.5
export const FEED_BASE: Record<string, number> = {
  Common: 50,
  Uncommon: 150,
  Rare: 500,
  Epic: 2000,
  Legendary: 10000,
  Mythic: 50000,
}
export const FAVORITE_FOOD_DISCOUNT = 0.25  // 25% off when feeding favorite food

// --- Base Goo/sec per rarity ---
export const PASSIVE_GOO_BASE: Record<string, number> = {
  Common: 0.5,
  Uncommon: 2.0,
  Rare: 10.0,
  Epic: 50.0,
  Legendary: 250.0,
  Mythic: 2000.0,
}

// --- Summon costs (legacy flat — used as Zone 1 baseline) ---
// Per-zone costs are in ZONE_SUMMON_COST below.
export const SUMMON_COST: Record<string, number> = {
  Common: 25,
  Uncommon: 100,
  Rare: 500,
  Epic: 5_000,
  Legendary: 50_000,
  Mythic: 500_000,
}

// Per-zone summon costs — scales with zone goo production (~10× per zone).
// Zone 1 matches the legacy flat costs for backward compatibility.
export const ZONE_SUMMON_COST: Record<number, Record<string, number>> = {
  1: { Common: 25,       Uncommon: 100,       Rare: 500,         Epic: 5_000,       Legendary: 50_000,       Mythic: 500_000 },
  2: { Common: 150,      Uncommon: 600,       Rare: 3_000,       Epic: 30_000,      Legendary: 300_000,      Mythic: 3_000_000 },
  3: { Common: 1_000,    Uncommon: 4_000,     Rare: 20_000,      Epic: 200_000,     Legendary: 2_000_000,    Mythic: 20_000_000 },
  4: { Common: 8_000,    Uncommon: 32_000,    Rare: 160_000,     Epic: 1_600_000,   Legendary: 16_000_000,   Mythic: 160_000_000 },
  5: { Common: 60_000,   Uncommon: 240_000,   Rare: 1_200_000,   Epic: 12_000_000,  Legendary: 120_000_000,  Mythic: 1_200_000_000 },
  6: { Common: 500_000,  Uncommon: 2_000_000, Rare: 10_000_000,  Epic: 100_000_000, Legendary: 1_000_000_000,Mythic: 10_000_000_000 },
}

// Rarity weights for the summon pool.
// Epic/Legendary/Mythic are now in the pool but at very low weights.
export const SUMMON_WEIGHTS: Record<string, number> = {
  Common:    5500,  // ~66.5%
  Uncommon:  2200,  // ~26.6%
  Rare:       500,  // ~6.0%
  Epic:        50,  // ~0.6%
  Legendary:   15,  // ~0.18%
  Mythic:       3,  // ~0.04%
}

// Pity thresholds — after N summons without a slime of that tier or higher,
// the next summon is guaranteed to be at least that tier.
export const PITY_UNCOMMON_THRESHOLD = 20   // guarantee Uncommon+ after 20 dry summons
export const PITY_RARE_THRESHOLD     = 50   // guarantee Rare+ after 50 dry summons
export const PITY_EPIC_THRESHOLD     = 200  // guarantee Epic+ after 200 dry summons
export const PITY_LEGENDARY_THRESHOLD= 500  // guarantee Legendary+ after 500 dry summons
export const PITY_MYTHIC_THRESHOLD   = 2000 // guarantee Mythic after 2000 dry summons

// Legacy single-value pity (used by discovery upgrades level 2 and 13)
export const PITY_SUMMON_THRESHOLD = 20

// --- Merge ---
export const MERGE_COUNT_REQUIRED = 3
export const ESSENCE_PER_MERGE = 1
export const ESSENCE_PER_MAX_LEVEL = 5
export const ESSENCE_MAX_RARITY_MERGE = 10
export const SHARDS_MAX_RARITY_MERGE = 3

// --- Breed ---
export const BREED_COOLDOWN_MS = 45_000
export const BREED_FAIL_COOLDOWN_MS = 15_000
// Special slime IDs — updated to match new roster (specials start at 900)
export const MUDSLIME_ID = '900'
export const LUCKY_SLIME_ID = '903'
export const LUCKY_SLIME_CHANCE = 0.001

// --- Zone unlock costs ---
export const ZONE_COSTS: Record<number, number> = {
  1: 0,
  2: 1000,
  3: 15000,
  4: 200000,
  5: 5000000,
  6: 150000000,
}

export const ZONE_NAMES: Record<number, string> = {
  1: 'Gooey Meadow',
  2: 'Crystal Caves',
  3: 'Ember Wastes',
  4: 'Frostmere',
  5: 'Verdant Deep',
  6: 'Starfall Isle',
}

export const ZONE_THEMES: Record<number, { bg: string; accent: string; emoji: string }> = {
  1: { bg: '#1a2e1a', accent: '#4ade80', emoji: '🌿' },
  2: { bg: '#1a1a2e', accent: '#818cf8', emoji: '💎' },
  3: { bg: '#2e1a1a', accent: '#f97316', emoji: '🔥' },
  4: { bg: '#1a2a2e', accent: '#67e8f9', emoji: '❄️' },
  5: { bg: '#1a2e1a', accent: '#a3e635', emoji: '🌿' },
  6: { bg: '#0f0f1e', accent: '#e879f9', emoji: '✨' },
}

// --- Offline cap ---
export const OFFLINE_CAP_HOURS = 8

// --- Upgrade track costs ---
// Tap Power: cost(level) = 25 * 3^(level-1), effect: 2^level goo/tap
export const TAP_UPGRADE_BASE_COST = 25
export const TAP_UPGRADE_COST_MULT = 3
export const TAP_UPGRADE_MAX_LEVEL = 15

// Slime Output: cost(level) = 50 * 2.8^(level-1), effect: cumulative multiplier
export const OUTPUT_UPGRADE_BASE_COST = 50
export const OUTPUT_UPGRADE_COST_MULT = 2.8
export const OUTPUT_UPGRADE_MAX_LEVEL = 20

// Discovery: costs in Essence
export const DISCOVERY_UPGRADE_COSTS = [0, 5, 12, 25, 50, 80, 120, 175, 200, 300, 400, 500, 600, 750, 900, 1200]
export const DISCOVERY_UPGRADE_MAX_LEVEL = 15

// Output multipliers per level (from upgrade-trees.md)
export const OUTPUT_MULTIPLIERS = [
  1, 1.25, 1.5625, 1.953125, 2.44140625, 3.0517578125,
  3.814697265625, 4.76837158203125, 5.960464477539063, 7.450580596923828,
  9.313225746154785, 11.641532182693481, 14.551915228366852, 18.18989403545856,
  22.737367544323203, 28.421709430404004, 35.52713678800501, 44.40892098500626,
  55.51115123125782, 69.38893903907228, 86.73617379884035,
]

// Rarity colors
export const RARITY_COLORS: Record<string, string> = {
  Common: '#9ca3af',
  Uncommon: '#4ade80',
  Rare: '#60a5fa',
  Epic: '#c084fc',
  Legendary: '#fbbf24',
  Mythic: 'url(#mythic-gradient)',
}

export const RARITY_GLOW: Record<string, string> = {
  Common: 'none',
  Uncommon: '0 0 8px #4ade8066',
  Rare: '0 0 12px #60a5fa88',
  Epic: '0 0 16px #c084fc99',
  Legendary: '0 0 20px #fbbf24aa',
  Mythic: '0 0 24px #e879f9, 0 0 48px #818cf8',
}

export const RARITY_ORDER: Record<string, number> = {
  Mythic: 0,
  Legendary: 1,
  Epic: 2,
  Rare: 3,
  Uncommon: 4,
  Common: 5,
}

// Tap Power upgrade names
export const TAP_UPGRADE_NAMES = [
  '', // level 0
  'Sticky Fingers', 'Goo Grip', 'Slime Punch', 'Power Squish', 'Turbo Tap',
  'Geyser Tap', 'Pressure Burst', 'Volcanic Touch', 'Graviton Tap', 'Cosmic Smash',
  'Stellar Strike', 'Nebula Palm', 'Event Horizon Tap', 'Singularity Smash', 'Big Bang Tap',
]

// Output upgrade names
export const OUTPUT_UPGRADE_NAMES = [
  '', // level 0
  'Goo Enrichment', 'Slick Skin', 'Luminous Ooze', 'Goo Surge', 'Ooze Overflow',
  'Slime Frenzy', 'Bio-Resonance', 'Goo Cascade', 'Ooze Amplifier', 'Slime Hive Mind',
  'Goo Synchrony', 'Essence Infusion', 'Tidal Ooze', 'Goo Nova', 'Slime Ascendancy',
  'Primordial Ooze', 'Goo Singularity', 'World Goo', 'Infinite Drip', 'The Great Flow',
]

// Discovery upgrade names and effects
export const DISCOVERY_UPGRADES = [
  { level: 1, name: 'Keen Eye', effect: 'Slimepedia shows silhouettes for undiscovered same-zone slimes' },
  { level: 2, name: 'Slime Sense', effect: 'Pity counter reduced from 10 to 7 summons' },
  { level: 3, name: 'Quick Hands', effect: 'Breed cooldown reduced by 20% (45s → 36s)' },
  { level: 4, name: 'Second Lab', effect: 'Breed slot 2 unlocked' },
  { level: 5, name: 'Flavor Intuition', effect: 'Favorite food bonus increases to 40% cost reduction' },
  { level: 6, name: 'Goo Scholar', effect: 'Slimepedia hints available — Tier 1 hint costs 3 💎' },
  { level: 7, name: 'Swift Breeder', effect: 'Breed cooldown reduced by additional 20% (36s → 29s)' },
  { level: 8, name: 'Zone Tracker', effect: 'Zone secret triggers show a progress indicator' },
  { level: 9, name: 'Essence Saver', effect: 'Breed slot 3 unlocked' },
  { level: 10, name: 'Cross-Zone Intuition', effect: 'Slimepedia hints — Tier 2 hint costs 8 💎' },
  { level: 11, name: 'Deep Instinct', effect: 'Breed cooldown reduced by additional 15% (29s → 25s)' },
  { level: 12, name: 'Slime Whisperer', effect: 'Mimic Slime reveals its disguise via tooltip' },
  { level: 13, name: 'Pity Master', effect: 'Pity counter reduced to 5 summons' },
  { level: 14, name: 'Grand Breeder', effect: 'Slimepedia hints — Tier 3 hint costs 15 💎' },
  { level: 15, name: 'The Final Lab', effect: 'Breed slot 4 unlocked — costs 50 💎 to activate' },
]
