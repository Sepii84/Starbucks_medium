import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  buildImageManifest,
  ensureDir,
  fileExists,
  filterManifest,
  generationReportPath,
  inferVisualType,
  loadManifest,
  manifestPath,
  parseImageArgs,
  publicPathToFilePath,
  saveJson,
  type ImageManifestEntry
} from "./image-shared";

type GenerationReport = {
  generatedAt: string;
  generated: number;
  skipped: number;
  failed: Array<{ name: string; path: string; error: string }>;
};

const size = 1024;

async function main() {
  const options = parseImageArgs();
  let manifest;

  try {
    manifest = await loadManifest();
  } catch {
    console.log("Manifest not found. Building it now...");
    manifest = await buildImageManifest(options);
    await saveJson(manifestPath, manifest);
  }

  const entries = filterManifest(manifest.entries, options);
  const report: GenerationReport = {
    generatedAt: new Date().toISOString(),
    generated: 0,
    skipped: 0,
    failed: []
  };

  console.log(`Generating images for ${entries.length} target(s)...`);

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const outputFile = publicPathToFilePath(entry.publicPath);
    const label = `[${index + 1}/${entries.length}] ${entry.type}: ${entry.name}`;

    if (!options.force && (await fileExists(outputFile))) {
      report.skipped += 1;
      console.log(`${label} - exists, skipped.`);
      continue;
    }

    try {
      await generateWithRetry(entry, outputFile);
      report.generated += 1;
      console.log(`${label} - generated ${entry.publicPath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      report.failed.push({ name: entry.name, path: entry.publicPath, error: message });
      console.error(`${label} - failed: ${message}`);
    }
  }

  await saveJson(generationReportPath, report);
  console.log(`Image generation report written: ${generationReportPath}`);

  if (report.failed.length) {
    process.exitCode = 1;
  }
}

async function generateWithRetry(entry: ImageManifestEntry, outputFile: string) {
  await ensureDir(path.dirname(outputFile));
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const svg = renderSvg(entry);
      await sharp(Buffer.from(svg)).resize(size, size).png({ compressionLevel: 9 }).toFile(outputFile);
      const stat = await fs.stat(outputFile);

      if (stat.size <= 0) {
        throw new Error("Generated image is empty.");
      }

      return;
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 600));
      }
    }
  }

  throw lastError;
}

function renderSvg(entry: ImageManifestEntry) {
  if (entry.type === "gift-card") {
    return renderGiftCard(entry);
  }

  if (entry.type === "site") {
    return renderSiteImage(entry);
  }

  const visualType = inferVisualType(entry.name, entry.category ?? "");
  if (visualType === "food") return renderFood(entry);
  if (visualType === "bottle") return renderBottle(entry);
  if (visualType === "coffee-bag") return renderCoffeeBag(entry);
  if (visualType === "instant-pack") return renderInstantCoffee(entry);
  return renderDrink(entry);
}

function baseDefs(seed: string, accent: string) {
  const h = hash(seed);
  const glow = colorShift(accent, 20);
  return `
    <defs>
      <radialGradient id="bg" cx="${35 + (h % 30)}%" cy="${20 + (h % 25)}%" r="80%">
        <stop offset="0%" stop-color="${glow}" stop-opacity="0.48"/>
        <stop offset="38%" stop-color="#10291f" stop-opacity="0.72"/>
        <stop offset="100%" stop-color="#050908"/>
      </radialGradient>
      <linearGradient id="surface" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#22342d"/>
        <stop offset="45%" stop-color="#101816"/>
        <stop offset="100%" stop-color="#030605"/>
      </linearGradient>
      <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="32" stdDeviation="34" flood-color="#000000" flood-opacity="0.55"/>
      </filter>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer><feFuncA type="table" tableValues="0 0.08"/></feComponentTransfer>
      </filter>
      <linearGradient id="glass" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.42"/>
        <stop offset="45%" stop-color="#dfffee" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05"/>
      </linearGradient>
    </defs>`;
}

function background(seed: string, accent: string) {
  return `
    ${baseDefs(seed, accent)}
    <rect width="1024" height="1024" fill="url(#bg)"/>
    <rect width="1024" height="1024" filter="url(#grain)" opacity="0.75"/>
    <circle cx="164" cy="154" r="96" fill="${accent}" opacity="0.12"/>
    <circle cx="856" cy="822" r="160" fill="#d5ff78" opacity="0.08"/>
    <ellipse cx="512" cy="812" rx="340" ry="82" fill="#000" opacity="0.46"/>
    <ellipse cx="512" cy="792" rx="292" ry="58" fill="url(#surface)" opacity="0.72"/>`;
}

function renderDrink(entry: ImageManifestEntry) {
  const palette = drinkPalette(entry.name, entry.category ?? "");
  const lower = entry.name.toLowerCase();
  const isHot = /hot|caffe|cappuccino|espresso|americano|flat white|cortado|macchiato|mocha|misto|latte/.test(lower) && !lower.includes("iced");
  const isFrapp = lower.includes("frappuccino") || lower.includes("blended");
  const isTinyEspresso = /espresso$|macchiato|cortado/.test(lower) && !lower.includes("iced");
  const cup = isHot ? hotCup(entry, palette, isTinyEspresso) : coldCup(entry, palette, isFrapp);

  return svg(`${background(entry.slug, palette.accent)}${cup}${caption(entry.name, entry.category ?? "")}`);
}

function hotCup(entry: ImageManifestEntry, palette: DrinkPalette, small: boolean) {
  const scale = small ? 0.82 : 1;
  const x = 512 - 170 * scale;
  const y = 284 + (small ? 70 : 0);
  const w = 340 * scale;
  const h = 420 * scale;
  return `
    <g filter="url(#softShadow)">
      <ellipse cx="512" cy="${y + h}" rx="${190 * scale}" ry="${40 * scale}" fill="#030403" opacity="0.52"/>
      <path d="M ${x + 35} ${y + 90} C ${x + 62} ${y + h + 20}, ${x + w - 62} ${y + h + 20}, ${x + w - 35} ${y + 90} Z" fill="#f2f1e7"/>
      <path d="M ${x + 52} ${y + 116} C ${x + 75} ${y + h - 3}, ${x + w - 75} ${y + h - 3}, ${x + w - 52} ${y + 116} Z" fill="#d9e2d2"/>
      <ellipse cx="512" cy="${y + 95}" rx="${155 * scale}" ry="${42 * scale}" fill="#f8f5e8"/>
      <ellipse cx="512" cy="${y + 94}" rx="${126 * scale}" ry="${28 * scale}" fill="${palette.liquid}"/>
      <ellipse cx="512" cy="${y + 88}" rx="${104 * scale}" ry="${19 * scale}" fill="${palette.foam}" opacity="0.9"/>
      <path d="M ${x + w - 22} ${y + 166} C ${x + w + 112} ${y + 156}, ${x + w + 112} ${y + 330}, ${x + w - 12} ${y + 315}" fill="none" stroke="#e7eadf" stroke-width="${28 * scale}" stroke-linecap="round"/>
      <path d="M ${x + w - 18} ${y + 188} C ${x + w + 62} ${y + 190}, ${x + w + 62} ${y + 292}, ${x + w - 12} ${y + 292}" fill="none" stroke="#1c2621" stroke-width="${16 * scale}" stroke-linecap="round" opacity="0.45"/>
      <rect x="${x + 76}" y="${y + 215}" width="${w - 152}" height="${92 * scale}" rx="${18 * scale}" fill="${palette.accent}" opacity="0.16"/>
      <path d="M ${x + 96} ${y + 245} C ${x + 155} ${y + 223}, ${x + 206} ${y + 278}, ${x + 265} ${y + 251}" fill="none" stroke="${palette.accent}" stroke-width="${7 * scale}" opacity="0.85"/>
    </g>`;
}

function coldCup(entry: ImageManifestEntry, palette: DrinkPalette, frapp: boolean) {
  const lower = entry.name.toLowerCase();
  const garnish = lower.includes("strawberry")
    ? fruitDots("#ff6d87")
    : lower.includes("mango") || lower.includes("dragon")
      ? fruitDots("#ffb347")
      : lower.includes("butterfly") || lower.includes("lavender")
        ? fruitDots("#9e7dff")
        : "";
  const cream = frapp
    ? `<path d="M414 314 C430 258, 586 258, 610 314 C640 300, 650 352, 610 356 C590 396, 430 396, 410 356 C370 348, 382 300, 414 314 Z" fill="#fff4de"/>
       <path d="M446 312 C494 280, 538 282, 580 314" fill="none" stroke="#f8dfb9" stroke-width="18" stroke-linecap="round"/>`
    : "";

  return `
    <g filter="url(#softShadow)">
      ${cream}
      <path d="M338 318 L686 318 L636 770 C628 814, 396 814, 388 770 Z" fill="url(#glass)" stroke="#eafff5" stroke-width="5" opacity="0.95"/>
      <path d="M365 398 L659 398 L624 760 C614 788, 410 788, 400 760 Z" fill="${palette.liquid}" opacity="0.92"/>
      <path d="M374 420 C454 448, 560 385, 654 422 L646 492 C554 458, 462 520, 370 478 Z" fill="${palette.secondary}" opacity="0.55"/>
      <ellipse cx="512" cy="398" rx="146" ry="32" fill="${palette.foam}" opacity="0.75"/>
      <g opacity="0.45">
        <rect x="430" y="472" width="72" height="96" rx="20" fill="#dff8ff"/>
        <rect x="522" y="524" width="76" height="104" rx="22" fill="#dff8ff"/>
        <rect x="452" y="632" width="78" height="86" rx="20" fill="#dff8ff"/>
      </g>
      ${garnish}
      <path d="M388 312 C420 280, 604 278, 636 312" fill="none" stroke="#dfffee" stroke-width="10" opacity="0.65"/>
      <path d="M408 348 L367 770" stroke="#ffffff" stroke-width="9" opacity="0.2"/>
      <path d="M620 352 L596 760" stroke="#ffffff" stroke-width="7" opacity="0.12"/>
      <path d="M520 284 L590 148" stroke="#c7ffe6" stroke-width="13" stroke-linecap="round" opacity="0.8"/>
    </g>`;
}

function fruitDots(color: string) {
  return `
    <circle cx="438" cy="496" r="18" fill="${color}" opacity="0.9"/>
    <circle cx="580" cy="564" r="16" fill="${color}" opacity="0.86"/>
    <circle cx="484" cy="666" r="14" fill="${color}" opacity="0.82"/>`;
}

function renderBottle(entry: ImageManifestEntry) {
  const palette = drinkPalette(entry.name, entry.category ?? "");
  return svg(`
    ${background(entry.slug, palette.accent)}
    <g filter="url(#softShadow)">
      <path d="M446 238 C446 196, 578 196, 578 238 L578 310 C640 346, 652 720, 604 792 C568 826, 456 826, 420 792 C372 720, 384 346, 446 310 Z" fill="#dfffee" opacity="0.22" stroke="#effff8" stroke-width="6"/>
      <rect x="454" y="190" width="116" height="84" rx="24" fill="#e2f7e8"/>
      <rect x="430" y="438" width="164" height="168" rx="22" fill="${palette.accent}" opacity="0.3"/>
      <path d="M436 354 C480 390, 544 318, 594 358 L610 750 C584 784, 440 784, 414 750 Z" fill="${palette.liquid}" opacity="0.82"/>
      <path d="M470 242 L470 756" stroke="#fff" stroke-width="8" opacity="0.18"/>
    </g>
    ${caption(entry.name, entry.category ?? "")}`);
}

function renderCoffeeBag(entry: ImageManifestEntry) {
  const accent = "#31d984";
  return svg(`
    ${background(entry.slug, accent)}
    <g filter="url(#softShadow)">
      <path d="M348 246 L676 246 L720 786 C634 828, 424 828, 304 786 Z" fill="#14221c"/>
      <path d="M372 288 L652 288 L682 746 C600 780, 430 780, 342 746 Z" fill="#203b31"/>
      <path d="M390 360 L632 360 L650 612 L374 612 Z" fill="#e7f5dc"/>
      <circle cx="512" cy="486" r="76" fill="#0b1712"/>
      <path d="M468 492 C502 430, 562 430, 558 506 C520 536, 490 534, 468 492 Z" fill="${accent}" opacity="0.8"/>
      <path d="M424 694 C482 664, 566 666, 624 696" fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round"/>
      <path d="M392 246 C440 210, 586 210, 632 246" fill="none" stroke="#d6ffe8" stroke-width="16" opacity="0.35"/>
    </g>
    ${caption(entry.name, entry.category ?? "Whole Bean")}`);
}

function renderInstantCoffee(entry: ImageManifestEntry) {
  const accent = "#7cff88";
  return svg(`
    ${background(entry.slug, accent)}
    <g filter="url(#softShadow)">
      <rect x="314" y="278" width="396" height="512" rx="44" fill="#10221a" stroke="#bffff0" stroke-width="5" opacity="0.98"/>
      <path d="M314 348 C410 300, 610 300, 710 348 L710 426 C594 382, 432 382, 314 426 Z" fill="#1f4535"/>
      <rect x="374" y="438" width="276" height="170" rx="28" fill="#edf7e8"/>
      <path d="M416 518 C474 458, 566 458, 608 526 C560 564, 470 562, 416 518 Z" fill="#12271e"/>
      <path d="M470 518 C500 480, 552 482, 558 530 C522 548, 492 546, 470 518 Z" fill="${accent}" opacity="0.88"/>
      <rect x="388" y="646" width="248" height="28" rx="14" fill="${accent}" opacity="0.78"/>
      <rect x="390" y="694" width="246" height="24" rx="12" fill="#dfffee" opacity="0.48"/>
      <g opacity="0.74">
        <rect x="210" y="420" width="128" height="310" rx="24" fill="#1a342a" stroke="#8df0b8" stroke-width="3"/>
        <rect x="686" y="424" width="128" height="310" rx="24" fill="#1a342a" stroke="#8df0b8" stroke-width="3"/>
        <path d="M230 470 L318 470" stroke="#dfffee" stroke-width="9" opacity="0.5"/>
        <path d="M706 474 L794 474" stroke="#dfffee" stroke-width="9" opacity="0.5"/>
      </g>
      <text x="512" y="382" text-anchor="middle" fill="#eafff3" font-size="34" font-family="Arial, sans-serif" font-weight="800" letter-spacing="5">VIA INSTANT</text>
    </g>
    ${caption(entry.name, entry.category ?? "VIA Instant")}`);
}

function renderFood(entry: ImageManifestEntry) {
  const lower = entry.name.toLowerCase();
  let item = renderGenericPastry(entry.name);
  if (lower.includes("croissant")) item = renderCroissant(lower.includes("chocolate"));
  if (lower.includes("sandwich") || lower.includes("focaccia") || lower.includes("ciabatta") || lower.includes("baguette")) item = renderSandwich();
  if (lower.includes("cake pop")) item = renderCakePop(lower);
  if (lower.includes("cake") && !lower.includes("cake pop")) item = renderCakeSlice(lower);
  if (lower.includes("muffin") || lower.includes("scone")) item = renderMuffin();
  if (lower.includes("cookie") || lower.includes("brownie") || lower.includes("bar")) item = renderCookie(lower);
  if (lower.includes("bagel")) item = renderBagel();
  if (lower.includes("protein box")) item = renderProteinBox();

  return svg(`
    ${background(entry.slug, "#9be66e")}
    <g filter="url(#softShadow)">
      <ellipse cx="512" cy="658" rx="318" ry="124" fill="#e8efe1"/>
      <ellipse cx="512" cy="652" rx="258" ry="86" fill="#cad6c4"/>
      ${item}
    </g>
    ${caption(entry.name, entry.category ?? "")}`);
}

function renderCroissant(chocolate: boolean) {
  const drizzle = chocolate
    ? `<path d="M340 592 C420 548, 580 548, 674 594" fill="none" stroke="#422513" stroke-width="18" stroke-linecap="round" opacity="0.9"/>`
    : "";
  return `
    <path d="M258 606 C300 468, 430 426, 512 518 C594 426, 724 468, 766 606 C676 560, 594 620, 512 626 C430 620, 348 560, 258 606 Z" fill="#d48a36"/>
    <path d="M326 594 C390 494, 458 488, 512 554 C566 488, 634 494, 698 594" fill="none" stroke="#f2c06a" stroke-width="28" stroke-linecap="round"/>
    ${drizzle}`;
}

function renderSandwich() {
  return `
    <path d="M300 548 C400 468, 628 468, 724 548 L672 658 C580 716, 440 716, 350 658 Z" fill="#dfb15a"/>
    <path d="M326 588 C426 532, 600 532, 698 588 L672 632 C574 672, 442 672, 352 632 Z" fill="#f8e2a6"/>
    <path d="M352 618 C444 562, 584 562, 672 618" fill="none" stroke="#4faf72" stroke-width="26"/>
    <path d="M386 638 C468 594, 558 594, 634 638" fill="none" stroke="#d75748" stroke-width="20"/>`;
}

function renderCakePop(lower: string) {
  const color = lower.includes("chocolate") ? "#5a3324" : lower.includes("unicorn") ? "#f1b7ff" : "#f6d6a6";
  return `
    <path d="M512 548 L512 760" stroke="#f2dcc2" stroke-width="22" stroke-linecap="round"/>
    <circle cx="512" cy="474" r="112" fill="${color}"/>
    <path d="M454 432 C500 392, 564 400, 596 448" fill="none" stroke="#fff4dd" stroke-width="15" opacity="0.7"/>
    <circle cx="472" cy="490" r="9" fill="#fff"/>
    <circle cx="548" cy="456" r="8" fill="#7ee7b6"/>
    <circle cx="570" cy="510" r="7" fill="#ffda73"/>`;
}

function renderCakeSlice(lower: string) {
  const icing = lower.includes("lemon") || lower.includes("yuzu") ? "#f5e883" : "#fff2e0";
  const cake = lower.includes("chocolate") ? "#5c3527" : "#c98a48";
  return `
    <path d="M338 524 L690 460 L644 672 L362 714 Z" fill="${cake}"/>
    <path d="M338 524 L690 460 L668 528 L356 586 Z" fill="${icing}"/>
    <path d="M366 626 L654 574" stroke="${icing}" stroke-width="24" opacity="0.8"/>
    <path d="M690 460 L644 672 L668 528 Z" fill="#9b6235" opacity="0.55"/>`;
}

function renderMuffin() {
  return `
    <path d="M358 570 C350 460, 436 390, 512 444 C588 390, 674 460, 666 570 C632 634, 392 634, 358 570 Z" fill="#b87938"/>
    <path d="M390 590 L634 590 L602 724 L422 724 Z" fill="#d8a15c"/>
    <circle cx="462" cy="506" r="14" fill="#59331f"/>
    <circle cx="558" cy="486" r="13" fill="#59331f"/>
    <circle cx="520" cy="542" r="11" fill="#59331f"/>`;
}

function renderCookie(lower: string) {
  const base = lower.includes("brownie") ? "#513023" : "#c48a46";
  return `
    <rect x="340" y="488" width="344" height="218" rx="42" fill="${base}"/>
    <circle cx="428" cy="548" r="18" fill="#3b2419"/>
    <circle cx="530" cy="598" r="16" fill="#3b2419"/>
    <circle cx="610" cy="538" r="14" fill="#3b2419"/>
    <circle cx="462" cy="660" r="13" fill="#3b2419"/>`;
}

function renderBagel() {
  return `
    <ellipse cx="512" cy="590" rx="210" ry="132" fill="#c9863b"/>
    <ellipse cx="512" cy="590" rx="92" ry="58" fill="#cad6c4"/>
    <ellipse cx="512" cy="574" rx="196" ry="104" fill="#e1ad62" opacity="0.7"/>
    <circle cx="430" cy="532" r="8" fill="#7a4a23"/>
    <circle cx="548" cy="520" r="7" fill="#7a4a23"/>
    <circle cx="604" cy="592" r="6" fill="#7a4a23"/>`;
}

function renderProteinBox() {
  return `
    <rect x="300" y="440" width="424" height="280" rx="36" fill="#ecf2e8" opacity="0.95"/>
    <rect x="326" y="466" width="170" height="100" rx="20" fill="#f2c267"/>
    <rect x="526" y="466" width="170" height="100" rx="20" fill="#9dce7a"/>
    <rect x="326" y="594" width="170" height="100" rx="20" fill="#d85c50"/>
    <rect x="526" y="594" width="170" height="100" rx="20" fill="#f1dfb4"/>`;
}

function renderGenericPastry(name: string) {
  const h = hash(name);
  const color = h % 2 === 0 ? "#d1934c" : "#c87745";
  return `
    <path d="M338 548 C368 444, 648 444, 686 548 C716 632, 626 712, 512 712 C398 712, 308 632, 338 548 Z" fill="${color}"/>
    <path d="M396 548 C454 502, 570 502, 628 548" fill="none" stroke="#f4cb84" stroke-width="24" stroke-linecap="round"/>
    <path d="M408 626 C468 660, 558 660, 616 626" fill="none" stroke="#8a522a" stroke-width="12" opacity="0.45"/>`;
}

function renderGiftCard(entry: ImageManifestEntry) {
  const amount = entry.name.match(/\d+/)?.[0] ?? "";
  const accent = amount === "100" ? "#c8ff66" : amount === "50" ? "#4ee0c2" : amount === "25" ? "#6ee76d" : "#9bc4ff";
  return svg(`
    ${background(entry.slug, accent)}
    <g filter="url(#softShadow)">
      <rect x="172" y="316" width="680" height="408" rx="54" fill="#07120e"/>
      <rect x="196" y="338" width="632" height="364" rx="42" fill="#10231b" stroke="${accent}" stroke-width="3" opacity="0.98"/>
      <path d="M224 640 C380 510, 500 742, 790 390" fill="none" stroke="${accent}" stroke-width="28" opacity="0.32"/>
      <path d="M246 414 C380 374, 488 462, 602 412 C688 374, 746 378, 798 408" fill="none" stroke="#ffffff" stroke-width="8" opacity="0.22"/>
      <circle cx="270" cy="642" r="54" fill="${accent}" opacity="0.18"/>
      <text x="256" y="442" fill="#dfffee" font-size="34" font-family="Arial, sans-serif" font-weight="700" letter-spacing="4">GIFT CARD</text>
      <text x="256" y="612" fill="${accent}" font-size="118" font-family="Arial, sans-serif" font-weight="800">$${amount}</text>
      <text x="260" y="660" fill="#b8d6c8" font-size="24" font-family="Arial, sans-serif" letter-spacing="3">PREMIUM COFFEE CREDIT</text>
    </g>`);
}

function renderSiteImage(entry: ImageManifestEntry) {
  if (entry.slug.includes("interior")) {
    return svg(`
      ${background(entry.slug, "#31d984")}
      <g filter="url(#softShadow)">
        <rect x="132" y="268" width="760" height="420" rx="40" fill="#14221d"/>
        <rect x="180" y="318" width="180" height="300" rx="24" fill="#0d1714"/>
        <rect x="408" y="318" width="180" height="300" rx="24" fill="#0d1714"/>
        <rect x="636" y="318" width="180" height="300" rx="24" fill="#0d1714"/>
        <path d="M160 686 L864 686 L752 806 L270 806 Z" fill="#1c2b25"/>
        <circle cx="278" cy="410" r="58" fill="#31d984" opacity="0.18"/>
        <circle cx="506" cy="410" r="58" fill="#c8ff66" opacity="0.13"/>
        <circle cx="734" cy="410" r="58" fill="#31d984" opacity="0.16"/>
        <rect x="256" y="612" width="512" height="52" rx="18" fill="#d3ac6d"/>
      </g>`);
  }

  if (entry.slug.includes("bar")) {
    return svg(`
      ${background(entry.slug, "#73e67a")}
      <g filter="url(#softShadow)">
        <rect x="222" y="338" width="580" height="326" rx="34" fill="#101917"/>
        <rect x="294" y="410" width="436" height="202" rx="28" fill="#26352f"/>
        <circle cx="396" cy="508" r="62" fill="#0a0f0d" stroke="#e9fff3" stroke-width="10"/>
        <circle cx="626" cy="508" r="62" fill="#0a0f0d" stroke="#e9fff3" stroke-width="10"/>
        <rect x="310" y="652" width="402" height="70" rx="22" fill="#d6aa68"/>
        <path d="M296 300 C390 240, 618 240, 724 300" fill="none" stroke="#73e67a" stroke-width="18" opacity="0.5"/>
      </g>`);
  }

  return svg(`
    ${background(entry.slug, "#31d984")}
    <g filter="url(#softShadow)">
      <ellipse cx="512" cy="674" rx="240" ry="64" fill="#050807" opacity="0.52"/>
      <path d="M362 404 C388 738, 636 738, 662 404 Z" fill="#f2f1e7"/>
      <ellipse cx="512" cy="404" rx="152" ry="44" fill="#f8f5e8"/>
      <ellipse cx="512" cy="400" rx="124" ry="28" fill="#2d170f"/>
      <path d="M410 394 C464 360, 554 432, 614 392" fill="none" stroke="#d8b06a" stroke-width="15" opacity="0.9"/>
      <path d="M648 480 C780 464, 782 628, 658 624" fill="none" stroke="#f2f1e7" stroke-width="32" stroke-linecap="round"/>
      <path d="M430 550 C480 520, 560 520, 612 550" fill="none" stroke="#31d984" stroke-width="10" opacity="0.55"/>
    </g>`);
}

type DrinkPalette = {
  liquid: string;
  secondary: string;
  foam: string;
  accent: string;
};

function drinkPalette(name: string, category: string): DrinkPalette {
  const lower = `${name} ${category}`.toLowerCase();
  if (lower.includes("matcha")) return { liquid: "#6fc46a", secondary: "#d9f5c3", foam: "#e8ffe3", accent: "#7cff88" };
  if (lower.includes("strawberry") || lower.includes("pink")) return { liquid: "#f6758f", secondary: "#ffd4dc", foam: "#fff0f4", accent: "#ff8ea4" };
  if (lower.includes("mango") || lower.includes("dragon")) return { liquid: "#f3a037", secondary: "#e24d85", foam: "#ffe7b8", accent: "#ffbf4d" };
  if (lower.includes("butterfly") || lower.includes("lavender")) return { liquid: "#786de8", secondary: "#d8c6ff", foam: "#f0eaff", accent: "#9a8cff" };
  if (lower.includes("lemonade")) return { liquid: "#f4d650", secondary: "#fff5a1", foam: "#fff9ca", accent: "#f7e85d" };
  if (lower.includes("chai") || lower.includes("tea")) return { liquid: "#9a5d2e", secondary: "#dca25e", foam: "#f4d6a6", accent: "#e9b36f" };
  if (lower.includes("mocha") || lower.includes("chocolate")) return { liquid: "#59301f", secondary: "#9b6141", foam: "#ead1b5", accent: "#d4965f" };
  if (lower.includes("caramel")) return { liquid: "#7a401e", secondary: "#d99543", foam: "#f2d6a6", accent: "#e8a957" };
  if (lower.includes("cold brew") || lower.includes("espresso") || lower.includes("coffee")) return { liquid: "#21120d", secondary: "#6f4227", foam: "#ddbb83", accent: "#7cff88" };
  return { liquid: "#4d2d1d", secondary: "#b77d44", foam: "#f0d2a4", accent: "#7cff88" };
}

function caption(name: string, category: string) {
  const title = escapeXml(name.length > 34 ? `${name.slice(0, 31)}...` : name);
  return `
    <g opacity="0.96">
      <rect x="116" y="858" width="792" height="88" rx="30" fill="#030605" opacity="0.58"/>
      <text x="512" y="902" text-anchor="middle" fill="#eafff3" font-size="28" font-family="Arial, sans-serif" font-weight="700">${title}</text>
      <text x="512" y="928" text-anchor="middle" fill="#7cff88" font-size="15" font-family="Arial, sans-serif" font-weight="700" letter-spacing="3">${escapeXml(category.toUpperCase())}</text>
    </g>`;
}

function svg(inner: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${inner}</svg>`;
}

function hash(value: string) {
  return [...value].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 2166136261);
}

function colorShift(hex: string, amount: number) {
  const clean = hex.replace("#", "");
  const r = Math.min(255, parseInt(clean.slice(0, 2), 16) + amount);
  const g = Math.min(255, parseInt(clean.slice(2, 4), 16) + amount);
  const b = Math.min(255, parseInt(clean.slice(4, 6), 16) + amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

main().catch((error) => {
  console.error("Image generation failed:", error);
  process.exit(1);
});
