import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Simple top loading bar that appears briefly whenever the route changes.
 * This improves perceived performance and aligns with WCAG 4.1.3 (status messages)
 * by making navigation progress visible.
 *
 * @returns {JSX.Element | null} Fixed progress bar at the top of the viewport.
 */
export function TopLoadingBar(): JSX.Element | null {
  const location = useLocation();
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    // Restart animation on every pathname change
    setAnimationKey((prev) => prev + 1);
    setIsAnimating(true);
  }, [location.pathname]);

  if (!isAnimating) {
    return null;
  }

  return (
    <div
      key={animationKey}
      className="top-loading-bar"
      aria-hidden="true"
      onAnimationEnd={() => setIsAnimating(false)}
    />
  );
}

