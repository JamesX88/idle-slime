# Game Design Document: Idle Slime
**Version**: 0.2 — Full Design Pass
**Date**: 2026-03-16
**Status**: Active Development

---

## Changelog
| Version | Date | Summary |
|---------|------|---------|
| 0.1 | 2026-03-16 | Initial GDD draft |
| 0.2 | 2026-03-16 | Added economy doc, upgrade trees, UI spec, tech spec. Resolved all open questions. |

---

## 1. Overview

**Title**: Idle Slime
**Genre**: Incremental / Idle Clicker with Collection & Exploration
**Platform**: Web Browser (mobile-first responsive)
**Session Length**: 2–10 min active; meaningful idle progress between sessions
**Monetization**: TBD (scope for future GDD revision)

### Elevator Pitch
*Idle Slime* is an incremental clicker where players discover, collect, merge, breed, and evolve a vast roster of unique slimes across an ever-expanding world. Every tap generates resources; every resource fuels discovery; every discovery reveals a new slime species with its own identity. The world grows endlessly — there is no reset, only deeper layers to uncover.

---

## 2. Design Pillars

These are the non-negotiable player experiences. Every design decision is measured against them.

| # | Pillar | Player Experience Goal |
|---|--------|----------------------|
| 1 | **Discovery Delight** | Discovering a new slime species feels like a genuine surprise and reward |
| 2 | **Living Collection** | The player's slime roster feels alive, personal, and worth caring about |
| 3 | **Endless Depth** | There is always something new just beyond reach — the horizon never closes |
| 4 | **Satisfying Scale** | Numbers growing feels good; exponential jumps feel earned and thrilling |

---

## 3. Core Gameplay Loop

### Moment-to-Moment (0–30 seconds)
- **Action**: Player taps/clicks to generate Slime Goo
- **Feedback**: Slime blob visual jiggles; goo counter ticks up; satisfying squelch SFX
- **Reward**: Goo accumulates; slimes in the active zone passively drip goo between taps

### Session Loop (5–20 minutes)
- **Goal**: Accumulate enough Goo/Essence to unlock a new zone, trigger a merge, or complete a breed
- **Tension**: Resource gates require meaningful wait or active clicking to overcome
- **Resolution**: New slime discovered, evolution triggered, or zone unlocked — always ends on a hook

### Long-Term Loop (hours–weeks)
- **Progression**: Discover all slimes in each biome, unlock new biomes, breed rarer mutations
- **Retention Hook**: "Slimepedia" completion (collection tracker), daily discovery streaks, zone secrets
- **Scale**: Resources scale into scientific notation; late-game slimes produce millions of Goo/sec

---

## 4. Economy

### Currencies

| Currency | Symbol | How Earned | How Spent |
|----------|--------|-----------|-----------|
| **Slime Goo** | 💧 | Tapping, slime passive production | Feeding slimes, buying upgrades, unlocking zones |
| **Slime Essence** | ✨ | Merging slimes, leveling up slimes | Breeding, rare upgrades, biome unlocks |
| **Prism Shards** | 💎 | Discovering new species (first-time bonus), zone secrets | Cosmetics, accelerators — never required for progression |

### Economy Flow Diagram
```
[Tap / Passive Production]
        ↓
   [Slime Goo 💧]
   ↙           ↘
[Feed Slimes] [Unlock Zones]
      ↓               ↓
[Level Up]    [New Slimes Available]
      ↓               ↓
[Slime Essence ✨] ←←←←←←←←←
        ↓
   [Breed Slimes]
        ↓
  [New Mutations]
        ↓
 [Prism Shards 💎] (first discovery)
```

