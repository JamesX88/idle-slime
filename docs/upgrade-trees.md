# Idle Slime — Upgrade Trees
**GDD Supplement v0.1**

---

## Overview

Three upgrade tracks, each purchased with a specific currency. Upgrades are **permanent** — they persist across zones and never need to be re-purchased.

| Track | Currency | Focus |
|-------|----------|-------|
| Tap Power 👆 | Slime Goo 💧 | Click/tap efficiency |
| Slime Output 🌀 | Slime Goo 💧 | Passive production multipliers |
| Discovery 🔍 | Slime Essence ✨ | Breed, collection, and exploration |

All costs marked [PLACEHOLDER] — values require playtesting calibration.

---

## Track 1: Tap Power 👆

**Purpose**: Make active play feel increasingly powerful. Players who tap actively should see meaningful advantages over pure idle play.

**Cost formula**: `cost(level) = base_cost × (3 ^ (level - 1))`
**Effect formula**: `goo_per_tap = 1 × (2 ^ level)`

| Level | Name | Goo/Tap | Cost (💧) | Cumulative Cost |
|-------|------|---------|-----------|----------------|
| 1 | Sticky Fingers | 2 | 25 | 25 |
| 2 | Goo Grip | 4 | 75 | 100 |
| 3 | Slime Punch | 8 | 225 | 325 |
| 4 | Power Squish | 16 | 675 | 1,000 |
| 5 | Turbo Tap | 32 | 2,025 | 3,025 |
| 6 | Geyser Tap | 64 | 6,075 | 9,100 |
| 7 | Pressure Burst | 128 | 18,225 | 27,325 |
| 8 | Volcanic Touch | 256 | 54,675 | 82,000 |
| 9 | Graviton Tap | 512 | 164,025 | 246,025 |
| 10 | Cosmic Smash | 1,024 | 492,075 | 738,100 |
| 11 | Stellar Strike | 2,048 | 1,476,225 | 2,214,325 |
| 12 | Nebula Palm | 4,096 | 4,428,675 | 6,643,000 |
| 13 | Event Horizon Tap | 8,192 | 13,286,025 | 19,929,025 |
| 14 | Singularity Smash | 16,384 | 39,858,075 | 59,787,100 |
| 15 | Big Bang Tap | 32,768 | 119,574,225 | 179,361,325 |

> **Milestone at Level 5 (Turbo Tap)**: Unlock "Tap Burst" — holding the tap button for 3s releases a burst worth 10× normal tap. Cooldown: 30s. [PLACEHOLDER — may move to separate upgrade]

> **Milestone at Level 10 (Cosmic Smash)**: Tapping any slime in the collection also procs a small Essence drop (0.1 chance per tap). Incentivizes continued active play in late game.

---

## Track 2: Slime Output 🌀

**Purpose**: Reward collection depth. Each upgrade multiplies the Goo/sec of ALL slimes globally.

**Cost formula**: `cost(level) = base_cost × (2.8 ^ (level - 1))`
**Effect**: Global multiplier — stacks multiplicatively with previous levels

| Level | Name | Multiplier | Cost (💧) | Cumulative Cost |
|-------|------|-----------|-----------|----------------|
| 1 | Goo Enrichment | ×1.25 | 50 | 50 |
| 2 | Slick Skin | ×1.56 | 140 | 190 |
| 3 | Luminous Ooze | ×1.95 | 392 | 582 |
| 4 | Goo Surge | ×2.44 | 1,098 | 1,680 |
| 5 | Ooze Overflow | ×3.05 | 3,074 | 4,754 |
| 6 | Slime Frenzy | ×3.81 | 8,607 | 13,361 |
| 7 | Bio-Resonance | ×4.77 | 24,100 | 37,461 |
| 8 | Goo Cascade | ×5.96 | 67,480 | 104,941 |
| 9 | Ooze Amplifier | ×7.45 | 188,944 | 293,885 |
| 10 | Slime Hive Mind | ×9.31 | 529,043 | 822,928 |
| 11 | Goo Synchrony | ×11.64 | 1,481,320 | 2,304,248 |
| 12 | Essence Infusion | ×14.55 | 4,147,697 | 6,451,945 |
| 13 | Tidal Ooze | ×18.19 | 11,613,551 | 18,065,496 |
| 14 | Goo Nova | ×22.74 | 32,517,943 | 50,583,439 |
| 15 | Slime Ascendancy | ×28.42 | 91,050,240 | 141,633,679 |
| 16 | Primordial Ooze | ×35.53 | 254,940,672 | 396,574,351 |
| 17 | Goo Singularity | ×44.41 | 713,833,882 | 1,110,408,233 |
| 18 | World Goo | ×55.51 | 1,998,734,870 | ~3.1B |
| 19 | Infinite Drip | ×69.39 | 5,596,457,636 | ~8.7B |
| 20 | The Great Flow | ×86.74 | 15,670,081,381 | ~24.4B |

> **Milestone at Level 5 (Ooze Overflow)**: "Slime Synergy" passive — slimes of the same rarity tier boost each other's output by +2% per matching slime in collection (stacks up to 20 slimes). Rewards breadth of collection.

> **Milestone at Level 10 (Slime Hive Mind)**: "Zone Mastery" activates — each zone where you've discovered all native slimes gives +15% bonus to that zone's slimes. Rewards completion.

