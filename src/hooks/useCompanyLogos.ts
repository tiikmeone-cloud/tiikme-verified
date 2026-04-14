import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LogoResult {
  logo_url: string | null;
  slug?: string;
}

/**
 * Hook to look up company/institution logos from organizations and pages tables.
 * Caches results in a ref map to avoid repeated queries.
 */
export function useCompanyLogos() {
  const cache = useRef<Map<string, LogoResult | null>>(new Map());
  const [logos, setLogos] = useState<Record<string, LogoResult | null>>({});
  const pending = useRef<Set<string>>(new Set());

  const lookup = useCallback(async (companyName: string) => {
    if (!companyName) return null;
    const key = companyName.trim().toLowerCase();
    if (cache.current.has(key)) return cache.current.get(key) || null;
    if (pending.current.has(key)) return null;

    pending.current.add(key);

    try {
      // Search organizations first
      const { data: org } = await supabase
        .from("organizations")
        .select("logo_url, slug")
        .ilike("name", key)
        .limit(1)
        .maybeSingle();

      if (org?.logo_url) {
        const result: LogoResult = { logo_url: org.logo_url, slug: org.slug };
        cache.current.set(key, result);
        setLogos(prev => ({ ...prev, [key]: result }));
        pending.current.delete(key);
        return result;
      }

      // Search pages table
      const { data: page } = await supabase
        .from("pages")
        .select("logo_url, slug")
        .ilike("name", key)
        .limit(1)
        .maybeSingle();

      if (page?.logo_url) {
        const result: LogoResult = { logo_url: page.logo_url, slug: page.slug };
        cache.current.set(key, result);
        setLogos(prev => ({ ...prev, [key]: result }));
        pending.current.delete(key);
        return result;
      }

      cache.current.set(key, null);
      setLogos(prev => ({ ...prev, [key]: null }));
      pending.current.delete(key);
      return null;
    } catch {
      pending.current.delete(key);
      return null;
    }
  }, []);

  /** Batch lookup multiple company names at once */
  const lookupBatch = useCallback(async (names: string[]) => {
    const unique = [...new Set(names.map(n => n.trim()).filter(Boolean))];
    const uncached = unique.filter(n => !cache.current.has(n.toLowerCase()));
    if (uncached.length === 0) return;

    // Fire all lookups in parallel
    await Promise.allSettled(uncached.map(n => lookup(n)));
  }, [lookup]);

  const getLogo = useCallback((companyName: string): LogoResult | null => {
    if (!companyName) return null;
    return cache.current.get(companyName.trim().toLowerCase()) || null;
  }, []);

  return { lookup, lookupBatch, getLogo, logos };
}
