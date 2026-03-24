"use client";
import Image from "next/image";
import clsx from "clsx";

const LOGO_SRC = "/abando-logo-transparent.png";

const SIZE_MAP = {
  header: {
    width: 116,
    height: 28,
    className: "h-6 w-auto sm:h-7",
  },
  hero: {
    width: 156,
    height: 36,
    className: "h-8 w-auto sm:h-9",
  },
} as const;

export default function BrandLogo({
  size = "header",
  width,
  height,
  className,
}: {
  size?: keyof typeof SIZE_MAP;
  width?: number;
  height?: number;
  className?: string;
}) {
  const config = SIZE_MAP[size];
  const resolvedWidth = width ?? config.width;
  const resolvedHeight = height ?? config.height;
  return (
    <Image
      src={LOGO_SRC}
      alt="Abando"
      width={resolvedWidth}
      height={resolvedHeight}
      priority
      className={clsx(config.className, "object-contain object-left", className)}
      sizes={resolvedWidth > SIZE_MAP.header.width ? `${resolvedWidth}px` : "116px"}
    />
  );
}
