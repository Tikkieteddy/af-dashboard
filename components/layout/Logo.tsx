"use client";

import { useState } from "react";

/**
 * Logo component — รองรับทั้ง af-logo.png (ถ้า user วางไฟล์) และ fallback SVG
 */
export default function Logo({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState("/af-logo.png");
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="AF Logo"
      width={size}
      height={size}
      onError={() => setSrc("/af-logo.svg")}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
