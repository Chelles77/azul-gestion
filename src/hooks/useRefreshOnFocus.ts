import { useEffect } from 'react';

export function useRefreshOnFocus(onFocus: () => void) {
  useEffect(() => {
    // Listen for visibility changes (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        onFocus();
      }
    };

    // Listen for page focus
    const handleFocus = () => {
      onFocus();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [onFocus]);
}
