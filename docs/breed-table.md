# Idle Slime — Breed Table & Slime Roster
**GDD Supplement v0.1**
**Status**: Working Draft — all numerical values [PLACEHOLDER]

> **Data file**: `slime-roster.csv` contains the complete machine-readable roster of all 527 slimes with parent recipes. This document covers system rules, category breakdowns, and design rationale.

---

## Overview

**Total Slimes**: 527
**Zone-Discoverable**: 150 (IDs 001–150)
**Breeding Exclusives**: 362 (IDs 151–512)
**Special/Secret**: 15 (IDs 513–527)

---

## Rarity Distribution

| Rarity | Color | Count | Primary Discovery |
|--------|-------|-------|-------------------|
| Common | ⬜ Gray | ~85 | Zone exploration, simple same-biome breeds |
| Uncommon | 🟩 Green | ~130 | Zone exploration, same-biome breeds |
| Rare | 🟦 Blue | ~160 | Zone secrets, cross-biome breeds |
| Epic | 🟪 Purple | ~80 | Zone apex breeds, cross-biome tier 1–2 |
| Legendary | 🟨 Gold | ~57 | Cross-biome apex, deep chain breeds |
| Mythic | 🌈 Rainbow | ~15 | Multi-generational chains, pinnacle breeds |

---

## Biome Roster Summary

| Zone | Biome | Theme | Slimes | IDs |
|------|-------|-------|--------|-----|
| 1 | Gooey Meadow | Earth / Wind / Water / Nature | 25 | 001–025 |
| 2 | Crystal Caves | Mineral / Light / Sound | 25 | 026–050 |
| 3 | Ember Wastes | Fire / Volcanic / Heat | 25 | 051–075 |
| 4 | Frostmere | Ice / Cold / Wind | 25 | 076–100 |
| 5 | Verdant Deep | Jungle / Toxin / Decay / Growth | 25 | 101–125 |
| 6 | Starfall Isle | Cosmic / Void / Gravity / Light | 25 | 126–150 |

Each biome has:
- **10 Common** slimes (zone entry discovery)
- **10 Uncommon** slimes (zone depth discovery)
- **4 Rare** slimes (zone exploration / passive unlock)
- **1 Rare secret** slime (hidden trigger — see GDD §5.5)

---

## Breeding Exclusive Categories

### Category 1: Same-Biome Breeds (IDs 151–222, 72 slimes)
**Rule**: Both parents must be from the same zone.
**Output rarity**: Typically one tier above the lower parent.
**Purpose**: Rewards investing deeply in a single biome before cross-biome play.

Each biome has 12 same-biome breed results:
| Biome | IDs | Zone Apex (Epic) |
|-------|-----|-----------------|
| Gooey Meadow | 151–162 | Meadow Crown Slime (162) |
| Crystal Caves | 163–174 | Sapphire Heart Slime (174) |
| Ember Wastes | 175–186 | Volcano Lord Slime (186) |
| Frostmere | 187–198 | Frostbite Sovereign Slime (198) |
| Verdant Deep | 199–210 | Overmind Slime (210) |
| Starfall Isle | 211–222 | Celestial Sovereign Slime (222) |

> **Design note**: Zone apex slimes (the Epic tier results) require both zone Rare parents. They are important milestones and gates for later cross-biome breeding chains.

---

### Category 2: Cross-Biome Tier 1 (IDs 223–392, 170 slimes)
**Rule**: Parents from two different zones (zone-discoverable slimes only, no breed results as parents).
**Output rarity**: Rare to Legendary depending on parent rarity.
**Purpose**: Rewards biome exploration and creates the "what happens if I combine these?" hook.

| Pairing | IDs | Apex Result |
|---------|-----|-------------|
| Meadow × Crystal | 223–242 | Void Gale Slime / Verdant Prismatic Slime |
| Meadow × Ember | 243–262 | Inferno Wisp Slime / Phoenix Petal Slime |
| Meadow × Frost | 263–272 | Aurora Wisp Slime |
| Meadow × Verdant | 273–282 | Predator Gale Slime |
| Meadow × Starfall | 283–292 | Void Meadow Slime / Galaxy Vine Slime |
| Crystal × Ember | 293–302 | Sapphire Inferno Slime / Phoenix Crystal Slime |
| Crystal × Frost | 303–312 | Ice Sovereign Crystal Slime / Polar Night Gem Slime |
| Crystal × Verdant | 313–322 | Ancient Crystal Slime |
| Crystal × Starfall | 323–332 | Dark Matter Crystal Slime / Event Horizon Crystal Slime |
| Ember × Frost | 333–342 | Ice Fire Slime / Fire Aurora Slime / **Frost Drake Slime** (Legendary) |
| Ember × Verdant | 343–352 | Wildfire Canopy / Phoenix Fern / **Volcanic Mycelium** (Legendary) |
| Ember × Starfall | 353–362 | Supernova Inferno / Dark Matter Ash / **Celestial Fire Drake** (Legendary) |
| Frost × Verdant | 363–372 | Polar Predator Slime / **Glacier Jungle Slime** (Legendary) |
| Frost × Starfall | 373–382 | Polar Void Slime / Absolute Void Slime / **Ice Sovereign Celestial** (Legendary) |
| Verdant × Starfall | 383–392 | Gravity Canopy / Dark Matter Mycelium / **Celestial Grove** (Legendary) |

