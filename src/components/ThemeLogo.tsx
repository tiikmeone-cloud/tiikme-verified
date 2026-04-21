import logoLight from "@/assets/tiikme-logo-light.png";

interface ThemeLogoProps {
  className?: string;
  alt?: string;
}

const ThemeLogo = ({ className = "h-10 w-auto", alt = "Tiikme" }: ThemeLogoProps) => {
  return <img src={logoLight} alt={alt} className={className} width={160} height={40} />;
};

export default ThemeLogo;
