import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProfileSearchResult {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  role: string | null;
  institution_name: string | null;
  headline: string | null;
  is_verified: boolean | null;
}

export function useProfileSearch(query: string, excludeSelf = true) {
  const { user } = useAuth();
  const [results, setResults] = useState<ProfileSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const q = query.trim();

      let queryBuilder = supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, role, institution_name, headline, is_verified")
        .or(`full_name.ilike.%${q}%,username.ilike.%${q}%,institution_name.ilike.%${q}%`)
        .not("full_name", "is", null)
        .limit(10);

      if (excludeSelf && user?.id) {
        queryBuilder = queryBuilder.neq("id", user.id);
      }

      const { data, error } = await queryBuilder;
      if (!error) setResults(data || []);
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, user?.id, excludeSelf]);

  return { results, searching };
}
