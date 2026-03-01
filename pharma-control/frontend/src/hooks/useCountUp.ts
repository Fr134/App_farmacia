import { useState, useEffect, useRef } from "react";

/**
 * Animate a numeric value from 0 to `target` over `duration` ms.
 * Returns the current animated value.
 */
export function useCountUp(target: number, duration: number = 800): number {
  const [current, setCurrent] = useState(0);
  const prevTarget = useRef(target);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const from = prevTarget.current === target ? 0 : prevTarget.current;
    prevTarget.current = target;

    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(from + (target - from) * eased);

      if (progress < 1) {
        rafId.current = requestAnimationFrame(tick);
      }
    }

    rafId.current = requestAnimationFrame(tick);

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [target, duration]);

  return current;
}
