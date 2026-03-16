// Notification banner — auto-dismiss
let _banner: HTMLElement | null = null
let _dismissTimer: number | null = null

export function initNotifBanner(container: HTMLElement): void {
  _banner = document.createElement('div')
  _banner.className = 'notif-banner'
  container.appendChild(_banner)
}

export function showNotif(text: string, durationMs = 2500): void {
  if (!_banner) return
  if (_dismissTimer !== null) clearTimeout(_dismissTimer)

  _banner.textContent = text
  _banner.classList.add('show')

  _dismissTimer = window.setTimeout(() => {
    _banner!.classList.remove('show')
    _dismissTimer = null
  }, durationMs)
}
