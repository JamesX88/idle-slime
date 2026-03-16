import { formatGoo } from '../../game/economy'

interface FloatingNumberPool {
  container: HTMLElement
  pool: HTMLElement[]
}

let _pool: FloatingNumberPool | null = null

export function initFloatingNumbers(container: HTMLElement): void {
  _pool = { container, pool: [] }
}

function getEl(): HTMLElement {
  if (!_pool) return document.createElement('div')
  const reuse = _pool.pool.find(el => !el.parentNode)
  if (reuse) return reuse

  const el = document.createElement('div')
  el.className = 'floating-number'
  el.setAttribute('aria-hidden', 'true')
  _pool.pool.push(el)
  return el
}

export function showFloatingNumber(value: number, x: number, y: number): void {
  if (!_pool) return
  const el = getEl()
  el.textContent = `+${formatGoo(value)}`
  el.style.left = `${x - 20 + (Math.random() - 0.5) * 30}px`
  el.style.top = `${y - 10}px`
  el.style.animation = 'none'
  _pool.container.appendChild(el)

  // Re-trigger animation
  requestAnimationFrame(() => {
    el.style.animation = 'float-up 0.9s ease-out forwards'
    el.addEventListener('animationend', () => {
      el.remove()
    }, { once: true })
  })
}
