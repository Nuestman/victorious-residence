import Image from "next/image";

import { BRAND_NAME, BRAND_SEAL_SRC } from "@/lib/brand";

type BrandLogoProps = {
  name?: string;
  /** Line under the name (e.g. “Manager portal”). */
  subtitle?: string;
  size?: "xs" | "sm" | "md" | "lg";
  showName?: boolean;
  /** On forest/dark bars, keep a cream disc so the seal corners don’t clash. */
  tone?: "cream" | "forest";
  className?: string;
};

const sizePx = {
  xs: 20,
  sm: 36,
  md: 40,
  lg: 48,
} as const;

const sealClass = {
  xs: "h-5 w-5",
  sm: "h-9 w-9",
  md: "h-8 w-8 md:h-10 md:w-10",
  lg: "h-12 w-12",
} as const;

const nameClass = {
  xs: "text-sm",
  sm: "text-base",
  md: "text-base md:text-xl lg:text-2xl",
  lg: "text-2xl sm:text-3xl",
} as const;

export function BrandLogo({
  name = BRAND_NAME,
  subtitle,
  size = "md",
  showName = true,
  tone = "cream",
  className = "",
}: BrandLogoProps) {
  const px = sizePx[size];
  const textTone = tone === "forest" ? "text-cream" : "text-forest";
  const subtitleTone = tone === "forest" ? "text-brass" : "text-ink/50";

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src={BRAND_SEAL_SRC}
        alt=""
        width={px}
        height={px}
        className={`shrink-0 rounded-full object-cover ${sealClass[size]} ${
          tone === "forest" ? "bg-cream ring-1 ring-cream/40" : ""
        }`}
      />
      {showName ? (
        <span className="flex min-w-0 flex-col justify-center leading-tight">
          <span className={`font-display ${nameClass[size]} ${textTone}`}>
            {name}
          </span>
          {subtitle ? (
            <span
              className={`text-[0.7rem] tracking-wide uppercase ${subtitleTone}`}
            >
              {subtitle}
            </span>
          ) : null}
        </span>
      ) : subtitle ? (
        <span
          className={`text-xs tracking-wide uppercase ${subtitleTone}`}
        >
          {subtitle}
          <span className="sr-only"> — {name}</span>
        </span>
      ) : (
        <span className="sr-only">{name}</span>
      )}
    </span>
  );
}
