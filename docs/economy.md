# Idle Slime — Economy & Pacing Design
**GDD Supplement v0.1**

---

## Core Economy Philosophy

> The player should always feel one decision away from a breakthrough. Numbers grow fast early, then settle into satisfying exponential curves. Resources are never "wasted" — every Goo spent moves the player toward something.

---

## Currencies — Detailed Spec

### Slime Goo 💧
- **Primary currency** — earned by tapping and passive slime production
- **Spent on**: summoning slimes, feeding slimes, zone unlocks, tap/output upgrades
- Transitions to scientific notation at **1,000,000 (1M)** Goo
- Soft-cap mechanic: offline production caps at **8 real-world hours** of equivalent passive income

### Slime Essence ✨
- **Secondary currency** — earned by merging slimes and leveling slimes to max
- **Spent on**: breed cooldown reductions, Discovery upgrades, Slimepedia hints
- Never earned by tapping — forces engagement with slime systems
- Rate: 1 Essence per merge, 5 Essence per max-level slime

### Prism Shards 💎
- **Tertiary currency** — earned by first-time species discovery only
- **Spent on**: Slimepedia hints, cosmetic slime skins, breed slot 4
- Deliberately scarce — hints the collection = status
- Never purchasable (no pay-to-discover) — earned through gameplay only

---

## Slime Summoning Mechanic

When the player is in a zone, they can **Summon** a slime from that zone's pool by spending Goo. The result is a random slime from the zone, weighted by rarity. First-time discoveries trigger full fanfare.

### Summon Cost by Rarity
| Rarity | Base Summon Cost | Notes |
|--------|-----------------|-------|
| Common | 25 💧 | [PLACEHOLDER] |
| Uncommon | 100 💧 | [PLACEHOLDER] |
| Rare | 500 💧 | [PLACEHOLDER] |

Summon costs **do not scale** with zone level — zone unlock costs are the gate, not per-summon costs. This lets players freely explore once they've unlocked a zone.

**Pity system**: Every 10 summons in a zone without a new discovery guarantees a species the player doesn't yet have from that zone (weighted toward lower rarities first).

---

## Zone Unlock Costs

These costs are the **primary pacing lever** of the game. Designed around target session lengths for each unlock.

| Zone | Biome | Unlock Cost | Target First Unlock Time | Notes |
|------|-------|-------------|--------------------------|-------|
| 1 | Gooey Meadow | Free | Immediately | Tutorial zone |
| 2 | Crystal Caves | 1,000 💧 | 15–25 min | First real gate |
| 3 | Ember Wastes | 15,000 💧 | 45–75 min cumulative | |
| 4 | Frostmere | 200,000 💧 | 2.5–4 hr cumulative | Significant milestone |
| 5 | Verdant Deep | 5,000,000 💧 | 8–14 hr cumulative | Scientific notation begins |
| 6 | Starfall Isle | 150,000,000 💧 | 30–50 hr cumulative | Endgame entry |

> **Multiplier per zone**: ~10–15× — matches the compound production growth from accumulating slimes.

### Additional Zone Mechanics
- **Zones remain unlocked permanently** — no reset
- **Passive production contributes to active zone** only (player selects active zone)
- **Switching zones** is free and instant — no penalty for exploring lower zones
- **Zone completion bonus**: Discovering all zone-native slimes gives permanent +10% Goo/sec from that biome's slimes

---

## Slime Production Stats

### Base Production (Level 1)
| Rarity | Goo/sec | Notes |
|--------|---------|-------|
| Common | 0.5 | [PLACEHOLDER] |
| Uncommon | 2.0 | [PLACEHOLDER] |
| Rare | 10.0 | [PLACEHOLDER] |
| Epic | 50.0 | [PLACEHOLDER] |
| Legendary | 250.0 | [PLACEHOLDER] |
| Mythic | 2,000.0 | [PLACEHOLDER] |

### Production Per Level
Each level increases a slime's Goo/sec output by **+50%** (multiplicative).

Formula: `output = base_goo_per_sec × (1.5 ^ (level - 1))`

| Level | Common Output | Uncommon Output | Rare Output |
|-------|--------------|----------------|-------------|
| 1 | 0.5/s | 2.0/s | 10.0/s |
| 2 | 0.75/s | 3.0/s | 15.0/s |
| 3 | 1.13/s | 4.5/s | 22.5/s |
| 5 | 2.53/s | 10.1/s | 50.6/s |
| 10 | 28.7/s | 115/s | 576/s |

> [PLACEHOLDER] — These numbers need feel-testing. The key ratio: a single Rare at level 5 should outproduce ~20 Common slimes at level 1.

---

## Feed Costs (Level Up)

Formula: `cost(level) = base_cost × (2.5 ^ (level - 1))`

Base cost by rarity:

| Rarity | Base Feed Cost (1→2) | Max Level |
|--------|---------------------|-----------|
| Common | 50 💧 | 10 |
| Uncommon | 150 💧 | 10 |
| Rare | 500 💧 | 10 |
| Epic | 2,000 💧 | 10 |
| Legendary | 10,000 💧 | 10 |
| Mythic | 50,000 💧 | 10 |

**Favorite Food Bonus**: Feeding a slime its tagged "favorite food category" costs 25% less Goo. Food categories are cosmetic groupings (Gooberries, Sparklefloss, Embernuts, etc.) that correspond to slime themes. No functional difference beyond the cost reduction — pure flavor hook.

