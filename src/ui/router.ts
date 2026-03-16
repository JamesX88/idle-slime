import { renderMainScreen } from './main-screen'
import { renderSlimepedia } from './slimepedia'
import { renderBreedLab } from './breed-lab'
import { renderUpgradeScreen } from './upgrade-screen'
import { renderZoneMap } from './zone-map'
import { renderSettings } from './settings'

type ScreenId = 'main' | 'slimepedia' | 'breed-lab' | 'upgrades' | 'zone-map' | 'settings'

interface Screen {
  id: ScreenId
  el: HTMLElement
}

const screens = new Map<ScreenId, Screen>()
let activeScreenId: ScreenId = 'main'
let appEl: HTMLElement

export function initRouter(app: HTMLElement): void {
  appEl = app

  const screenIds: ScreenId[] = ['main', 'slimepedia', 'breed-lab', 'upgrades', 'zone-map', 'settings']

  for (const id of screenIds) {
    const el = document.createElement('div')
    el.className = `screen${id === 'main' ? ' main active' : ''}`
    el.id = `screen-${id}`
    el.setAttribute('role', 'main')
    app.appendChild(el)
    screens.set(id, { id, el })
  }

  const mainEl = screens.get('main')!.el
  renderMainScreen(mainEl)

  // Zone map button in topbar (injected after main renders)
  mainEl.querySelector('#zone-name')?.addEventListener('click', () => navigate('zone-map'))
}

export function navigate(to: ScreenId): void {
  if (to === activeScreenId) return

  const current = screens.get(activeScreenId)!
  const next = screens.get(to)!

  // Lazy-render screens on first visit
  if (!next.el.dataset['rendered']) {
    renderScreen(to, next.el)
    next.el.dataset['rendered'] = '1'
  }

  current.el.classList.remove('active')
  next.el.classList.add('active')
  activeScreenId = to
}

function renderScreen(id: ScreenId, el: HTMLElement): void {
  const back = () => navigate('main')

  switch (id) {
    case 'slimepedia': renderSlimepedia(el, back); break
    case 'breed-lab':  renderBreedLab(el, back); break
    case 'upgrades':   renderUpgradeScreen(el, back); break
    case 'zone-map':   renderZoneMap(el, back); break
    case 'settings':   renderSettings(el, back); break
  }
}
