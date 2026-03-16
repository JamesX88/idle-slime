// scripts/build-data.mjs
// Converts slime-roster.csv → src/data/slimes.json + src/data/breeds.json

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const csvPath = resolve(__dirname, 'slime-roster.csv')
const csv = readFileSync(csvPath, 'utf-8')
const lines = csv.trim().split('\n')
const headers = lines[0].split(',')

// Lore blurbs per rarity tier (used as fallback)
const loreFallbacks = {
  Common: [
    'A cheerful blob of pure goo.',
    'Simple but endearing — the backbone of any slime collection.',
    'Humble origins, but every great collection starts somewhere.',
    'Wiggles contentedly in its habitat.',
    'Produces goo at a steady, reliable pace.',
  ],
  Uncommon: [
    'A step above the ordinary — this slime has developed a personality.',
    'Slightly more complex than its common cousins.',
    'Curious and energetic, always exploring its surroundings.',
    'Has developed a taste for finer things.',
    'A notch above ordinary — worth getting to know.',
  ],
  Rare: [
    'Rarely seen, but unmistakable when encountered.',
    'Something special about this one — hard to explain, easy to feel.',
    'A prized addition to any serious collection.',
    'Few have seen this slime in the wild.',
    'Radiates an unusual energy that sets it apart.',
  ],
  Epic: [
    'An extraordinary specimen that defies easy categorization.',
    'Legends speak of this slime in hushed tones.',
    'The result of forces not fully understood.',
    'Its presence alone elevates the collection around it.',
    'Something ancient stirs within this slime.',
  ],
  Legendary: [
    'Born when worlds collide — a true rarity.',
    'Only the most dedicated collectors ever encounter this slime.',
    'The stuff of idle-game legend.',
    'A pinnacle of slime evolution.',
    'Whispered about in Slimepedia forums for years.',
  ],
  Mythic: [
    'Beyond classification. Beyond comprehension. Beyond goo.',
    'The universe itself seems to pause when this slime is present.',
    'A mythic entity that transcends the ordinary laws of slime.',
    'Some say it dreamed the world into existence. Others say it just drips goo.',
    'The final frontier of slime discovery.',
  ],
}

// Food categories by zone/element theme
const foodByZone = {
  1: ['Gooberries', 'Meadow Dew', 'Clover Sprigs', 'Petal Cakes'],
  2: ['Crystal Shards', 'Gem Dust', 'Quartz Drops', 'Mineral Flakes'],
  3: ['Embernuts', 'Lava Drops', 'Cinder Crisps', 'Ash Wafers'],
  4: ['Frostberries', 'Ice Crystals', 'Snow Flakes', 'Glacier Mints'],
  5: ['Spore Caps', 'Jungle Fruit', 'Vine Nectar', 'Toxic Blooms'],
  6: ['Stardust', 'Cosmic Flakes', 'Void Crystals', 'Nebula Drops'],
}

// Element tags by zone
const elementsByZone = {
  1: ['Earth', 'Water', 'Wind', 'Nature'],
  2: ['Mineral', 'Light', 'Sound'],
  3: ['Fire', 'Volcanic'],
  4: ['Ice', 'Cold'],
  5: ['Toxin', 'Fungal', 'Nature'],
  6: ['Cosmic', 'Void', 'Gravity'],
}

// Base production by rarity
const baseGooByRarity = {
  Common: 0.5,
  Uncommon: 2.0,
  Rare: 10.0,
  Epic: 50.0,
  Legendary: 250.0,
  Mythic: 2000.0,
}

// Build name→id lookup
const nameToId = {}
const slimes = []

for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',')
  // CSV: id,name,rarity,discovery,zone,parent_1,parent_2,notes
  const id = parts[0]?.trim()
  const name = parts[1]?.trim()
  const rarity = parts[2]?.trim()
  const discovery = parts[3]?.trim()
  const zone = parts[4]?.trim() ? parseInt(parts[4].trim()) : null
  const parent1Name = parts[5]?.trim() || null
  const parent2Name = parts[6]?.trim() || null
  const notes = parts.slice(7).join(',').trim().replace(/^"|"$/g, '') || ''

  if (!id || !name) continue

  nameToId[name] = id

  const lorePick = loreFallbacks[rarity] || loreFallbacks['Common']
  const lore = notes && notes.length > 10 && !notes.startsWith('Same-biome') && !notes.startsWith('Mythic') && !notes.startsWith('Cross-biome')
    ? notes
    : lorePick[parseInt(id) % lorePick.length]

  const zoneNum = zone || null
  const foods = foodByZone[zoneNum] || foodByZone[1]
  const favoriteFood = foods[parseInt(id) % foods.length]

  const elements = zoneNum ? elementsByZone[zoneNum] || ['Nature'] : ['Chaos']
  const element = elements[parseInt(id) % elements.length]

  slimes.push({
    id,
    name,
    rarity,
    discovery,
    zone: zoneNum,
    parent1Name: parent1Name || null,
    parent2Name: parent2Name || null,
    parent1: null, // resolved below
    parent2: null, // resolved below
    element,
    baseGooPerSec: baseGooByRarity[rarity] || 0.5,
    lore,
    favoriteFood,
    notes,
  })
}

// Resolve parent names to IDs
for (const slime of slimes) {
  if (slime.parent1Name) {
    slime.parent1 = nameToId[slime.parent1Name] || null
  }
  if (slime.parent2Name) {
    slime.parent2 = nameToId[slime.parent2Name] || null
  }
  delete slime.parent1Name
  delete slime.parent2Name
}

// Build breed table
const breedTable = {}
for (const slime of slimes) {
  if (slime.parent1 && slime.parent2) {
    const key = [slime.parent1, slime.parent2].sort().join('+')
    breedTable[key] = slime.id
  }
}

mkdirSync(resolve(ROOT, 'src/data'), { recursive: true })
writeFileSync(resolve(ROOT, 'src/data/slimes.json'), JSON.stringify(slimes, null, 2))
writeFileSync(resolve(ROOT, 'src/data/breeds.json'), JSON.stringify(breedTable, null, 2))

console.log(`✓ Generated ${slimes.length} slimes`)
console.log(`✓ Generated ${Object.keys(breedTable).length} breed combinations`)