### Economy Balance Variables
| Variable | Base Value | Min | Max | Tuning Notes |
|----------|-----------|-----|-----|--------------|
| Goo per tap | 1 | 1 | ∞ | Scales with upgrades |
| Passive Goo/sec per slime | 0.5 | 0.1 | ∞ | [PLACEHOLDER] — feel test |
| Feed cost (level 1→2) | 50 💧 | — | — | [PLACEHOLDER] |
| Feed cost multiplier per level | ×2.5 | ×1.5 | ×4 | [PLACEHOLDER] — test curve |
| Merge trigger | 3 identical slimes | 2 | 5 | [PLACEHOLDER] — test 2 vs 3 |
| Breed cooldown | 30s | 10s | 120s | [PLACEHOLDER] — feel test |
| Zone unlock cost | 500 💧 (Zone 1) | — | — | Scales ×5 per zone [PLACEHOLDER] |

> **Rule**: All values marked `[PLACEHOLDER]` are design hypotheses. Do not hardcode — expose as tunable constants.

---

## 5. Slime Systems

### 5.1 Slime Species & Rarity

| Rarity | Color Code | Discovery Method | Approximate Count (v1) |
|--------|-----------|-----------------|----------------------|
| Common | Gray | Zone exploration, merging | 20 |
| Uncommon | Green | Feeding + leveling | 15 |
| Rare | Blue | Breeding combinations | 10 |
| Epic | Purple | Zone secrets / hidden triggers | 6 |
| Legendary | Gold | Cross-biome breeding chains | 3 |
| Mythic | Rainbow | [PLACEHOLDER] — late-game discovery arc | 1–2 |

Each slime has:
- **Name** + **Slimepedia entry** (short lore blurb)
- **Passive production stat** (Goo/sec)
- **Personality trait** (visual behavior: bouncy, lazy, erratic, etc.) — cosmetic only
- **Favorite food** (affects feed efficiency — minor mechanical hook, big flavor hook)

### 5.2 Merge System

**Purpose**: Convert resource surplus into rarity progression
**Player Fantasy**: Combining things to make something more powerful

**Mechanic Spec:**
- **Input**: 3 identical slimes of the same species and level
- **Output**: 1 slime of the next rarity tier (or evolved form if at max rarity)
- **Success Condition**: Merge animation plays; new slime drops into collection with fanfare
- **Failure State**: Cannot merge if < 3 identical slimes — UI shows progress (1/3, 2/3)
- **Edge Cases**:
  - What if the player has 6 identical slimes? Allow queuing 2 merges.
  - What if a slime is max rarity? Merge produces Slime Essence instead.
- **Tuning Levers**: Merge count required (default 3), output rarity jump, Essence fallback amount
- **Dependencies**: Collection system, rarity system, inventory UI

### 5.3 Feed & Level System

**Purpose**: Reward resource investment with production scaling
**Player Fantasy**: Nurturing something to grow stronger

**Mechanic Spec:**
- **Input**: Slime Goo (scaling cost per level)
- **Output**: +[PLACEHOLDER]% Goo/sec per level; visual size/glow increase
- **Level Cap**: [PLACEHOLDER] — 10 as starting hypothesis
- **Milestone Levels**: Every 5 levels unlocks a cosmetic transformation (bigger eyes, new color shimmer)
- **Favorite Food Bonus**: Feeding a slime its favorite food gives +25% efficiency [PLACEHOLDER]
- **Dependencies**: Currency system, slime stats, UI

### 5.4 Breed System

**Purpose**: Enable combinatorial discovery — reward experimentation
**Player Fantasy**: Scientific discovery; "what happens if I combine these?"

**Mechanic Spec:**
- **Input**: 2 slimes of different species (consumed from collection)
- **Output**: 1 new slime — either a known breed result or a first-time discovery
- **Discovery State**: First-time breed results trigger full discovery fanfare + Prism Shard reward
- **Breed Table**: Each species pair has a deterministic output (no RNG on known combinations)
- **Unknown Pairs**: Undiscovered combinations show "???" in Slimepedia until attempted
- **Failure State**: Some combinations are incompatible — produces a "Mudslime" (common, low value) with a humorous message
- **Cooldown**: [PLACEHOLDER] 30s per breed slot; upgrades can add breed slots
- **Edge Cases**:
  - Same species breeding: Not allowed (use Merge instead)
  - Breeding a slime you only have 1 of: Warn the player before consuming
