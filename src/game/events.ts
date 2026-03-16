/**
 * Simple event bus for cross-module communication.
 * Keeps modules decoupled — UI listens for game events without circular imports.
 */

import type { SlimeId } from './types'

type EventMap = {
  discovery: SlimeId          // new slime species found
  levelUp: SlimeId            // slime leveled up
  merge: SlimeId              // merge produced a new slime
  breedComplete: SlimeId      // breed slot finished
  zoneUnlock: number          // zone unlocked
  tap: number                 // goo earned from tap
}

type Handler<K extends keyof EventMap> = (payload: EventMap[K]) => void
type AnyHandler = Handler<keyof EventMap>

const listeners = new Map<keyof EventMap, Set<AnyHandler>>()

export function on<K extends keyof EventMap>(event: K, handler: Handler<K>): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set())
  listeners.get(event)!.add(handler as AnyHandler)
  return () => listeners.get(event)?.delete(handler as AnyHandler)
}

export function emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
  listeners.get(event)?.forEach(h => h(payload as never))
}

// Convenience helpers
export const emitDiscovery = (id: SlimeId) => emit('discovery', id)
export const emitLevelUp   = (id: SlimeId) => emit('levelUp', id)
export const emitMerge     = (id: SlimeId) => emit('merge', id)
export const emitBreed     = (id: SlimeId) => emit('breedComplete', id)
export const emitZoneUnlock = (zone: number) => emit('zoneUnlock', zone)
export const emitTap       = (goo: number) => emit('tap', goo)
