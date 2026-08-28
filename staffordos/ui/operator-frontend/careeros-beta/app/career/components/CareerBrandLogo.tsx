import Image from "next/image";

const logoAlt = "CareerOS — Discover, Develop, Advance";

export function CareerBrandLogo({ placement = "auth", priority = false }: { placement?: "auth" | "signup"; priority?: boolean }) {
  return <div className={`careerBrandLogoWrap careerBrandLogoWrap-${placement}`}><Image src="/brand/careeros-logo.png" alt={logoAlt} width={1942} height={809} priority={priority} unoptimized sizes={placement === "signup" ? "(max-width: 640px) 72vw, 420px" : "(max-width: 640px) 64vw, 300px"} className="careerBrandLogo" /></div>;
}
