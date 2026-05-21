"use client";

/**
 * จับภาพ DOM element เป็น PNG dataURL ด้วย html2canvas
 * - ซ่อน element ที่มี data-snapshot-hide ระหว่างจับภาพ (เช่น ปุ่ม refresh)
 */
export async function captureElementAsPng(
  el: HTMLElement,
): Promise<string> {
  const hidden = Array.from(
    el.querySelectorAll<HTMLElement>("[data-snapshot-hide]"),
  );
  const previous = hidden.map((e) => e.style.visibility);
  hidden.forEach((e) => (e.style.visibility = "hidden"));

  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(el, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
    });
    return canvas.toDataURL("image/png");
  } finally {
    hidden.forEach((e, i) => (e.style.visibility = previous[i] ?? ""));
  }
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
