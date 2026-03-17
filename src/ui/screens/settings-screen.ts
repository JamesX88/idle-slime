// Settings screen
import { getState, setState, initState } from '../../game/state'
import { saveGame, deleteSave, exportSave, importSave } from '../../game/save'
import { stopGameLoop } from '../../game/tick'
import { navigateBack } from '../router'
import { showNotif } from '../components/notif'
import { GAME_VERSION } from '../../data/config'

export function buildSettingsScreen(container: HTMLElement): void {
  container.innerHTML = `
    <div class="screen-header">
      <button class="back-btn" id="settings-back">←</button>
      <div class="screen-header__title">Settings</div>
    </div>

    <div class="scroll-content">

      <div class="settings-section">
        <div class="settings-section__title">Audio</div>

        <div class="settings-row">
          <div>
            <div class="settings-row__label">Sound Effects</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="sfx-toggle" />
            <span class="toggle__track"></span>
          </label>
        </div>

        <div class="settings-row">
          <div>
            <div class="settings-row__label">Music</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="music-toggle" />
            <span class="toggle__track"></span>
          </label>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section__title">Accessibility</div>

        <div class="settings-row">
          <div>
            <div class="settings-row__label">Reduce Motion</div>
            <div class="settings-row__sub">Disables animations and transitions</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="motion-toggle" />
            <span class="toggle__track"></span>
          </label>
        </div>

        <div class="settings-row">
          <div>
            <div class="settings-row__label">High Contrast</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="contrast-toggle" />
            <span class="toggle__track"></span>
          </label>
        </div>

        <div class="settings-row">
          <div>
            <div class="settings-row__label">Large Text</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="text-toggle" />
            <span class="toggle__track"></span>
          </label>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section__title">Save Data</div>

        <div class="settings-row">
          <div>
            <div class="settings-row__label">Export Save</div>
            <div class="settings-row__sub">Copy save code to clipboard</div>
          </div>
          <button class="btn btn--secondary btn--sm" id="export-btn">Export</button>
        </div>

        <div class="settings-row">
          <div>
            <div class="settings-row__label">Import Save</div>
            <div class="settings-row__sub">Paste save code to restore</div>
          </div>
          <button class="btn btn--secondary btn--sm" id="import-btn">Import</button>
        </div>

        <div class="settings-row">
          <div>
            <div class="settings-row__label">Force Save</div>
            <div class="settings-row__sub">Save now (auto-saves every 30s)</div>
          </div>
          <button class="btn btn--secondary btn--sm" id="save-btn">Save Now</button>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section__title">Danger Zone</div>

        <div class="settings-row">
          <div>
            <div class="settings-row__label" style="color:var(--color-danger)">Delete Save</div>
            <div class="settings-row__sub">Permanently wipes all progress</div>
          </div>
          <button class="btn btn--danger btn--sm" id="delete-btn">Delete</button>
        </div>

        <div id="delete-confirm" style="display:none;padding:12px 0">
          <div style="font-size:var(--font-size-sm);color:var(--color-danger);margin-bottom:12px">
            ⚠️ This will permanently delete all your slimes, upgrades, and progress. Are you sure?
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn--danger" id="delete-confirm-yes" style="flex:1">Yes, Delete Everything</button>
            <button class="btn btn--secondary" id="delete-confirm-no" style="flex:1">Cancel</button>
          </div>
        </div>
      </div>

      <div style="padding:16px;text-align:center;color:var(--color-text-dim);font-size:var(--font-size-xs)">
        Idle Slime v${GAME_VERSION}
      </div>

    </div>
  `

  const state = getState()

  // Initialize toggles
  const sfxToggle = container.querySelector('#sfx-toggle') as HTMLInputElement
  const musicToggle = container.querySelector('#music-toggle') as HTMLInputElement
  const motionToggle = container.querySelector('#motion-toggle') as HTMLInputElement
  const contrastToggle = container.querySelector('#contrast-toggle') as HTMLInputElement
  const textToggle = container.querySelector('#text-toggle') as HTMLInputElement

  sfxToggle.checked = state.sfxEnabled
  musicToggle.checked = state.musicEnabled
  motionToggle.checked = state.reduceMotion
  contrastToggle.checked = state.highContrast
  textToggle.checked = state.largeText

  sfxToggle.addEventListener('change', () => {
    setState(s => { s.sfxEnabled = sfxToggle.checked })
  })

  musicToggle.addEventListener('change', () => {
    setState(s => { s.musicEnabled = musicToggle.checked })
  })

  motionToggle.addEventListener('change', () => {
    setState(s => { s.reduceMotion = motionToggle.checked })
    document.body.classList.toggle('reduce-motion', motionToggle.checked)
  })

  contrastToggle.addEventListener('change', () => {
    setState(s => { s.highContrast = contrastToggle.checked })
    document.body.classList.toggle('high-contrast', contrastToggle.checked)
  })

  textToggle.addEventListener('change', () => {
    setState(s => { s.largeText = textToggle.checked })
    document.body.classList.toggle('large-text', textToggle.checked)
  })

  // Back
  container.querySelector('#settings-back')!.addEventListener('click', () => navigateBack())

  // Export
  container.querySelector('#export-btn')!.addEventListener('click', () => {
    const code = exportSave(getState())
    navigator.clipboard.writeText(code).then(() => {
      showNotif('Save code copied to clipboard!')
    }).catch(() => {
      prompt('Copy your save code:', code)
    })
  })

  // Import
  container.querySelector('#import-btn')!.addEventListener('click', () => {
    const code = prompt('Paste your save code:')
    if (!code) return
    const loaded = importSave(code)
    if (loaded) {
      initState(loaded)
      showNotif('Save imported! Reloading...')
      setTimeout(() => location.reload(), 1000)
    } else {
      showNotif('Invalid save code.')
    }
  })

  // Force save
  container.querySelector('#save-btn')!.addEventListener('click', () => {
    saveGame(getState())
    showNotif('Game saved!')
  })

  // Delete — show confirm
  container.querySelector('#delete-btn')!.addEventListener('click', () => {
    const confirm = container.querySelector('#delete-confirm') as HTMLElement
    confirm.style.display = 'block'
  })

  container.querySelector('#delete-confirm-no')!.addEventListener('click', () => {
    const confirm = container.querySelector('#delete-confirm') as HTMLElement
    confirm.style.display = 'none'
  })

  container.querySelector('#delete-confirm-yes')!.addEventListener('click', () => {
    // Stop the game loop FIRST to remove beforeunload/visibilitychange listeners
    // that would re-save the game immediately after deletion
    stopGameLoop()
    deleteSave()
    location.reload()
  })
}
