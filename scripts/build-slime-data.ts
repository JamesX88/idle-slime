/**
 * Converts docs/slime-roster.csv into:
 *   src/data/slimes.json   — full slime definitions
 *   src/data/breeds.json   — breed lookup table: "parent1+parent2" → result id
 *
 * Run: npm run build:data
 */

import { parse } from 'csv-parse/sync'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(process.cwd())

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CsvRow {
  id: string
  name: string
  rarity: string
  discovery: string
  zone: string
  parent_1: string
  parent_2: string
  notes: string
}

interface SlimeDef {
  id: string
  name: string
  rarity: string
  discovery: 'Zone' | 'Breed' | 'Special'
  zone: number | null
  parent1: string | null   // numeric id string e.g. "015"
  parent2: string | null
  baseGooPerSec: number
  lore: string
  element: string[]
  favoriteFood: string
  notes: string
}

// ---------------------------------------------------------------------------
// Rarity derived stats
// ---------------------------------------------------------------------------

const GOO_BY_RARITY: Record<string, number> = {
  Common: 0.5,
  Uncommon: 2.0,
  Rare: 10.0,
  Epic: 50.0,
  Legendary: 250.0,
  Mythic: 2000.0,
}

// Default lore stubs — real lore to be authored separately
function stubLore(name: string, rarity: string): string {
  const rarityFlavors: Record<string, string> = {
    Common: 'A friendly blob of goo.',
    Uncommon: 'A slightly unusual slime with a curious personality.',
    Rare: 'A remarkable slime seldom seen in the wild.',
    Epic: 'An extraordinary slime of considerable power.',
    Legendary: 'A legendary being spoken of in ancient slime tales.',
    Mythic: 'A mythic entity beyond all ordinary understanding.',
  }
  return `${name}. ${rarityFlavors[rarity] ?? 'A mysterious slime.'}`
}

// Infer element tags from name keywords
function inferElements(name: string, zone: number | null): string[] {
  const n = name.toLowerCase()
  const elements: string[] = []

  if (n.includes('fire') || n.includes('flame') || n.includes('blaze') || n.includes('ember') || n.includes('inferno') || n.includes('phoenix') || n.includes('volcanic') || n.includes('lava') || n.includes('magma') || n.includes('forge') || n.includes('cinder') || n.includes('scorch') || n.includes('wildfire') || n.includes('hellfire') || n.includes('drake') || n.includes('pyroclast')) {
    elements.push('Fire')
  }
  if (n.includes('frost') || n.includes('ice') || n.includes('snow') || n.includes('blizzard') || n.includes('glacier') || n.includes('arctic') || n.includes('frozen') || n.includes('polar') || n.includes('tundra') || n.includes('icicle') || n.includes('rime') || n.includes('hail') || n.includes('sleet') || n.includes('flurry') || n.includes('winter') || n.includes('frostbite') || n.includes('chill')) {
    elements.push('Ice')
  }
  if (n.includes('void') || n.includes('dark matter') || n.includes('black hole') || n.includes('singularity') || n.includes('event horizon') || n.includes('eclipse')) {
    elements.push('Void')
  }
  if (n.includes('star') || n.includes('cosmic') || n.includes('nebula') || n.includes('galaxy') || n.includes('astral') || n.includes('celestial') || n.includes('supernova') || n.includes('pulsar') || n.includes('quasar') || n.includes('nova') || n.includes('solar') || n.includes('lunar') || n.includes('comet') || n.includes('meteor') || n.includes('constellation') || n.includes('photon') || n.includes('warp')) {
    elements.push('Cosmic')
  }
  if (n.includes('crystal') || n.includes('gem') || n.includes('quartz') || n.includes('diamond') || n.includes('sapphire') || n.includes('ruby') || n.includes('opal') || n.includes('topaz') || n.includes('lapis') || n.includes('obsidian') || n.includes('amber') || n.includes('prismatic') || n.includes('prism') || n.includes('glowstone') || n.includes('geode') || n.includes('stalactite') || n.includes('resonan') || n.includes('echo') || n.includes('citrine') || n.includes('marble') || n.includes('chalk') || n.includes('slate') || n.includes('onyx') || n.includes('calcite')) {
    elements.push('Mineral')
  }
  if (n.includes('mycelium') || n.includes('spore') || n.includes('fungus') || n.includes('bloom') || n.includes('root') || n.includes('vine') || n.includes('tangle') || n.includes('jungle') || n.includes('canopy') || n.includes('bark') || n.includes('fern') || n.includes('toxin') || n.includes('poison') || n.includes('overgrowth') || n.includes('predator') || n.includes('silk') || n.includes('cocoon') || n.includes('leech') || n.includes('pitcher') || n.includes('sap') || n.includes('pheromone') || n.includes('muck') || n.includes('drip') || n.includes('burrow') || n.includes('mimic') || n.includes('seed') || n.includes('ancient grove') || n.includes('verdant deep')) {
    elements.push('Nature')
  }
  if (n.includes('meadow') || n.includes('gale') || n.includes('breeze') || n.includes('pollen') || n.includes('petal') || n.includes('clover') || n.includes('honey') || n.includes('dewdrop') || n.includes('blob') || n.includes('puddle') || n.includes('sprout') || n.includes('mossy') || n.includes('muddy') || n.includes('sandy') || n.includes('pebble') || n.includes('wisp') || n.includes('thorn') || n.includes('dust') || n.includes('brook') || n.includes('flint') || n.includes('burr') || n.includes('earthen sage') || n.includes('verdant slime') || n.includes('raindrop')) {
    elements.push('Earth')
  }
  if (n.includes('gravity') || n.includes('orbit')) {
    elements.push('Gravity')
  }
  if (n.includes('steam') || n.includes('meltwater') || n.includes('slush')) {
    elements.push('Steam')
  }
  if (n.includes('ice fire') || n.includes('frost drake') || n.includes('chaos')) {
    elements.push('Chaos')
  }
  if (n.includes('aurora') || n.includes('light') || n.includes('glow')) {
    elements.push('Light')
  }
  if (n.includes('ash') || n.includes('soot') || n.includes('sulfur') || n.includes('coal') || n.includes('char') || n.includes('smolder') || n.includes('crust') || n.includes('geyser') || n.includes('furnace') || n.includes('molten')) {
    elements.push('Volcanic')
  }

  // Fallback: use zone
  if (elements.length === 0) {
    const zoneElements: Record<number, string> = {
      1: 'Earth', 2: 'Mineral', 3: 'Fire', 4: 'Ice', 5: 'Nature', 6: 'Cosmic',
    }
    if (zone && zoneElements[zone]) elements.push(zoneElements[zone])
    else elements.push('Unknown')
  }

  // Deduplicate
  return [...new Set(elements)]
}

