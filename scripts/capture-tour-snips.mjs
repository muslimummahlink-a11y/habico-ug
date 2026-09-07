import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const baseUrl = process.env.HABICO_URL ?? "http://localhost:8080";
const sourcePath = path.resolve("src/components/page-tour/tour-steps.ts");
const outputDir = path.resolve("public/guides");
const requestedRoutes = process.argv.slice(2);

const source = await fs.readFile(sourcePath, "utf8");
const routePattern = /const (\w+Tour): PageTourConfig = \{\s*route: "([^"]+)"[\s\S]*?steps: \[([\s\S]*?)\n  \],\n\};/g;
const stepPattern = /title: "([^"]+)"[\s\S]*?selector: "([^"]+)"/g;
const tours = [];
for (const match of source.matchAll(routePattern)) {
  const [, , route, stepsSource] = match;
  if (requestedRoutes.length && !requestedRoutes.includes(route)) continue;
  const steps = [...stepsSource.matchAll(stepPattern)].map((step) => ({ title: step[1], selector: step[2] }));
  tours.push({ route, steps });
}

const makeFallbackSvg = (route, title, stepText) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700" role="img" aria-label="${title}">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#0b4f4e" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
      <linearGradient id="panel" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18" />
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.06" />
      </linearGradient>
    </defs>
    <rect width="1200" height="700" fill="url(#bg)" rx="28"/>
    <rect x="52" y="52" width="1096" height="596" rx="24" fill="url(#panel)" stroke="rgba(255,255,255,0.2)"/>
    <rect x="92" y="110" width="200" height="18" rx="9" fill="#f6b76a"/>
    <text x="92" y="190" font-size="46" font-family="Segoe UI, Arial, sans-serif" fill="#ffffff" font-weight="700">${route}</text>
    <text x="92" y="245" font-size="24" font-family="Segoe UI, Arial, sans-serif" fill="#d7f1ee">${title}</text>
    <rect x="92" y="290" width="480" height="220" rx="20" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.16)"/>
    <rect x="130" y="334" width="220" height="14" rx="7" fill="#ffffff" fill-opacity="0.82"/>
    <rect x="130" y="366" width="400" height="14" rx="7" fill="#ffffff" fill-opacity="0.52"/>
    <rect x="130" y="395" width="305" height="14" rx="7" fill="#ffffff" fill-opacity="0.52"/>
    <rect x="130" y="424" width="360" height="14" rx="7" fill="#ffffff" fill-opacity="0.52"/>
    <rect x="620" y="290" width="470" height="220" rx="20" fill="#f8fafc" fill-opacity="0.96"/>
    <rect x="664" y="336" width="210" height="12" rx="6" fill="#0b4f4e" fill-opacity="0.3"/>
    <rect x="664" y="366" width="300" height="92" rx="14" fill="#dff7f3"/>
    <text x="664" y="435" font-size="18" font-family="Segoe UI, Arial, sans-serif" fill="#0f172a" font-weight="600">${stepText}</text>
    <circle cx="1012" cy="324" r="42" fill="#f6b76a" fill-opacity="0.2"/>
    <circle cx="1012" cy="324" r="18" fill="#f6b76a"/>
    <text x="92" y="585" font-size="18" font-family="Segoe UI, Arial, sans-serif" fill="#d7f1ee">Habico help guide • auto-generated from the page tour</text>
  </svg>
`;

await fs.mkdir(outputDir, { recursive: true });
let browser;
try {
  const { chromium } = await import("playwright");
  browser = await chromium.launch();
} catch {
  browser = null;
}

for (const tour of tours) {
  const safeRoute = tour.route.replace(/\W+/g, "-").replace(/^-|-$/g, "") || "home";
  if (!browser) {
    for (const [index, step] of tour.steps.entries()) {
      const safeTitle = step.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const outputPath = path.join(outputDir, `${safeRoute}-${String(index + 1).padStart(2, "0")}-${safeTitle}.svg`);
      await fs.writeFile(outputPath, makeFallbackSvg(tour.route, step.title, step.title), "utf8");
      console.log(`created fallback ${outputPath}`);
    }
    continue;
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto(`${baseUrl}${tour.route}`, { waitUntil: "networkidle" });
  for (const [index, step] of tour.steps.entries()) {
    const target = page.locator(step.selector).first();
    if (!(await target.count())) {
      console.warn(`Skipped ${tour.route}: ${step.selector} was not found`);
      continue;
    }
    await target.scrollIntoViewIfNeeded();
    const safeTitle = step.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const outputPath = path.join(outputDir, `${safeRoute}-${String(index + 1).padStart(2, "0")}-${safeTitle}.png`);
    await target.screenshot({ path: outputPath });
    console.log(outputPath);
  }
  await page.close();
}
if (browser) await browser.close();