> **Milestone at Level 15 (Slime Ascendancy)**: Passive Goo also trickles in at 10% rate while app is in background (on top of offline calc). Rewards long-session players.

> **Milestone at Level 20 (The Great Flow)**: Mythic slimes gain a second production stat — they generate 1 Essence ✨ per 60 seconds passively. Mythic ownership now has ongoing economic impact.

---

## Track 3: Discovery 🔍

**Purpose**: Accelerate and deepen the collection and breed experience. Paid in Essence — forces engagement with the merge/level systems before unlock.

| Level | Name | Effect | Cost (✨) | Cumulative Cost |
|-------|------|--------|-----------|----------------|
| 1 | Keen Eye | Slimepedia shows "same zone" hint for all undiscovered zone slimes (silhouette visible) | 5 | 5 |
| 2 | Slime Sense | Pity counter reduced from 10 to 7 summons | 12 | 17 |
| 3 | Quick Hands | Breed cooldown reduced by 20% (45s → 36s) | 25 | 42 |
| 4 | Second Lab | Breed slot 2 unlocked | 50 | 92 |
| 5 | Flavor Intuition | Favorite food bonus increases from 25% to 40% cost reduction | 80 | 172 |
| 6 | Goo Scholar | Slimepedia hints available — Tier 1 hint (element tag) costs 3 💎 | 120 | 292 |
| 7 | Swift Breeder | Breed cooldown reduced by additional 20% (36s → 29s) | 175 | 467 |
| 8 | Zone Tracker | Zone secret triggers show a progress indicator (e.g., "??/30 taps") | 200 | 667 |
| 9 | Essence Saver | Breed slot 3 unlocked | 300 | 967 |
| 10 | Cross-Zone Intuition | Slimepedia hints available — Tier 2 hint (one parent revealed) costs 8 💎 | 400 | 1,367 |
| 11 | Deep Instinct | Breed cooldown reduced by additional 15% (29s → 25s) | 500 | 1,867 |
| 12 | Slime Whisperer | Mimic Slime (Zone 5) now reveals what it's disguised as via tooltip | 600 | 2,467 |
| 13 | Pity Master | Pity counter reduced to 5 summons | 750 | 3,217 |
| 14 | Grand Breeder | Slimepedia hints — Tier 3 hint (both parents revealed) costs 15 💎 | 900 | 4,117 |
| 15 | The Final Lab | Breed slot 4 unlocked — costs 50 💎 to activate (Prism Shards) | 1,200 | 5,317 |

### Discovery Milestone Bonuses
- **Level 4 (Second Lab)**: Parallel breeds dramatically accelerate the mid-game — this is the most impactful single upgrade. Should feel like a significant unlock moment.
- **Level 9 (Essence Saver)**: Third breed slot makes chain breeding substantially faster — players who've invested in the breed system now get a major payoff.
- **Level 15 (The Final Lab)**: Fourth slot costs Prism Shards deliberately — Shards are earned from discoveries, so this requires meaningful collection progress to unlock.

---

## Upgrade UI Layout

```
┌─────────────────────────────────────────────┐
│  UPGRADES                              [✕]  │
├─────────────┬──────────────┬────────────────┤
│ 👆 TAP      │  🌀 OUTPUT   │  🔍 DISCOVERY  │
│  POWER      │              │                │
├─────────────┴──────────────┴────────────────┤
│                                             │
│  [UPGRADE CARD]                             │
│  ┌─────────────────────────────────────┐   │
│  │ Level 3 → 4                         │   │
│  │ Slime Punch → Power Squish          │   │
│  │                                     │   │
│  │ Effect: 8 → 16 Goo per tap          │   │
│  │ Cost: 675 💧                        │   │
│  │                                     │   │
│  │         [UPGRADE — 675 💧]          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Progress: ████████░░░░░░ 3/15             │
│                                             │
│  NEXT MILESTONE (Level 5):                  │
│  Unlock Tap Burst ability                   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Upgrade Unlock Conditions

Not all upgrades are immediately visible. Upgrades unlock (become visible in UI) when:

| Track | Condition to Show |
|-------|-----------------|
| Tap Power | Always visible from game start |
| Slime Output | Visible after first slime is in collection |
| Discovery | Visible after first merge is completed |

---

## Upgrade Design Rationale

**Why three tracks?**
- Tap Power rewards active players — casual clickers and dedicated tappers
- Slime Output rewards breadth — the more slimes you have, the more impactful each level is
- Discovery rewards depth — feeds back into itself (more breeds → more Essence → better breed tools)

**Why different currencies per track?**
- Tap Power and Slime Output both cost Goo, creating meaningful tension: upgrade tap or upgrade output?
- Discovery costs Essence, ensuring players who want better breed tools must engage with the merge/level system first — not just tap

**Why no prestige reset?**
- Per design decision, upgrades are permanent. The curve is designed to feel meaningful across the full game without requiring reset.

---

## Open Questions — Upgrades

| # | Question | Recommendation |
|---|----------|---------------|
| 1 | Should there be a 4th track (e.g., "Zone" or "Collection")? | Defer to v0.2 — 3 tracks is sufficient for v1 |
| 2 | Should upgrade levels be visible before affordable? | Yes — show locked but visible. Creates goals. |
| 3 | Should milestones be separate unlockables or auto-apply? | Auto-apply at milestone level — less friction |
| 4 | Cap on Track 1/2 levels, or infinite? | Cap at 15 (Tap) and 20 (Output) for v1 — add more in updates |
