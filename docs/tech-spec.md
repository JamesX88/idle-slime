# Idle Slime — Technical Specification
**GDD Supplement v0.1**

---

## Platform Target

**Browser-based web game, mobile-first responsive.**
- Target browsers: Chrome, Firefox, Safari, Edge (latest 2 major versions)
- Target devices: iOS 15+ Safari, Android Chrome, desktop browsers
- No app store distribution required (PWA optional for icon/offline)
- No install barrier — share a URL

---

## Recommended Stack

### Core Framework: **Vanilla TypeScript + DOM rendering**

For an incremental idle game, a full game engine (Phaser, Unity WebGL) is overkill. Idle slime's UI is primarily DOM elements (numbers, grids, panels) with CSS animations. A lightweight DOM-based approach gives:

- Instant load times (no engine payload)
- CSS handles all slime animations natively
- Full accessibility support (screen readers, font scaling)
- Easy responsive layout with CSS Grid/Flexbox
- Smaller bundle → better mobile performance

**Recommended toolchain**:
```
Language:    TypeScript
Bundler:     Vite
Styling:     CSS Modules + CSS custom properties (theming)
State:       Vanilla reactive store (no Redux/Zustand needed — see below)
Testing:     Vitest + Playwright
Lint:        ESLint + Prettier
```

> **Why not React?** React adds 40KB+ and re-render overhead that's irrelevant for an idle game. A simple pub/sub event system handles all state updates efficiently. If the team strongly prefers React, it works fine — just be mindful of render performance when updating 50+ slime cells per tick.

> **Why not Phaser?** Phaser's Canvas rendering is excellent for action games. For idle UI with text, grids, and accessibility requirements, DOM outperforms Canvas and requires less custom work.

---

## Project Structure

```
idle-slime/
├── src/
│   ├── main.ts              # Entry point
│   ├── game/
│   │   ├── state.ts         # Central game state
│   │   ├── tick.ts          # Game loop (requestAnimationFrame + setInterval)
│   │   ├── economy.ts       # Goo production, cost calculations
│   │   ├── slimes.ts        # Slime definitions, stats, breed table
│   │   ├── breeds.ts        # Breed resolution logic
│   │   ├── upgrades.ts      # Upgrade tree definitions and effects
│   │   ├── zones.ts         # Zone unlock logic, summoning
│   │   └── save.ts          # localStorage persistence
│   ├── ui/
│   │   ├── main-screen.ts   # Primary game view
│   │   ├── slimepedia.ts    # Collection viewer
│   │   ├── breed-lab.ts     # Breed management
│   │   ├── upgrades.ts      # Upgrade screen
│   │   ├── zone-map.ts      # Zone selection
│   │   ├── fanfare.ts       # Discovery overlay
│   │   └── components/      # Reusable UI pieces (slime-card, currency-bar, etc.)
│   ├── data/
│   │   ├── slimes.json      # All 527 slime definitions (generated from CSV)
│   │   ├── breeds.json      # Breed table lookup (parent1_id + parent2_id → result_id)
│   │   └── config.ts        # All tunable constants (ZONE_COST_2, GOO_PER_TAP, etc.)
│   ├── assets/
│   │   ├── slimes/          # Slime artwork (SVG preferred for scalability)
│   │   └── audio/           # SFX and music tracks
│   └── styles/
│       ├── global.css
│       ├── variables.css    # Design tokens (colors, spacing, rarity colors)
│       └── animations.css   # All keyframe animations
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Data Structures

### Game State

```typescript
interface GameState {
  // Currencies
  goo: number;           // Use JavaScript BigInt for late-game values? Or just number with precision truncation
  essence: number;
  prismShards: number;

  // Zones
  unlockedZones: Set<ZoneId>;
  activeZone: ZoneId;

  // Collection — keyed by slime ID
  collection: Map<SlimeId, OwnedSlime>;

  // Upgrades
  tapPowerLevel: number;
  outputLevel: number;
  discoveryLevel: number;

  // Breed system
  breedSlots: BreedSlot[];

