import logoLight from "@/assets/tiikme-logo-light.png";
import logoDark from "@/assets/tiikme-logo-dark.png";

interface ThemeLogoProps {
  className?: string;
  alt?: string;
}

const ThemeLogo = ({ className = "h-10 w-auto", alt = "Tiikme" }: ThemeLogoProps) => {
  return (
    <>
      <img src={logoLight} alt={alt} className={`${className} block [html[data-theme='dark']_&]:hidden`} />
      <img src={logoDark} alt={alt} className={`${className} hidden [html[data-theme='dark']_&]:block`} />
    </>
  );
};

export default ThemeLogo;