- **Tuning Levers**: Cooldown duration, number of breed slots, breed table outputs
- **Dependencies**: Collection system, Slimepedia, currency system

### 5.5 Zone Exploration

**Purpose**: Provide the exploration hook; gate new species behind meaningful progress
**Player Fantasy**: "What's in the next zone?" — the horizon is always visible

**Mechanic Spec:**
- **Input**: Slime Goo cost to unlock a zone
- **Output**: New zone becomes active; new common slimes appear; zone secrets available
- **Zone Structure**: Each zone is a biome (examples below) with 4–6 native slime species
- **Secret Mechanic**: Each zone contains 1–2 hidden triggers (tap a specific object N times, reach a resource threshold) that reveal rare/epic slimes
- **Failure State**: Zone remains locked; UI shows cost and current progress
- **Discovery on Enter**: First entry into a zone always reveals 1 new common slime immediately (guaranteed hook)
- **Dependencies**: Currency system, slime spawning system, UI

---

## 6. World & Biomes

### Biome Roster (v1 Scope)

| # | Biome | Theme | Native Slimes (examples) | Unlock Cost |
|---|-------|-------|--------------------------|-------------|
| 1 | **The Gooey Meadow** | Tutorial zone, soft greens | Blob Slime, Puddle Slime, Sprout Slime | Free |
| 2 | **The Crystal Caves** | Glowing minerals, purples/blues | Crystal Slime, Echo Slime, Gem Slime | [PLACEHOLDER] |
| 3 | **The Ember Wastes** | Volcanic, reds/oranges | Ember Slime, Cinder Slime, Magma Slime | [PLACEHOLDER] |
| 4 | **The Frostmere** | Ice and snow, whites/teals | Frost Slime, Snowdrift Slime, Glacier Slime | [PLACEHOLDER] |
| 5 | **The Verdant Deep** | Dense jungle, toxic greens | Spore Slime, Vine Slime, Mimic Slime | [PLACEHOLDER] |
| 6 | **The Starfall Isle** | Cosmic, celestial | Star Slime, Void Slime, Prism Slime | [PLACEHOLDER] |

> Additional biomes can extend the game indefinitely. The biome unlock curve is the primary long-term pacing lever.

---

## 7. Progression Curve

### Resource Scaling Philosophy
- The game uses **soft exponential scaling**: costs grow faster than production early, then production catches up through slime accumulation and upgrades.
- Target: Player should feel "on the verge of a breakthrough" at all times.
- Numbers transition to scientific notation at [PLACEHOLDER — 1M Goo as hypothesis].

### Upgrade Trees
Three upgrade tracks (details TBD in v0.2):
1. **Tap Power** — increases Goo per tap
2. **Slime Output** — multiplies passive Goo/sec across all slimes
3. **Discovery** — reduces breed cooldowns, reveals Slimepedia hints, unlocks hidden zone triggers

### Pacing Targets (Hypotheses — All [PLACEHOLDER])
| Milestone | Target Time |
|-----------|-------------|
| First merge | 3–5 min |
| First breed | 10–15 min |
| First zone unlock | 15–25 min |
| First rare slime | 30–45 min |
| First epic slime | 2–4 hours |
| First legendary slime | 10–20 hours |
| Slimepedia 50% complete | 20–40 hours |

---

## 8. Player Onboarding

### Onboarding Checklist
- [ ] Core tap verb introduced within 10 seconds of first load
- [ ] First slime appears within 30 seconds — no failure possible in this window
- [ ] Merge tutorial triggered naturally when player accumulates 3 Blob Slimes (no skip needed)
- [ ] First zone unlock visible but gated — creates near-term goal within 2 minutes
- [ ] First session ends with at least 1 new species discovered and 1 goal in sight
- [ ] No tutorial text walls — mechanics taught through action and feedback