// Assign a food category by element/theme
function assignFavoriteFood(elements: string[]): string {
  const foodMap: Record<string, string> = {
    Earth: 'Gooberries',
    Mineral: 'Crystal Flakes',
    Fire: 'Embernuts',
    Volcanic: 'Embernuts',
    Ice: 'Frostpops',
    Nature: 'Leafcrisps',
    Cosmic: 'Starfizz',
    Void: 'Shadowmints',
    Gravity: 'Starfizz',
    Steam: 'Gooberries',
    Chaos: 'Embernuts',
    Light: 'Crystal Flakes',
    Unknown: 'Gooberries',
  }
  const primary = elements[0] ?? 'Unknown'
  return foodMap[primary] ?? 'Gooberries'
}

// ---------------------------------------------------------------------------
// ID lookup: name → id
// ---------------------------------------------------------------------------

function buildNameToId(rows: CsvRow[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const row of rows) {
    map.set(row.name.trim(), row.id.trim())
  }
  return map
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const csvPath = resolve(ROOT, 'docs/slime-roster.csv')
const slimesOutPath = resolve(ROOT, 'src/data/slimes.json')
const breedsOutPath = resolve(ROOT, 'src/data/breeds.json')

const csv = readFileSync(csvPath, 'utf-8')
const rows: CsvRow[] = parse(csv, { columns: true, skip_empty_lines: true })

const nameToId = buildNameToId(rows)

const slimes: SlimeDef[] = rows.map((row) => {
  const zone = row.zone ? parseInt(row.zone, 10) : null
  const elements = inferElements(row.name, zone)
  const favoriteFood = assignFavoriteFood(elements)

  // Resolve parent names to IDs
  const parent1 = row.parent_1?.trim()
    ? (nameToId.get(row.parent_1.trim()) ?? null)
    : null
  const parent2 = row.parent_2?.trim()
    ? (nameToId.get(row.parent_2.trim()) ?? null)
    : null

  if (row.parent_1?.trim() && !parent1) {
    console.warn(`⚠️  Could not resolve parent_1 "${row.parent_1}" for ${row.name}`)
  }
  if (row.parent_2?.trim() && !parent2) {
    console.warn(`⚠️  Could not resolve parent_2 "${row.parent_2}" for ${row.name}`)
  }

  return {
    id: row.id.trim(),
    name: row.name.trim(),
    rarity: row.rarity.trim(),
    discovery: row.discovery.trim() as 'Zone' | 'Breed' | 'Special',
    zone,
    parent1,
    parent2,
    baseGooPerSec: GOO_BY_RARITY[row.rarity.trim()] ?? 0.5,
    lore: stubLore(row.name.trim(), row.rarity.trim()),
    element: elements,
    favoriteFood,
    notes: row.notes?.trim() ?? '',
  }
})

// Build breed table: sorted "id1+id2" → result_id
const breedTable: Record<string, string> = {}
for (const slime of slimes) {
  if (slime.parent1 && slime.parent2) {
    const key = [slime.parent1, slime.parent2].sort().join('+')
    if (breedTable[key]) {
      console.warn(`⚠️  Duplicate breed key ${key}: ${breedTable[key]} vs ${slime.id}`)
    }
    breedTable[key] = slime.id
  }
}

writeFileSync(slimesOutPath, JSON.stringify(slimes, null, 2))
writeFileSync(breedsOutPath, JSON.stringify(breedTable, null, 2))

console.log(`✅  Built ${slimes.length} slimes → src/data/slimes.json`)
console.log(`✅  Built ${Object.keys(breedTable).length} breed recipes → src/data/breeds.json`)
