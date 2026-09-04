import { toPng } from "html-to-image";

function sanitize(s: string) {
  return s.replace(/[^a-zA-Z0-9-_]+/g, "_").replace(/^_+|_+$/g, "");
}

async function nodeToPng(node: HTMLElement): Promise<string> {
  // pixelRatio 2 keeps export crisp at 2024x1276, well above print quality.
  return toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: "transparent",
    skipFonts: false,
  });
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function exportCardSides(opts: {
  frontNode: HTMLElement | null;
  backNode: HTMLElement | null;
  cardNumber: string;
  tenantName?: string | null;
  unitNumber?: string | null;
}) {
  if (!opts.frontNode || !opts.backNode) {
    throw new Error("Card preview is not ready yet");
  }
  const baseParts = [
    "HABICO-ID",
    sanitize(opts.cardNumber || "card"),
    opts.tenantName ? sanitize(opts.tenantName) : "",
    opts.unitNumber ? `unit-${sanitize(opts.unitNumber)}` : "",
  ].filter(Boolean);
  const base = baseParts.join("_");

  // Two passes so each download names itself clearly.
  const front = await nodeToPng(opts.frontNode);
  downloadDataUrl(front, `${base}_FRONT.png`);
  // Brief tick so the browser registers the second download.
  await new Promise((r) => setTimeout(r, 250));
  const back = await nodeToPng(opts.backNode);
  downloadDataUrl(back, `${base}_BACK.png`);
}