### First 5 Minutes Flow
```
[Load Game]
     ↓
[Gooey Meadow — 1 Blob Slime visible, tap prompt]
     ↓
[Tap 10× → Goo accumulates → "Feed" button glows]
     ↓
[Feed Blob Slime → Level 2 → production starts]
     ↓
[Passive goo ticks in → 2nd Blob Slime appears]
     ↓
[3rd Blob Slime → Merge prompt appears → merge]
     ↓
[Puddle Slime discovered! → Slimepedia entry pops → Prism Shard reward]
     ↓
[Zone 2 cost visible in UI — player has a goal]
```

---

## 9. UI/UX Guidelines

### Layout Principles (Mobile-First)
- **Primary viewport**: Slime collection zone (center) — always visible
- **Bottom bar**: Resources (Goo, Essence, Shards) + tap target
- **Top bar**: Zone name + Slimepedia progress tracker
- **Side drawer** (or tab): Upgrades, Breed lab, Slimepedia
- **No cluttered HUD** — max 3 persistent UI elements visible at once during active play

### Feedback Requirements
Every player action must have:
1. **Visual response** within 1 frame (tap ripple, slime jiggle)
2. **Numerical feedback** (floating +Goo numbers)
3. **Audio cue** (satisfying squelch/pop — never annoying on repeat)

### Accessibility Considerations
- Color-blind friendly rarity indicators (icon + color, not color alone)
- Tap targets minimum 44×44px
- Reduce motion option for slime animations
- High contrast mode for UI text

---

## 10. Audio Design Direction

*(See game-audio-engineer.md for full audio GDD — summary below)*

| Moment | Sound Design Goal |
|--------|------------------|
| Tap | Wet, satisfying squelch — rewarding on every tap, never grating at speed |
| New slime discovered | Cheerful ascending chime — distinct enough to feel special |
| Merge complete | Deep satisfying "thunk" + sparkle |
| Level up | Warm, short fanfare |
| Zone unlock | Ambient shift — new biome music fades in |
| Idle background | Gentle, loopable ambient per biome — calm, not distracting |

---

## 11. Out of Scope (v1)

The following are explicitly deferred to future versions:
- Multiplayer / social features
- Monetization / IAP system
- Account sync / cloud save
- Seasonal events
- Prestige / reset mechanics (design decision: endless scaling only)
- Narrative / story mode

---

## 12. Resolved Questions

All v0.1 open questions resolved in v0.2. See linked documents for full detail.

| # | Question | Decision | Reference |
|---|----------|----------|-----------|
| 1 | Breed table? | 527 slimes, full table in slime-roster.csv | breed-table.md |
| 2 | Zone 2–6 unlock costs? | 1K / 15K / 200K / 5M / 150M Goo | economy.md |
| 3 | Limited or unlimited inventory? | **Unlimited** — no inventory cap, slimes sorted by rarity | ui-spec.md |
| 4 | Engine/framework? | **Vanilla TypeScript + Vite** — DOM rendering, no game engine needed | tech-spec.md |
| 5 | Upgrades permanent or per-zone? | **Permanent** — all upgrades persist across all zones forever | upgrade-trees.md |
| 6 | Slimepedia UX? | Silhouettes for same-zone undiscovered; fully hidden for cross-biome; full entry on discovery | ui-spec.md |

---

## 13. Supplement Documents

| Document | Contents |
|----------|----------|
| `economy.md` | Zone costs, production stats, feed costs, pacing curves, all tunable constants |
| `upgrade-trees.md` | Full Tap Power, Slime Output, and Discovery upgrade tracks (all levels) |
| `breed-table.md` | Breed system rules, category breakdown, Mythic chain table |
| `slime-roster.csv` | All 527 slimes — name, rarity, discovery method, parent recipes |
| `ui-spec.md` | Screen-by-screen UI/UX spec with ASCII mockups, responsive breakpoints, animation spec |
| `tech-spec.md` | Stack recommendation, data structures, game loop, save system, build pipeline |

---

*Game Designer: msitarzewski*
*Document Status: Active — v0.2 complete, ready for engineering handoff*
*Next Revision Target: v0.3 — Slime artwork pipeline, audio asset list, biome secret trigger specs*