> **Biome Apex Crosses**: Each cross-biome pairing has one **Legendary** result that requires breeding the Rare apex of each biome. These are the first Legendaries most players encounter.

---

### Category 3: Chain Breeds — Tier 2 (IDs 393–472, 80 slimes)
**Rule**: At least one parent is a breed result (not zone-discoverable).
**Output rarity**: Epic to Legendary.
**Purpose**: Multi-generational depth — rewards players who have invested in the breed system.

Sub-categories:
| Sub-category | IDs | Count |
|-------------|-----|-------|
| Zone slime + same-biome breed | 393–412 | 20 |
| Two same-biome breeds | 413–432 | 20 |
| Cross-biome tier 1 + zone slime | 433–452 | 20 |
| Two cross-biome tier 1 breeds | 453–472 | 20 |

---

### Category 4: Deep Chain Breeds (IDs 473–512, 40 slimes)
**Rule**: Both parents are breed results; at least one parent is a Tier 2 or higher result.
**Output rarity**: Legendary to Mythic.
**Purpose**: End-game progression for dedicated collectors. These are the hardest slimes to discover through experimentation — the Slimepedia hint system should help here.

**Mythic Breeds** (IDs 498–512) — the 15 rarest slimes:
| ID | Name | Recipe | Chain Depth |
|----|------|--------|-------------|
| 498 | Prismatic Sovereign Slime | Celestial Sovereign + Prismatic | Gen 3 |
| 499 | Eternal Phoenix Slime | Cinder Phoenix + Celestial Fire Drake | Gen 4 |
| 500 | World Slime | Jungle Sovereign + Volcano Lord | Gen 3 — milestone ID |
| 501 | Void Eternal Slime | Cosmic Singularity + Hellfire | Gen 3 |
| 502 | Primordial Slime | Earthen Sage + Celestial Sovereign | Gen 3 |
| 503 | Chromatic Slime | Prismatic Sovereign + Aurora Prismatic | Gen 4 |
| 504 | Infinite Slime | World Slime + Void Eternal Slime | Gen 4 |
| 505 | Apex Slime | Hellfire Blizzard + Ice Fire Galaxy | Gen 5 |
| 506 | Cataclysm Slime | Solar Wildfire + Absolute Winter Blizzard | Gen 5 |
| 507 | Harmonic Slime | Resonance Slime + Constellation Dreamer | Gen 3 |
| 508 | Ouroboros Slime | Primordial + Eternal Phoenix | Gen 4 |
| 509 | Goo Titan Slime | Apex + Cataclysm | Gen 6 |
| 510 | Genesis Slime | Infinite + Primordial | Gen 5 |
| 511 | Rainbow Slime | Chromatic + Prismatic | Gen 5 |
| 512 | The Great Slime | Genesis + Goo Titan | Gen 7 — final breed |

> **The Great Slime (ID 512)** is the deepest breedable slime, requiring a 7-generation chain. It is NOT the same as ID 527 (True Form), which requires full Slimepedia completion.

---

### Category 5: Special / Secret Slimes (IDs 513–527, 15 slimes)

These are discovered through non-standard conditions — no parents required.

| ID | Name | Rarity | Trigger Condition |
|----|------|--------|-------------------|
| 513 | Mudslime | Common | Failed breed — incompatible parents |
| 514 | Mirror Slime | Rare | Breed a slime with the result of breeding that same slime |
| 515 | Glitch Slime | Epic | Tap blob exactly 999 times without spending Goo |
| 516 | Lucky Slime | Rare | 0.1% chance on any successful breed |
| 517 | Oversized Slime | Uncommon | 100+ slimes in collection simultaneously |
| 518 | Miniature Slime | Uncommon | First time any slime reaches max level |
| 519 | Elder Slime | Rare | A slime stays at max level for 24 real-world hours |
| 520 | Haunted Slime | Epic | Breed any two slimes after midnight (local time) |
| 521 | Curious Slime | Rare | Tap the same slime 50 consecutive times |
| 522 | Slime King | Epic | Unlock all 25 Zone 3 slimes |
| 523 | Slime Queen | Epic | Unlock all 25 Zone 4 slimes |
| 524 | Ancient Slime | Legendary | Complete 100 total breed operations |
| 525 | Cosmic Jester Slime | Rare | Breed any slime with a Mudslime |
| 526 | Primordial Goo | Mythic | Collect all 6 zone apex Epics (one per biome) |
| 527 | The Great Slime (True Form) | Mythic | Complete Slimepedia — all 526 other slimes collected |

