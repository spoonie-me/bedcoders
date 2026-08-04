import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Form state that survives a closed tab, a crash, or a day that ended early.
 *
 * Every multi-field form in the hiring flow uses this. The reason is specific
 * to who uses this platform: a learner who starts writing a portfolio entry
 * and has to stop mid-sentence should not come back to an empty box. Losing
 * work is not a minor annoyance when the work cost real energy to produce.
 *
 * Drafts are namespaced per form and cleared explicitly on successful submit.
 */
export function useDraft<T extends object>(
  key: string,
  initial: T,
): [T, (patch: Partial<T> | ((prev: T) => T)) => void, () => void, boolean] {
  const storageKey = `srs_draft_${key}`;

  // Read synchronously on first render so the restored value is the first
  // thing painted — no flash of empty inputs before a effect fills them in.
  const [restored, setRestored] = useState(false);
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return initial;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return { ...initial, ...parsed };
    } catch {
      /* corrupt draft — fall through to the clean initial value */
    }
    return initial;
  });

  const hadDraftOnMount = useRef<boolean | null>(null);
  if (hadDraftOnMount.current === null) {
    hadDraftOnMount.current = (() => {
      try {
        return localStorage.getItem(storageKey) !== null;
      } catch {
        return false;
      }
    })();
  }

  useEffect(() => {
    if (hadDraftOnMount.current) setRestored(true);
  }, []);

  const update = useCallback(
    (patch: Partial<T> | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* storage full or blocked — the form still works, it just won't persist */
        }
        return next;
      });
      setRestored(false);
    },
    [storageKey],
  );

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* nothing to clean up */
    }
    setValue(initial);
    setRestored(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  return [value, update, clear, restored];
}
