import { getState, setState } from '../game/state'
import { exportSave, importSave, deleteSave, saveGame } from '../game/save'

export function renderSettings(container: HTMLElement, onBack: () => void): void {
  container.innerHTML = `
    <div class="topbar">
      <button class="btn btn--secondary" id="back-btn" style="width:auto;flex:0">← Back</button>
      <div style="font-weight:700">Settings</div>
      <div></div>
    </div>
    <div class="settings">
      <div class="settings__section">
        <div class="settings__section-title">Audio</div>
        <div class="setting-row">
          <span class="setting-row__label">Sound Effects</span>
          <div class="toggle" id="toggle-sound" role="switch" aria-checked="true" tabindex="0"></div>
        </div>
        <div class="setting-row">
          <span class="setting-row__label">Music</span>
          <div class="toggle" id="toggle-music" role="switch" aria-checked="true" tabindex="0"></div>
        </div>
      </div>

      <div class="settings__section">
        <div class="settings__section-title">Accessibility</div>
        <div class="setting-row">
          <span class="setting-row__label">Reduce Motion</span>
          <div class="toggle" id="toggle-motion" role="switch" tabindex="0"></div>
        </div>
        <div class="setting-row">
          <span class="setting-row__label">High Contrast</span>
          <div class="toggle" id="toggle-contrast" role="switch" tabindex="0"></div>
        </div>
        <div class="setting-row">
          <span class="setting-row__label">Large Text</span>
          <div class="toggle" id="toggle-text" role="switch" tabindex="0"></div>
        </div>
      </div>

      <div class="settings__section">
        <div class="settings__section-title">Data</div>
        <div class="setting-row">
          <span class="setting-row__label">Export Save</span>
          <button class="btn btn--secondary" id="export-btn" style="flex:0;padding:6px 12px">Export</button>
        </div>
        <div class="setting-row">
          <span class="setting-row__label">Import Save</span>
          <button class="btn btn--secondary" id="import-btn" style="flex:0;padding:6px 12px">Import</button>
        </div>
        <div class="setting-row">
          <span class="setting-row__label" style="color:var(--rarity-rare)">Delete Save</span>
          <button class="btn btn--secondary" id="delete-btn" style="flex:0;padding:6px 12px;border-color:var(--rarity-rare);color:var(--rarity-rare)">Delete</button>
        </div>
      </div>

      <div style="text-align:center;font-size:var(--font-size-xs);color:var(--color-text-muted);padding:16px">
        Idle Slime v0.1.0
      </div>
    </div>
  `

  container.querySelector('#back-btn')?.addEventListener('click', onBack)

  const state = getState()

  function makeToggle(id: string, key: keyof typeof state, appClass?: string) {
    const el = container.querySelector(`#${id}`) as HTMLElement
    if (!el) return
    const update = () => {
      const val = getState()[key] as boolean
      el.classList.toggle('on', val)
      el.setAttribute('aria-checked', String(val))
      if (appClass) document.getElementById('app')?.classList.toggle(appClass, val)
    }
    update()
    el.addEventListener('click', () => {
      setState(s => { (s[key] as boolean) = !(s[key] as boolean) })
      update()
    })
    el.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') el.click()
    })
  }

  makeToggle('toggle-sound', 'soundEnabled')
  makeToggle('toggle-music', 'musicEnabled')
  makeToggle('toggle-motion', 'reduceMotion', 'reduce-motion')
  makeToggle('toggle-contrast', 'highContrast', 'high-contrast')
  makeToggle('toggle-text', 'largeText', 'large-text')

  container.querySelector('#export-btn')?.addEventListener('click', () => {
    saveGame(getState())
    const data = exportSave()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'idle-slime-save.json'
    a.click()
    URL.revokeObjectURL(url)
  })

  container.querySelector('#import-btn')?.addEventListener('click', () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const data = ev.target?.result as string
        const ok = importSave(data)
        alert(ok ? 'Save imported successfully!' : 'Failed to import save file.')
      }
      reader.readAsText(file)
    }
    input.click()
  })

  container.querySelector('#delete-btn')?.addEventListener('click', () => {
    const row = container.querySelector('#delete-btn')!.parentElement!
    if (row.querySelector('#delete-confirm')) return
    const confirm = document.createElement('div')
    confirm.id = 'delete-confirm'
    confirm.style.cssText = 'display:flex;gap:8px;margin-top:8px;align-items:center'
    confirm.innerHTML = `
      <span style="font-size:var(--font-size-xs);color:var(--rarity-rare);flex:1">Really delete everything?</span>
      <button class="btn btn--secondary" id="delete-yes" style="flex:0;padding:6px 12px;border-color:var(--rarity-rare);color:var(--rarity-rare)">Yes, delete</button>
      <button class="btn btn--secondary" id="delete-no" style="flex:0;padding:6px 12px">Cancel</button>
    `
    row.appendChild(confirm)
    confirm.querySelector('#delete-yes')?.addEventListener('click', () => { deleteSave(); location.reload() })
    confirm.querySelector('#delete-no')?.addEventListener('click', () => confirm.remove())
  })
}
