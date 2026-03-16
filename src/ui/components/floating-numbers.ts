// Object-pooled floating +Goo numbers
const POOL_SIZE = 20
const pool: HTMLElement[] = []
let poolIdx = 0

export function initFloatingNumbers(container: HTMLElement): void {
  for (let i = 0; i < POOL_SIZE; i++) {
    const el = document.createElement('div')
    el.className = 'floating-number'
    el.style.display = 'none'
    container.appendChild(el)
    pool.push(el)
  }
}

export function spawnFloatingNumber(text: string, x: number, y: number): void {
  const el = pool[poolIdx % POOL_SIZE]
  poolIdx++

  el.textContent = text
  el.style.display = 'block'
  el.style.left = `${x - 20}px`
  el.style.top = `${y - 20}px`
  el.style.animation = 'none'

  // Force reflow to restart animation
  void el.offsetWidth
  el.style.animation = 'float-up 0.8s ease-out forwards'

  setTimeout(() => {
    el.style.display = 'none'
  }, 800)
}
