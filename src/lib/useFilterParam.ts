import { useSearchParams } from "react-router-dom";
import { useCallback } from "react";

/**
 * URL-backed filter state. Reads/writes a single URL search param.
 * - Boolean flags: "true"/"false" (absent = false)
 * - Sets: comma-separated values
 * - Single string: as-is
 *
 * Tab state is NOT managed here — tabs use their own useState.
 */
export function useFilterParam(key: string, defaultValue = "") {
  const [params, setParams] = useSearchParams();
  const value = params.get(key) ?? defaultValue;

  const setValue = useCallback((next: string | null) => {
    setParams(prev => {
      const np = new URLSearchParams(prev);
      if (next === null || next === "" || next === defaultValue) np.delete(key);
      else np.set(key, next);
      return np;
    }, { replace: true });
  }, [key, defaultValue, setParams]);

  return [value, setValue] as const;
}

export function useFilterFlag(key: string) {
  const [v, setV] = useFilterParam(key, "");
  return [v === "true", (next: boolean) => setV(next ? "true" : null)] as const;
}

export function useFilterSet(key: string) {
  const [v, setV] = useFilterParam(key, "");
  const set = new Set(v ? v.split(",").filter(Boolean) : []);
  const toggle = (item: string) => {
    const next = new Set(set);
    next.has(item) ? next.delete(item) : next.add(item);
    setV(next.size === 0 ? null : Array.from(next).join(","));
  };
  const clear = () => setV(null);
  return { set, toggle, clear, has: (i: string) => set.has(i) };
}