> **The Great Slime (True Form, ID 527)** is the game's true ending. Seeing it unlocked in someone's Slimepedia should feel like the equivalent of a Pokédex completion. Consider a special celebration screen.

---

## Breeding Rules Reference

### Core Rules
1. **Order doesn't matter** — Parent A + Parent B = Parent B + Parent A (always same result)
2. **Same species cannot breed** — use Merge instead
3. **Incompatible pairs** produce a **Mudslime** (ID 513) — there are no "empty" results
4. **First discovery** of any breed result triggers fanfare + Prism Shard reward
5. **Subsequent breeds** of known combinations produce the result instantly (no surprise animation)

### Breed Slots
- Start: 1 breed slot
- Upgrade track unlocks up to [PLACEHOLDER — 4] slots
- Each slot has independent cooldown: [PLACEHOLDER — 30s base]

### Slimepedia Hints
- Players can spend **Prism Shards** to reveal partial hints for undiscovered slimes
- Hint tiers: "needs two parents from the same zone" → "one parent is fire-type" → "exact parents revealed"
- Hint costs scale with rarity [PLACEHOLDER]

---

## Element Tags (For Hint System & Breed Logic)

Each slime is tagged with 1–2 elements. The hint system uses these tags.

| Element | Biome(s) | Example Slimes |
|---------|---------|---------------|
| Earth | Meadow | Pebble, Sandy, Granite |
| Water | Meadow | Brook, Dewdrop, Puddle |
| Wind | Meadow | Breeze, Gale, Dustdevil |
| Nature | Meadow / Verdant | Vine, Bloom, Jungle Heart |
| Mineral | Crystal | Quartz, Geode, Diamond |
| Light | Crystal / Starfall | Glowstone, Photon, Prismatic |
| Sound | Crystal | Echo, Resonance |
| Fire | Ember | Ember, Blaze, Phoenix |
| Volcanic | Ember | Magma, Lava, Volcanic |
| Ice | Frost | Frost, Glacier, Ice Sovereign |
| Cold | Frost | Chill, Permafrost, Absolute Zero |
| Toxin | Verdant | Toxin, Pitcher, Leech |
| Fungal | Verdant | Spore, Fungus, Mycelium |
| Cosmic | Starfall | Star, Nebula, Celestial |
| Void | Starfall | Void, Dark Matter, Black Hole |
| Gravity | Starfall | Gravity, Orbit, Event Horizon |
| Steam | Cross (Fire+Ice) | Steam, Meltwater |
| Chaos | Cross (Fire+Ice apex) | Ice Fire, Frost Drake |

---

## Slimepedia Completion Milestones

| Threshold | Reward |
|-----------|--------|
| 10% (53 slimes) | Breed slot 2 unlocked |
| 25% (132 slimes) | Passive Goo multiplier +25% |
| 50% (264 slimes) | Breed slot 3 unlocked |
| 75% (396 slimes) | Passive Goo multiplier +100% |
| 90% (475 slimes) | Breed slot 4 unlocked |
| 100% (527 slimes) | True Form discovery + permanent +500% Goo — [PLACEHOLDER: balance this] |

---

## Resolved Questions — Breed Table

| # | Question | Decision |
|---|----------|----------|
| 1 | Should breed order matter? | **No** — order-agnostic. Reserve 1–2 secret Easter egg combos for v0.3. |
| 2 | Can you intentionally breed for Mudslime? | **Yes** — Mudslime (513) is obtainable intentionally. Required to discover Cosmic Jester (525). |
| 3 | Cooldown penalty for failed breeds? | **Yes — reduced: 15s** (vs 45s base). Penalizes careless experimentation but doesn't punish curiosity. |
| 4 | Breed results direct to collection or confirmation? | **Direct to collection** — instant, no confirmation. Notification banner appears. Only pre-breed warns (consuming last copy). |
| 5 | Slimepedia visibility for undiscovered? | **Silhouettes** for same-zone slimes; **fully hidden** for cross-biome/breeds until first breed completed. |
| 6 | Max collection size? | **Unlimited** — no cap. UI uses virtual scrolling. |
| 7 | Do special slimes count toward completion %? | **Yes** — all 527 count. Special slimes (513–527) are part of the Slimepedia and required for True Form (527). |

---

*Document version: 0.1 — Next revision: assign element tags to all 527 slimes, define hint tier costs*