  // Meta
  totalBreeds: number;
  totalDiscoveries: number;
  lastSaveTime: number;      // Unix timestamp (for offline calc)
  firstPlayTime: number;
}

interface OwnedSlime {
  id: SlimeId;
  count: number;             // How many copies owned
  level: number;             // 1-10
  discoveredAt: number;      // Unix timestamp
  discoveryNumber: number;   // e.g., "Your 47th slime"
}

interface BreedSlot {
  id: SlotId;
  locked: boolean;
  parent1: SlimeId | null;
  parent2: SlimeId | null;
  startTime: number | null;  // Unix timestamp when breed started
  cooldownMs: number;        // Computed from Discovery upgrade level
}
```

### Slime Definition (from data/slimes.json)

```typescript
interface SlimeDefinition {
  id: SlimeId;           // e.g., "001", "342"
  name: string;          // e.g., "Frost Drake Slime"
  rarity: Rarity;        // "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic"
  discovery: "Zone" | "Breed" | "Special";
  zone: ZoneId | null;   // 1-6 or null for breeds/specials
  parent1: SlimeId | null;
  parent2: SlimeId | null;
  element: Element[];    // e.g., ["Fire", "Ice"] for Frost Drake
  baseGooPerSec: number;
  lore: string;          // Slimepedia flavor text
  favoriteFood: FoodCategory;
  notes: string;
}

type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythic";
type ZoneId = 1 | 2 | 3 | 4 | 5 | 6;
type SlimeId = string;  // zero-padded 3 digits: "001"–"527"
```

### Breed Table (data/breeds.json)

```typescript
// Lookup: canonical key → result slime ID
// canonical key = sorted([parent1, parent2]).join("+")
// Example: "003+026" (Sprout + Quartz) → "223"
type BreedTable = Record<string, SlimeId>;

// Generation at runtime:
function buildBreedTable(slimes: SlimeDefinition[]): BreedTable {
  const table: BreedTable = {};
  for (const slime of slimes) {
    if (slime.parent1 && slime.parent2) {
      const key = [slime.parent1, slime.parent2].sort().join("+");
      table[key] = slime.id;
    }
  }
  return table;
}

function resolveBreed(parent1: SlimeId, parent2: SlimeId, table: BreedTable): SlimeId {
  if (parent1 === parent2) return null; // Same species — should use Merge
  const key = [parent1, parent2].sort().join("+");
  return table[key] ?? "513"; // "513" = Mudslime (incompatible result)
}
```

---

## Game Loop

```typescript
// Two separate loops for different update frequencies:

// 1. Production tick — every 100ms
setInterval(() => {
  const totalGooPerSec = computeTotalProduction(state);
  state.goo += totalGooPerSec * 0.1; // 100ms = 0.1s
  updateCurrencyDisplay();
}, 100);

// 2. UI tick — requestAnimationFrame (60fps)
// Only updates visual elements that change frequently
// Production totals, floating numbers, breed countdowns
function uiLoop() {
  updateBreedCountdowns();
  updateFloatingNumbers();
  requestAnimationFrame(uiLoop);
}
requestAnimationFrame(uiLoop);
```

### Production Calculation

```typescript
function computeTotalProduction(state: GameState): number {
  let total = 0;

  for (const [id, owned] of state.collection) {
    const def = getSlimeDefinition(id);
    const baseOutput = def.baseGooPerSec;
    const levelMultiplier = Math.pow(LEVEL_UP_MULTIPLIER, owned.level - 1);
    const outputUpgradeMultiplier = getOutputMultiplier(state.outputLevel);
    const synergyBonus = computeSynergyBonus(state, def.rarity);
    const zoneMasteryBonus = computeZoneMasteryBonus(state, def.zone);

    total += baseOutput * levelMultiplier * outputUpgradeMultiplier
           * (1 + synergyBonus) * (1 + zoneMasteryBonus) * owned.count;
  }

  return total;
}
```

---

## Save System

**Storage**: `localStorage` (no backend required for v1)
**Save format**: JSON, compressed with LZ-string if > 100KB
**Auto-save**: Every 30 seconds
**Manual save**: On app blur (user switches tabs/apps)

```typescript
interface SaveData {
  version: string;         // "1.0.0" — for migration support
  savedAt: number;         // Unix timestamp
  state: SerializedGameState;
}

