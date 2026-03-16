# Idle Slime — UI/UX Specification
**GDD Supplement v0.1**
**Platform**: Web Browser, mobile-first responsive

---

## Design Principles

1. **Never more than 3 taps to any action** — the game should feel instantly navigable
2. **Always something to tap** — no dead moments where the screen offers nothing interactive
3. **Numbers are the reward** — production stats and discovery counts are prominent
4. **Discovery is theatrical** — new slime reveals break the normal UI flow with full fanfare
5. **Reduce motion option** — all animations have a reduced/disabled mode (accessibility)

---

## Screen Inventory

| Screen | Trigger | Purpose |
|--------|---------|---------|
| Main Game | App launch | Primary play surface |
| Slimepedia | Tab / button | Collection viewer |
| Breed Lab | Tab / button | Breed management |
| Upgrades | Tab / button | Upgrade tracks |
| Zone Map | Button | Zone selection & unlock |
| Discovery Fanfare | Auto (on new slime) | Celebrates new species |
| Settings | Button | Audio, reduce motion, etc. |

---

## Main Game Screen

The primary play surface. Everything essential lives here.

```
┌─────────────────────────────────────────────────┐  ← 375px wide (iPhone SE baseline)
│  GOOEY MEADOW         🔬 47/150  ⚙️             │  ← Top bar: zone name, progress, settings
├─────────────────────────────────────────────────┤
│                                                 │
│   💧 12,847           ✨ 23          💎 8       │  ← Currency row (always visible)
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐      │
│   │ 🟢   │  │ 🟢   │  │ 🟢   │  │ 🟢   │      │
│   │ Blob │  │Puddle│  │Sprout│  │Pebble│      │  ← Slime grid (4 across)
│   │ lv.3 │  │ lv.1 │  │ lv.2 │  │ lv.1 │      │  ← Tap any slime to see stats
│   └──────┘  └──────┘  └──────┘  └──────┘      │
│                                                 │
│   ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐      │
│   │ 🟢   │  │ 🟢   │  │ 🔵   │  │  +   │      │
│   │ Mossy│  │Wisp  │  │Verdnt│  │Summon│      │  ← + cell = Summon button
│   │ lv.2 │  │ lv.1 │  │ lv.4 │  │ 25💧 │      │
│   └──────┘  └──────┘  └──────┘  └──────┘      │
│                                                 │
│   ┌─────────────────────────────────────────┐  │
│   │  Total: 47.3 💧/sec                     │  │  ← Production summary bar
│   └─────────────────────────────────────────┘  │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│         ╔══════════════════════════╗            │
│         ║                          ║            │
│         ║       TAP TARGET         ║            │  ← Main tap blob (center of screen)
│         ║     (Large goo blob)     ║            │     minimum 120×120px tap area
│         ║                          ║            │
│         ╚══════════════════════════╝            │
│              +1 💧  +1 💧  +1 💧               │  ← Floating +Goo numbers on tap
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  [📖 SLIMEPEDIA]  [🧪 BREED LAB]  [⬆️ UPGRADES]│  ← Bottom navigation (3 tabs)
│                                                 │
└─────────────────────────────────────────────────┘
```

### Slime Grid Behavior
- Slimes displayed in rarity order (highest first) within zone
- Tap a slime → slide-up **Slime Detail Panel** (see below)
- Long-press a slime → quick-access feed/merge buttons (skip the panel)
- Grid scrolls vertically — no hard cap on collection size
- Slime cells pulse subtly when a merge is available (3+ identical slimes present)
- Slime cells glow when at max level