### Full Level Cost — Common Slime
| Level | Cost This Level | Cumulative Cost |
|-------|----------------|----------------|
| 1→2 | 50 | 50 |
| 2→3 | 125 | 175 |
| 3→4 | 313 | 488 |
| 4→5 | 781 | 1,269 |
| 5→6 | 1,953 | 3,222 |
| 6→7 | 4,883 | 8,105 |
| 7→8 | 12,207 | 20,312 |
| 8→9 | 30,518 | 50,830 |
| 9→10 | 76,294 | 127,124 |

> Maxing one Common slime costs ~127K Goo. This is an intentional late Zone 2 / early Zone 3 investment.

---

## Merge Costs

Merging consumes **3 identical slimes of the same species AND level** to produce 1 slime of the next rarity tier (or same species at level 1 if at max rarity within its species).

- **Merge is free** — no Goo cost, but requires holding 3 copies
- **Output**: Always 1 slime of the next rarity tier
- **Essence reward**: Merging grants 1 Slime Essence ✨ (5 ✨ if producing a Mythic)
- **Max rarity merge**: Returns 3 Prism Shards + 10 Essence instead of a new slime

---

## Breed Costs & Cooldowns

| Parameter | Value | Notes |
|-----------|-------|-------|
| Base breed cooldown | 45s | [PLACEHOLDER] |
| Failed breed cooldown | 15s | Incompatible pairs still lock the slot briefly |
| Breed slot unlock | Discovery upgrade (see upgrade-trees.md) | |
| Max breed slots | 4 | Final slot costs 50 Prism Shards |
| Breed cost | None (slimes are consumed) | Parents removed from collection |

> **Design note**: Parents are consumed on breed. Players with only 1 copy of a slime are warned before the breed button becomes active. This creates tension and investment.

---

## Offline Production

| Time Away | Goo Earned |
|-----------|-----------|
| < 1 hour | 100% passive rate |
| 1–8 hours | 100% passive rate |
| > 8 hours | Capped at 8 hours of production |

**Offline notification** (mobile): "Your slimes have been busy! Collect X Goo."

**Rationale**: Uncapped offline in idle games can trivialize the economy. 8 hours encourages at least one daily check-in without feeling punishing for weekend absences.

---

## Pacing Targets (All [PLACEHOLDER] — requires playtesting)

| Milestone | Target Time | Key Systems Active |
|-----------|------------|-------------------|
| First tap → first production | 0:00–0:30 | Tap, passives |
| First feed (level up) | 0:30–1:30 | Feed system |
| First merge | 3–5 min | Merge system |
| First zone 2 unlock | 15–25 min | Zone system |
| First breed | 20–30 min | Breed system |
| First Rare slime | 30–50 min | Rare discovery |
| First Epic slime | 1.5–3 hr | Same-biome breed apex |
| Zone 3 unlock | 45–75 min | Economy scaling |
| Zone 4 unlock | 2.5–4 hr | Economy scaling |
| First Legendary slime | 6–12 hr | Cross-biome apex |
| Zone 5 unlock | 8–14 hr | Late game entry |
| Zone 6 unlock | 30–50 hr | Endgame |
| First Mythic slime | 50–80 hr | Deep chain |
| Slimepedia 50% | 40–70 hr | Long-term |
| True ending (100%) | 200+ hr | Mastery |

---

## Economy Health Checks

Before build integration, verify:
- [ ] Common slimes can't be farmed to trivialize zone 6 unlock (check production cap)
- [ ] Breed slot upgrades feel meaningfully impactful on progression speed
- [ ] First 5 minutes never require waiting more than 15s without something to do
- [ ] Zone 5 doesn't feel "grindy" — player should have meaningful decisions, not just waiting
- [ ] Mythic chain breeds require genuine dedication, not accidental discovery

---

## Economy Variables — Quick Reference

All tunable constants (expose these in a config file):

```
GOO_PER_TAP_BASE          = 1
PASSIVE_GOO_BASE_COMMON   = 0.5
PASSIVE_GOO_BASE_UNCOMMON = 2.0
PASSIVE_GOO_BASE_RARE     = 10.0
PASSIVE_GOO_BASE_EPIC     = 50.0
PASSIVE_GOO_BASE_LEGENDARY= 250.0
PASSIVE_GOO_BASE_MYTHIC   = 2000.0
LEVEL_UP_MULTIPLIER       = 1.5   (production per level)
FEED_COST_MULTIPLIER      = 2.5   (cost per level)
FEED_BASE_COMMON          = 50
FEED_BASE_UNCOMMON        = 150
FEED_BASE_RARE            = 500
FEED_BASE_EPIC            = 2000
FEED_BASE_LEGENDARY       = 10000
FEED_BASE_MYTHIC          = 50000
SUMMON_COST_COMMON        = 25
SUMMON_COST_UNCOMMON      = 100
SUMMON_COST_RARE          = 500
MAX_LEVEL                 = 10
MERGE_COUNT_REQUIRED      = 3
BREED_COOLDOWN_SECONDS    = 45
BREED_FAIL_COOLDOWN       = 15
OFFLINE_CAP_HOURS         = 8
ZONE_COST_2               = 1000
ZONE_COST_3               = 15000
ZONE_COST_4               = 200000
ZONE_COST_5               = 5000000
ZONE_COST_6               = 150000000
PITY_SUMMON_THRESHOLD     = 10
ESSENCE_PER_MERGE         = 1
ESSENCE_PER_MAX_LEVEL     = 5
```