function saveGame(state: GameState): void {
  const save: SaveData = {
    version: GAME_VERSION,
    savedAt: Date.now(),
    state: serializeState(state),
  };
  localStorage.setItem("idle-slime-save", JSON.stringify(save));
}

function loadGame(): GameState {
  const raw = localStorage.getItem("idle-slime-save");
  if (!raw) return createNewGame();

  const save: SaveData = JSON.parse(raw);
  const state = deserializeState(save.state, save.version);

  // Offline production calculation
  const offlineSeconds = Math.min(
    (Date.now() - save.savedAt) / 1000,
    OFFLINE_CAP_HOURS * 3600
  );
  state.goo += computeTotalProduction(state) * offlineSeconds;

  return state;
}
```

**Export/Import**: Base64-encoded JSON for manual backup (Settings screen).

---

## Performance Considerations

| Concern | Approach |
|---------|----------|
| 527 slimes in collection | Virtual scrolling in Slimepedia — only render visible cells |
| Production calc 10× per sec | Cache total and only recompute on collection change |
| Floating +Goo numbers | Object pool — reuse DOM elements, don't create/destroy |
| Large numbers (BigInt risk) | Use `number` (float64) until 2^53 — sufficient for all game values |
| Mobile battery | Cap to 30fps during background/unfocused tabs |
| localStorage quota | Compress save data with LZ-string if > 50KB |

---

## PWA Configuration (Optional but Recommended)

Add a `manifest.json` and service worker to enable:
- "Add to Home Screen" on mobile
- App icon on home screen (no App Store required)
- Offline play (game works without internet after first load)
- Push notifications for offline production (mobile)

```json
{
  "name": "Idle Slime",
  "short_name": "Idle Slime",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a2e",
  "theme_color": "#7c3aed",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## Build & Deploy

```bash
# Development
npm run dev          # Vite dev server with HMR

# Production
npm run build        # Output to dist/
npm run preview      # Preview production build locally

# Deploy
# Static files only — deploy to Netlify, Vercel, GitHub Pages, or any CDN
# No server required for v1
```

---

## CSV → JSON Build Step

The `docs/slime-roster.csv` is the source of truth for slime data. A build script converts it to the `data/slimes.json` used at runtime.

```typescript
// scripts/build-slime-data.ts
import { parse } from "csv-parse/sync";
import { readFileSync, writeFileSync } from "fs";

const csv = readFileSync("docs/slime-roster.csv", "utf-8");
const rows = parse(csv, { columns: true });

const slimes = rows.map(row => ({
  id: row.id,
  name: row.name,
  rarity: row.rarity,
  discovery: row.discovery,
  zone: row.zone ? parseInt(row.zone) : null,
  parent1: row.parent_1 ? resolveIdFromName(row.parent_1) : null,
  parent2: row.parent_2 ? resolveIdFromName(row.parent_2) : null,
  notes: row.notes,
  // Art, lore, element tags added separately in content pipeline
}));

writeFileSync("src/data/slimes.json", JSON.stringify(slimes, null, 2));
```

---

## Dev Milestones (Suggested Order)

| Phase | Deliverable |
|-------|------------|
| 1 | Core loop: tap → Goo → feed → production. One slime, no zones. |
| 2 | Multiple slimes, collection grid, Slimepedia stub |
| 3 | Zones 1–2, summoning, zone unlock |
| 4 | Merge system |
| 5 | Breed system, breed table, Breed Lab UI |
| 6 | Upgrade trees, all 3 tracks |
| 7 | Zones 3–6, pacing calibration |
| 8 | Discovery fanfare, audio integration |
| 9 | Save/load, offline production |
| 10 | PWA, polish, performance audit |
| 11 | Slimepedia hints, Prism Shard economy |
| 12 | Special slimes (513–527), secret triggers |
| 13 | Full balance playtest pass |
