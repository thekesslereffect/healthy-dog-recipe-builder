import { useEffect, useState } from 'react';

// Persist a piece of state to localStorage. Starts from `initial` (so server
// and first client render match, avoiding hydration mismatches), then hydrates
// from storage on mount and writes back on change.
export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // Ignore malformed / unavailable storage.
    }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota / unavailable storage.
    }
  }, [key, value, loaded]);

  return [value, setValue, loaded];
}