### Slime Detail Panel (slide-up)
```
┌─────────────────────────────────────────────────┐
│  ▼ drag to close                                │
│                                                 │
│         🟢 Blob Slime (Common)                  │
│         "A cheerful blob of pure goo."          │
│         Favorite Food: Gooberries               │
│                                                 │
│         Level 3 / 10                            │
│         Production: 1.13 💧/sec                 │
│         ████████░░░░ Level 4 in 488 💧          │
│                                                 │
│    [FEED — 125 💧]      [MERGE (2/3)]           │
│                                                 │
│    You own: 2 copies    First discovered: Zone 1│
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Slimepedia Screen

```
┌─────────────────────────────────────────────────┐
│  ← BACK      SLIMEPEDIA         47 / 527 🔬     │
│                                                 │
│  [ALL] [ZONE 1] [ZONE 2] [ZONE 3] [BREED] ...  │  ← Filter tabs
│                                                 │
│  Search: [________________]                     │
│                                                 │
│  ┌────────────────────────────────────────┐    │
│  │ GOOEY MEADOW (Zone 1)   22/25 ✓        │    │
│  ├────────────────────────────────────────┤    │
│  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │    │
│  │ │ 🟢   │ │ 🟢   │ │ 🟢   │ │ ???  │  │    │  ← Undiscovered = silhouette
│  │ │ Blob │ │Puddle│ │Sprout│ │      │  │    │  ← Same zone = silhouette shown
│  │ └──────┘ └──────┘ └──────┘ └──────┘  │    │
│  └────────────────────────────────────────┘    │
│                                                 │
│  ┌────────────────────────────────────────┐    │
│  │ CRYSTAL CAVES (Zone 2)   0/25 🔒       │    │  ← Locked zone = fully hidden
│  └────────────────────────────────────────┘    │
│                                                 │
│  ┌────────────────────────────────────────┐    │
│  │ BREEDING EXCLUSIVES      0/362 🔒      │    │  ← Breed entries hidden until
│  └────────────────────────────────────────┘    │     first breed is completed
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Slimepedia Visibility Rules
| Condition | Display |
|-----------|---------|
| Zone locked | Section collapsed, "🔒 Unlock Zone N to reveal" |
| Zone unlocked, slime undiscovered (same zone) | Silhouette + "???" name |
| Cross-biome breed, undiscovered | Fully hidden until any breed completed |
| Discovered | Full entry — name, art, lore, production stat, how discovered |
| Hint purchased (tier 1) | Element tag revealed on silhouette |
| Hint purchased (tier 2) | One parent name revealed |
| Hint purchased (tier 3) | Full recipe revealed |

### Slimepedia Entry Detail
```
┌─────────────────────────────────────────────────┐
│  ← BACK                                         │
│                                                 │
│       🟦 Frost Drake Slime          [Legendary] │
│                                                 │
│   "Born when volcanic ambition meets           │
│    glacial patience. Neither fire nor ice —    │
│    something far stranger."                    │
│                                                 │
│   Element: Chaos                               │
│   Production: 250 💧/sec (at level 1)          │
│   Discovered: Your 73rd slime                  │
│   Date: [first discovery date]                 │
│                                                 │
│   Recipe: Fire Drake Slime + Ice Sovereign Slime│
│                                                 │
│   ──────────────────────────────────────────   │
│   YOUR COPY                                    │
│   Level: 7/10    Copies owned: 1               │
│   Production: 3,164 💧/sec                     │
│   [FEED — 54,675 💧]                           │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Breed Lab Screen

```
┌─────────────────────────────────────────────────┐
│  ← BACK           BREED LAB                     │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  SLOT 1                     ⏱ Ready ✓   │  │
│  │                                          │  │
│  │  [+ Parent 1]    ×    [+ Parent 2]  ►   │  │  ← ► = Breed button
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  SLOT 2                     ⏱ 23s...    │  │
│  │                                          │  │
│  │  [Blob Slime]    ×    [Frost Slime]  ●  │  │  ← ● = In progress
│  │  ████████░░░░░░░░░░░░  23s remaining    │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  SLOT 3                     🔒 Locked    │  │
│  │  Unlock with Discovery Lv.9 (300 ✨)    │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ─────────────────────────────────────────────  │
│  RECENT BREEDS                                  │
│                                                 │
│  🟦 Frost Petal Slime   ← NEW! (tap to view)   │
│  🟩 Spore Pollen Slime  ← Known                │
│  ⬜ Mudslime            ← Incompatible ⚠       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Parent Selection Flow
Tapping [+ Parent 1] opens a filtered collection view:
- Shows only slimes the player owns
- Warns if a slime has only 1 copy: "⚠️ This slime will be consumed. You only have 1."
- Confirmation required before breeds that consume a player's last copy

