import confetti from 'canvas-confetti';

const CHEERFUL_COLORS = ['#F59E0B', '#10B981', '#F43F5E', '#3B82F6', '#8B5CF6', '#FCD34D', '#34D399'];

/**
 * Trigger a cheerful energetic confetti burst at a specific origin or screen center
 */
export function fireTaskConfetti(origin?: { x: number; y: number }): void {
  try {
    confetti({
      particleCount: 50,
      spread: 70,
      origin: origin || { x: 0.5, y: 0.6 },
      colors: CHEERFUL_COLORS,
      disableForReducedMotion: true,
      startVelocity: 30,
      gravity: 0.9,
      scalar: 0.9,
      ticks: 180,
    });
  } catch (e) {
    console.warn('Confetti error:', e);
  }
}

/**
 * Grand celebration fireworks when achieving 100% or clearing all tasks
 */
export function fireSuperConfetti(): void {
  try {
    const end = Date.now() + 1800;

    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      if (Date.now() > end) {
        return clearInterval(interval);
      }

      confetti({
        startVelocity: 35,
        spread: 360,
        ticks: 200,
        origin: {
          x: Math.random() * 0.6 + 0.2,
          y: Math.random() * 0.4 + 0.2,
        },
        colors: CHEERFUL_COLORS,
        particleCount: 40,
        scalar: 1.1,
      });
    }, 250);
  } catch (e) {
    console.warn('Super confetti error:', e);
  }
}
