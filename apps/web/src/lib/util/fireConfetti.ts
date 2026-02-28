import confetti from 'canvas-confetti'

export function fireConfetti(duration = 0.1) {
  var end = Date.now() + duration * 1000
  ;(function frame() {
    confetti({
      particleCount: 20,
      angle: 270,
      spread: 225,
      gravity: 0.7,
      scalar: 1.7,
      zIndex: 10000,
      ticks: 100,
      startVelocity: 25,
      origin: { x: 0.2, y: -0.1 },
    })
    confetti({
      particleCount: 20,
      angle: 270,
      gravity: 0.2,
      spread: 225,
      scalar: 1.7,
      ticks: 100,
      startVelocity: 25,
      zIndex: 10000,
      origin: { x: 0.4, y: -0.1 },
    })
    confetti({
      particleCount: 20,
      angle: 270,
      gravity: 0.7,
      ticks: 100,
      spread: 225,
      scalar: 1.7,
      startVelocity: 25,
      zIndex: 10000,
      origin: { x: 0.6, y: -0.1 },
    })
    confetti({
      particleCount: 20,
      angle: 270,
      ticks: 100,
      gravity: 0.22,
      spread: 225,
      scalar: 1.7,
      startVelocity: 25,
      zIndex: 10000,
      origin: { x: 0.8, y: -0.1 },
    })
    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  })()
}
