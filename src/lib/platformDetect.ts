import {
  Linkedin, Twitter, Youtube, Instagram, Github, Smartphone,
  BookOpen, Droplets, Palette, Figma, FileText, MessageCircle,
  Send, Globe, type LucideIcon
} from "lucide-react";

export interface PlatformInfo {
  name: string;
  icon: LucideIcon;
  color: string;
}

const PLATFORM_MAP: Record<string, PlatformInfo> = {
  "linkedin.com": { name: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
  "twitter.com": { name: "X (Twitter)", icon: Twitter, color: "#000000" },
  "x.com": { name: "X", icon: Twitter, color: "#000000" },
  "youtube.com": { name: "YouTube", icon: Youtube, color: "#FF0000" },
  "instagram.com": { name: "Instagram", icon: Instagram, color: "#E4405F" },
  "github.com": { name: "GitHub", icon: Github, color: "#181717" },
  "play.google.com": { name: "Play Store", icon: Smartphone, color: "#34A853" },
  "medium.com": { name: "Medium", icon: BookOpen, color: "#000000" },
  "dribbble.com": { name: "Dribbble", icon: Droplets, color: "#EA4C89" },
  "behance.net": { name: "Behance", icon: Palette, color: "#1769FF" },
  "figma.com": { name: "Figma", icon: Figma, color: "#F24E1E" },
  "notion.so": { name: "Notion", icon: FileText, color: "#000000" },
  "wa.me": { name: "WhatsApp", icon: MessageCircle, color: "#25D366" },
  "whatsapp.com": { name: "WhatsApp", icon: MessageCircle, color: "#25D366" },
  "telegram.org": { name: "Telegram", icon: Send, color: "#26A5E4" },
  "t.me": { name: "Telegram", icon: Send, color: "#26A5E4" },
};

export function detectPlatform(url: string): PlatformInfo {
  try {
    const hostname = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
    // Check exact match first, then partial
    for (const [domain, info] of Object.entries(PLATFORM_MAP)) {
      if (hostname === domain || hostname.endsWith(`.${domain}`)) return info;
    }
    // Fallback: extract domain name
    const parts = hostname.split(".");
    const name = parts.length >= 2 ? parts[parts.length - 2] : hostname;
    return { name: name.charAt(0).toUpperCase() + name.slice(1), icon: Globe, color: "#6B7094" };
  } catch {
    return { name: "Link", icon: Globe, color: "#6B7094" };
  }
}
