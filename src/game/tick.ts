import { getState, setState } from './state'
import { computeTotalProduction, gooPerTap } from './economy'
import { tickBreedSlots } from './breeds'
import { emitTap } from './events'
import { SAVE_INTERVAL_MS } from '../data/config'
import { saveGame } from './save'
import { getAllSlimes } from './slimes'

// ---------------------------------------------------------------------------
// Production tick — every 100ms
// ---------------------------------------------------------------------------

let productionInterval: ReturnType<typeof setInterval> | null = null

export function startProductionTick(): void {
  if (productionInterval) return
  productionInterval = setInterval(() => {
    const state = getState()
    const production = computeTotalProduction(state)
    const delta = production * 0.1  // 100ms = 0.1s

    setState(s => { s.goo += delta })

    tickBreedSlots()
    tickZoneGooSecret()
  }, 100)
}

export function stopProductionTick(): void {
  if (productionInterval) {
    clearInterval(productionInterval)
    productionInterval = null
  }
}

// ---------------------------------------------------------------------------
// Auto-save tick
// ---------------------------------------------------------------------------

let saveInterval: ReturnType<typeof setInterval> | null = null

export function startAutoSave(): void {
  if (saveInterval) return
  saveInterval = setInterval(() => {
    saveGame(getState())
  }, SAVE_INTERVAL_MS)
}

// ---------------------------------------------------------------------------
// Tap handler
// ---------------------------------------------------------------------------

export function handleTap(): void {
  const state = getState()
  const earned = gooPerTap(state)
  setState(s => { s.goo += earned })
  emitTap(earned)
  tickTapSecrets()
}

// ---------------------------------------------------------------------------
// Zone secrets: tap-based and goo-threshold
// ---------------------------------------------------------------------------

let consecutiveTaps = 0
let lastTapTarget: string | null = null

function tickTapSecrets(): void {
  const state = getState()

  // Zone tap secret
  const secret = state.zoneSecrets.find(
    s => s.zoneId === state.activeZone &&
         s.triggerType === 'TAP_N_TIMES' &&
         !s.completed
  )
  if (!secret) return

  setState(s => {
    const sec = s.zoneSecrets.find(
      z => z.zoneId === s.activeZone && z.triggerType === 'TAP_N_TIMES' && !z.completed
    )
    if (!sec) return
    sec.progress += 1
    if (sec.progress >= sec.target) {
      sec.completed = true
      import('./zones').then(({ awardSecretSlime }) => awardSecretSlime(sec.resultSlimeId))
    }
  })
}

function tickZoneGooSecret(): void {
  const state = getState()
  const secret = state.zoneSecrets.find(
    s => s.zoneId === state.activeZone &&
         s.triggerType === 'REACH_GOO_THRESHOLD' &&
         !s.completed
  )
  if (!secret) return
  if (state.goo >= secret.target) {
    setState(s => {
      const sec = s.zoneSecrets.find(
        z => z.zoneId === s.activeZone && z.triggerType === 'REACH_GOO_THRESHOLD' && !z.completed
      )
      if (!sec) return
      sec.progress = sec.target
      sec.completed = true
    })
    import('./zones').then(({ awardSecretSlime }) => awardSecretSlime(secret.resultSlimeId))
  }
}

// ---------------------------------------------------------------------------
// Ice-type slime secret (Zone 4)
// ---------------------------------------------------------------------------

export function checkIceSlimeSecret(): void {
  const state = getState()
  const secret = state.zoneSecrets.find(
    s => s.zoneId === 4 && s.triggerType === 'HAVE_N_TYPE_SLIMES' && !s.completed
  )
  if (!secret) return

  const iceCount = Object.values(state.collection).filter(owned => {
    const def = import('./slimes').then(m => m.getSlime(owned.id))
    return false // async — handled in UI layer on collection change
  }).length

  // This check is performed from the UI after any summon/breed event
}

export function checkIceSlimeSecretSync(state: typeof getState extends () => infer S ? S : never): void {
  const secret = state.zoneSecrets.find(
    s => s.zoneId === 4 && s.triggerType === 'HAVE_N_TYPE_SLIMES' && !s.completed
  )
  if (!secret) return

  const allDefs = getAllSlimes()
  const defMap = new Map(allDefs.map(d => [d.id, d]))
  const iceSlimes = Object.values(state.collection).filter(owned => {
    const def = defMap.get(owned.id)
    return def?.element.includes('Ice') && owned.count > 0
  })

  if (iceSlimes.length >= secret.target) {
    setState(s => {
      const sec = s.zoneSecrets.find(z => z.zoneId === 4 && z.triggerType === 'HAVE_N_TYPE_SLIMES' && !z.completed)
      if (!sec) return
      sec.progress = sec.target
      sec.completed = true
    })
    import('./zones').then(({ awardSecretSlime }) => awardSecretSlime(secret.resultSlimeId))
  }
}
