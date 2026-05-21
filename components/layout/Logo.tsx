"use client";

import { useState } from "react";

/**
 * Logo component
 * - variant="mark"  → วงกลม AF เดี่ยวๆ (square) เหมาะกับ sidebar/header เล็กๆ
 * - variant="full"  → โลโก้แนวนอนเต็ม (2.4:1) เหมาะกับ login/header ขนาดใหญ่
 * - ลำดับโหลด: ลอง af-logo.png (ของ user) → fallback ไป SVG fallback
 */
export default function Logo({
  variant = "mark",
  width,
  height,
  className = "",
}: {
  variant?: "mark" | "full";
  width?: number;
  height?: number;
  className?: string;
}) {
  // ผู้ใช้สามารถวาง af-logo.png (โลโก้ของจริง) ที่ /public — ระบบจะใช้ก่อน
  // ถ้าไม่มีจะ fallback ไป SVG mark/full ตาม variant
  const fallback = variant === "full" ? "/af-logo.svg" : "/af-logo-mark.svg";
  const [src, setSrc] = useState("/af-logo.png");

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="True Academy Fantasia"
      width={width}
      height={height}
      onError={() => setSrc(fallback)}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
