import { useState, useEffect } from "react";
import { Eye, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Flick {
  id: string;
  image_url: string;
  like_count: number;
  view_count: number;
  created_at: string;
}

interface Props {
  profileId: string;
  isOwnProfile: boolean;
}

export default function ProfileFlicksSection({ profileId, isOwnProfile }: Props) {
  const navigate = useNavigate();
  const [flicks, setFlicks] = useState<Flick[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase
      .from("flicks" as any)
      .select("id, image_url, like_count, view_count, created_at")
      .eq("author_id", profileId)
      .order("created_at", { ascending: false })
      .limit(12) as any)
      .then(({ data }: { data: Flick[] | null }) => {
        setFlicks(data || []);
        setLoading(false);
      });
  }, [profileId]);

  if (loading) return null;
  if (flicks.length === 0) {
    if (!isOwnProfile) return null;
    return (
      <div style={{ marginTop: 4, padding: "20px 0", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "var(--text-3)" }}>No Flicks posted yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 4,
        }}
      >
        {flicks.map(flick => (
          <div
            key={flick.id}
            onClick={() => navigate("/app/flicks", { state: { startFlickId: flick.id } })}
            style={{
              position: "relative",
              aspectRatio: "9/16",
              overflow: "hidden",
              borderRadius: 10,
              cursor: "pointer",
              background: "var(--surface-2)",
            }}
          >
            <img
              src={flick.image_url}
              alt=""
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            {/* Stats bar for owner */}
            {isOwnProfile && (
              <div
                style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.70) 0%, transparent 50%)",
                  display: "flex", alignItems: "flex-end",
                  padding: "6px 8px",
                  gap: 8,
                }}
              >
                <div className="flex items-center" style={{ gap: 3 }}>
                  <Eye style={{ width: 11, height: 11, color: "#fff" }} />
                  <span style={{ fontSize: 10, color: "#fff", fontWeight: 600 }}>
                    {flick.view_count >= 1000 ? `${(flick.view_count/1000).toFixed(1)}k` : flick.view_count}
                  </span>
                </div>
                <div className="flex items-center" style={{ gap: 3 }}>
                  <Heart style={{ width: 11, height: 11, color: "#FF453A" }} />
                  <span style={{ fontSize: 10, color: "#fff", fontWeight: 600 }}>
                    {flick.like_count >= 1000 ? `${(flick.like_count/1000).toFixed(1)}k` : flick.like_count}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {isOwnProfile && (
        <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8, textAlign: "center" }}>
          Tap a Flick to open the reel
        </p>
      )}
    </div>
  );
}
