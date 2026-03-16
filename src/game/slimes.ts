// Slime data access — loads from generated JSON
import slimesData from '../data/slimes.json'
import type { SlimeDefinition, SlimeId, Rarity } from './state'
import { RARITY_ORDER } from '../data/config'

const _slimes: SlimeDefinition[] = slimesData as SlimeDefinition[]
const _byId: Map<SlimeId, SlimeDefinition> = new Map()

for (const s of _slimes) {
  _byId.set(s.id, s)
}

export function getSlime(id: SlimeId): SlimeDefinition | undefined {
  return _byId.get(id)
}

export function getAllSlimes(): SlimeDefinition[] {
  return _slimes
}

export function getZoneSlimes(zone: number): SlimeDefinition[] {
  return _slimes.filter(s => s.zone === zone)
}

export function getSummonableSlimes(zone: number): SlimeDefinition[] {
  // Only Common, Uncommon, Rare zone slimes are summonable (not secrets)
  return _slimes.filter(s =>
    s.zone === zone &&
    s.discovery === 'Zone' &&
    ['Common', 'Uncommon', 'Rare'].includes(s.rarity) &&
    !s.notes.toLowerCase().includes('secret')
  )
}

export function sortByRarity(slimes: SlimeDefinition[]): SlimeDefinition[] {
  return [...slimes].sort((a, b) => {
    const ra = RARITY_ORDER[a.rarity] ?? 99
    const rb = RARITY_ORDER[b.rarity] ?? 99
    if (ra !== rb) return ra - rb
    return parseInt(a.id) - parseInt(b.id)
  })
}

export function rarityColor(rarity: Rarity): string {
  const colors: Record<Rarity, string> = {
    Common: '#9ca3af',
    Uncommon: '#4ade80',
    Rare: '#60a5fa',
    Epic: '#c084fc',
    Legendary: '#fbbf24',
    Mythic: '#e879f9',
  }
  return colors[rarity] ?? '#9ca3af'
}

export function rarityGlow(rarity: Rarity): string {
  const glows: Record<Rarity, string> = {
    Common: 'none',
    Uncommon: '0 0 8px #4ade8066',
    Rare: '0 0 12px #60a5fa88',
    Epic: '0 0 16px #c084fc99',
    Legendary: '0 0 20px #fbbf24aa',
    Mythic: '0 0 24px #e879f9, 0 0 48px #818cf8',
  }
  return glows[rarity] ?? 'none'
}

export function rarityEmoji(rarity: Rarity): string {
  const emojis: Record<Rarity, string> = {
    Common: '⬜',
    Uncommon: '🟩',
    Rare: '🟦',
    Epic: '🟪',
    Legendary: '🟨',
    Mythic: '🌈',
  }
  return emojis[rarity] ?? '⬜'
}

export function slimeEmoji(id: SlimeId): string {
  // Generate a consistent emoji from the slime's element/zone
  const def = getSlime(id)
  if (!def) return '🟢'
  const elementEmojis: Record<string, string> = {
    Earth: '🟤', Water: '🔵', Wind: '🌬️', Nature: '🌿',
    Mineral: '💎', Light: '✨', Sound: '🔊',
    Fire: '🔥', Volcanic: '🌋',
    Ice: '❄️', Cold: '🧊',
    Toxin: '☠️', Fungal: '🍄',
    Cosmic: '⭐', Void: '🌑', Gravity: '🌀',
    Steam: '💨', Chaos: '🌈',
  }
  return elementEmojis[def.element] ?? '🟢'
}

export function formatNumber(n: number): string {
  if (n < 1000) return n.toFixed(n < 10 ? 1 : 0)
  if (n < 1_000_000) return (n / 1000).toFixed(1) + 'K'
  if (n < 1_000_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n < 1_000_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B'
  return (n / 1_000_000_000_000).toFixed(2) + 'T'
}

export function formatTime(ms: number): string {
  const s = Math.ceil(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}m ${rem}s`
}