---

## Zone Map Screen

```
┌─────────────────────────────────────────────────┐
│  ← BACK           ZONE MAP                      │
│                                                 │
│                      ✦ 6                       │
│                   STARFALL ISLE                │
│                   🔒 150,000,000 💧            │
│                         │                      │
│                      ✦ 5                       │
│                  VERDANT DEEP                  │
│                   🔒 5,000,000 💧              │
│                         │                      │
│                      ✦ 4                       │
│                    FROSTMERE                   │
│                   🔒 200,000 💧                │
│                         │                      │
│                      ✦ 3                       │
│                  EMBER WASTES                  │
│                  ✓ UNLOCKED                    │
│                  (active zone)                 │
│                         │                      │
│                      ✦ 2                       │
│                 CRYSTAL CAVES                  │
│                  ✓ UNLOCKED                    │
│                         │                      │
│                      ✦ 1                       │
│                 GOOEY MEADOW                   │
│                  ✓ UNLOCKED                    │
│                                                 │
│  [SET ACTIVE ZONE]  ← tap any unlocked zone    │
│                                                 │
│  💧 Current: 14,200 / 200,000 for Zone 4       │
│  ████░░░░░░░░░░░░░░░  7%                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Discovery Fanfare Screen (Full Screen Overlay)

Triggered on first discovery of any new slime species. Interrupts gameplay with a full-screen celebration.

```
┌─────────────────────────────────────────────────┐
│                                                 │
│             ✨ NEW DISCOVERY! ✨                 │
│                                                 │
│         ┌─────────────────────────┐            │
│         │                         │            │
│         │    🌈 LEGENDARY 🌈      │            │
│         │                         │            │
│         │   [FROST DRAKE SLIME]   │            │
│         │   [large animated art]  │            │
│         │                         │            │
│         └─────────────────────────┘            │
│                                                 │
│    "Born when volcanic ambition meets           │
│     glacial patience."                          │
│                                                 │
│    Slimepedia #342     Production: 250 💧/sec  │
│    Recipe: Fire Drake + Ice Sovereign           │
│                                                 │
│    +1 💎  Prism Shard earned!                  │
│                                                 │
│         [ADD TO COLLECTION]                     │
│                                                 │
│    ─────────────────────────────────────        │
│    Slimepedia: 342/527  ████████████░ 65%      │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Fanfare Tiers by Rarity
| Rarity | Fanfare Style |
|--------|--------------|
| Common | Small notification banner (doesn't interrupt gameplay) |
| Uncommon | Slide-up panel, 2 seconds, auto-dismiss |
| Rare | Full-screen overlay, requires tap to dismiss |
| Epic | Full-screen + screen shake + particle burst |
| Legendary | Full-screen + extended animation + unique SFX |
| Mythic | Full-screen + special visual effect unique to that slime |

---

## Upgrades Screen

```
┌─────────────────────────────────────────────────┐
│  ← BACK           UPGRADES                      │
│                                                 │
│  [👆 TAP POWER]  [🌀 OUTPUT]  [🔍 DISCOVERY]   │
│  ───────────────────────────                    │
│                                                 │
│  Current: 16 💧/tap (Level 4)                   │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ ⬆ Level 4 → 5                            │  │
│  │ Turbo Tap                                │  │
│  │                                          │  │
│  │ 16 → 32 Goo per tap                     │  │
│  │ Milestone: Unlocks Tap Burst ability     │  │
│  │                                          │  │
│  │ Cost: 2,025 💧  [You have: 14,200 💧]   │  │
│  │                                          │  │
│  │         ╔══════════════════╗             │  │
│  │         ║  UPGRADE  2,025💧║             │  │
│  │         ╚══════════════════╝             │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  NEXT MILESTONES                               │
│  Lv.5  ── Tap Burst ability                   │
│  Lv.10 ── Essence drops from tapping          │
│  Lv.15 ── Big Bang Tap (max level)            │
│                                                 │
│  Progress: ████░░░░░░░░░  4/15                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Responsive Breakpoints

| Breakpoint | Layout Change |
|------------|--------------|
| < 480px (mobile portrait) | Full spec above — 4-column slime grid |
| 480–768px (mobile landscape / small tablet) | 5-column slime grid, bottom nav stays |
| 768–1024px (tablet portrait) | 6-column grid, bottom nav → side nav |
| > 1024px (desktop) | 8-column grid, side nav always visible, no bottom nav |

---

## Touch / Interaction Targets

| Element | Minimum Size |
|---------|-------------|
| Tap blob | 120×120px |
| Slime grid cell | 72×72px |
| Bottom nav tab | Full width ÷ 3, min 48px height |
| Feed / Merge buttons | 44×44px minimum |
| Close / back buttons | 44×44px minimum |

---

## Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Color-blind friendly rarities | Icon shape + color (not color alone) |
| Reduce motion | Toggle in Settings — disables all animations, retains function |
| Font size | Respects system font size setting (no fixed px on body text) |
| Contrast | All text minimum 4.5:1 contrast ratio against backgrounds |
| Screen reader | ARIA labels on all interactive elements; announcements on new discoveries |
| Tap target size | All interactive elements ≥ 44×44px |

---

## Settings Screen

```
┌─────────────────────────────────────────────────┐
│  ← BACK           SETTINGS                      │
│                                                 │
│  AUDIO                                         │
│  ├─ Sound Effects        [ON  ●          OFF]  │
│  ├─ Music                [ON  ●          OFF]  │
│  └─ Volume               [████████░░] 80%      │
│                                                 │
│  ACCESSIBILITY                                 │
│  ├─ Reduce Motion        [ON           ● OFF]  │
│  ├─ High Contrast        [ON           ● OFF]  │
│  └─ Large Text           [ON           ● OFF]  │
│                                                 │
│  NOTIFICATIONS (mobile)                        │
│  └─ Offline Production   [ON  ●          OFF]  │
│                                                 │
│  DATA                                          │
│  ├─ Export Save          [EXPORT]              │
│  └─ Import Save          [IMPORT]              │
│                                                 │
│  VERSION 0.1.0                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Animation & Feedback Spec

| Event | Visual | Audio | Duration |
|-------|--------|-------|----------|
| Tap main blob | Blob squishes, ripple effect, +N float | Wet squelch | 150ms |
| Slime produces passively | Tiny goo droplet falls from slime | Soft drip (low volume) | 500ms |
| Feed a slime | Slime grows slightly, hearts/sparkles | Pop + happy chirp | 400ms |
| Level up milestone (5, 10) | Glow burst + slime transform | Ascending chime | 600ms |
| Merge trigger available | Slime cells pulse amber | Subtle bell | Loop until merged |
| Merge complete | 3 slimes spiral together → new slime | Deep thump + sparkle | 800ms |
| Breed complete | Result glows in breed slot | Reveal SFX | 500ms |
| New discovery (Uncommon) | Slide-up panel | Chime | Auto-dismiss 2s |
| New discovery (Rare+) | Full screen fanfare | Unique SFX per rarity | Until dismissed |
| Zone unlock | Screen transitions with biome ambient | Ambient shift | 1000ms |
| Tap Burst (ability) | Ring of +N numbers explode outward | Whoosh + burst | 300ms |
