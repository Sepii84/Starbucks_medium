"use client";

import { useEffect, useRef, useState } from "react";

type UseHideOnScrollOptions = {
  threshold?: number;
  delta?: number;
  disabled?: boolean;
};

export function useHideOnScroll({
  threshold = 96,
  delta = 8,
  disabled = false
}: UseHideOnScrollOptions = {}) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    if (disabled) {
      setHidden(false);
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches) {
      setHidden(false);
      return;
    }

    lastScrollY.current = window.scrollY;

    function update() {
      const currentY = window.scrollY;
      const difference = currentY - lastScrollY.current;

      if (currentY < threshold) {
        setHidden(false);
      } else if (Math.abs(difference) > delta) {
        setHidden(difference > 0);
        lastScrollY.current = currentY;
      }

      ticking.current = false;
    }

    function onScroll() {
      if (!ticking.current) {
        window.requestAnimationFrame(update);
        ticking.current = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, [delta, disabled, threshold]);

  return hidden;
}
