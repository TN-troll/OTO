import { useEffect, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';

/**
 * NProgress-style loading bar at the top of the viewport.
 * Shows when React Query is fetching data.
 */
export function LoadingBar() {
  const isFetching = useIsFetching();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isFetching > 0) {
      setVisible(true);
      setProgress(20);

      const timer1 = setTimeout(() => setProgress(45), 300);
      const timer2 = setTimeout(() => setProgress(65), 600);
      const timer3 = setTimeout(() => setProgress(80), 1200);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    } else {
      setProgress(100);
      const hideTimer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 400);
      return () => clearTimeout(hideTimer);
    }
  }, [isFetching]);

  if (!visible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5">
      <div
        className="h-full bg-gradient-to-r from-brand-accent via-primary-400 to-brand-accent shadow-[0_0_10px_rgba(201,123,74,0.5)] transition-all duration-300 ease-smooth"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}
