// Simple screen router — no re-renders, just CSS transitions
export type ScreenId = 'main' | 'slimepedia' | 'breed-lab' | 'upgrades' | 'zone-map' | 'settings' | 'pedia-entry'

const _screens = new Map<ScreenId, HTMLElement>()
let _currentScreen: ScreenId = 'main'
let _history: ScreenId[] = ['main']

export function registerScreen(id: ScreenId, el: HTMLElement): void {
  _screens.set(id, el)
}

export function navigateTo(id: ScreenId): void {
  const current = _screens.get(_currentScreen)
  const next = _screens.get(id)
  if (!next || id === _currentScreen) return

  if (current) {
    current.classList.remove('active')
    current.classList.add('slide-left')
    setTimeout(() => current.classList.remove('slide-left'), 300)
  }

  next.classList.add('active')
  _history.push(id)
  _currentScreen = id

  // Dispatch event so screens can refresh their content
  window.dispatchEvent(new CustomEvent('screen-change', { detail: { screen: id } }))
}

export function navigateBack(): void {
  if (_history.length <= 1) return
  _history.pop()
  const prevId = _history[_history.length - 1]

  const current = _screens.get(_currentScreen)
  const prev = _screens.get(prevId)
  if (!prev) return

  if (current) {
    current.classList.remove('active')
  }

  prev.classList.add('active')
  _currentScreen = prevId

  window.dispatchEvent(new CustomEvent('screen-change', { detail: { screen: prevId } }))
}

export function getCurrentScreen(): ScreenId {
  return _currentScreen
}
