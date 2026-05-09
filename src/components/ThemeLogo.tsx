import logoLight from "@/assets/tiikme-lockup.svg";
import logoDark from "@/assets/tiikme-lockup-dark.svg";

interface ThemeLogoProps {
  className?: string;
  alt?: string;
  /** "light" = orange wordmark for light backgrounds; "dark" = white wordmark for dark backgrounds */
  variant?: "light" | "dark";
}

const ThemeLogo = ({ className = "h-10 w-auto", alt = "Tiikme", variant = "light" }: ThemeLogoProps) => {
  const src = variant === "dark" ? logoDark : logoLight;
  return <img src={src} alt={alt} className={className} width={160} height={36} />;
};

export default ThemeLogo;
