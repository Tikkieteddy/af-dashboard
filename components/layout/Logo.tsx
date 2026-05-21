"use client";

/**
 * Logo: ใช้ /AF.png ที่ user upload ไว้ใน public/
 */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/AF.png"
      alt="True Academy Fantasia"
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
