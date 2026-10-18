import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { destinations } from "./demo-properties.mjs";

const root = new URL("../public/demo-properties/", import.meta.url);
await mkdir(root, { recursive: true });
const provenance = [];
for (const [destination, [city, , query]] of destinations.entries()) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${query} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "15",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "1000",
    format: "json",
  });
  const response = await fetch(
    `https://commons.wikimedia.org/w/api.php?${params}`,
    { signal: AbortSignal.timeout(30000) }
  );
  if (!response.ok)
    throw new Error(`Commons search failed: ${response.status}`);
  const data = await response.json();
  let index = 0;
  for (const page of Object.values(data.query?.pages ?? {}).sort(
    (a, b) => a.index - b.index
  )) {
    const normalized = page.title
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/đ/g, "d")
      .replace(/[-_]/g, " ");
    const required = ["trang an", "da nang", "hoi an", "da lat", "ha long"][
      destination
    ];
    if (!normalized.includes(required)) continue;
    const info = page.imageinfo?.[0];
    const meta = info?.extmetadata;
    if (
      !meta ||
      ![
        "CC BY 4.0",
        "CC BY-SA 4.0",
        "CC BY-SA 3.0",
        "CC BY 2.0",
        "CC0",
      ].includes(meta.LicenseShortName?.value)
    )
      continue;
    const image = await fetch(info.thumburl ?? info.url, {
      signal: AbortSignal.timeout(30000),
    });
    if (!image.ok || !image.headers.get("content-type")?.startsWith("image/"))
      continue;
    const bytes = await sharp(Buffer.from(await image.arrayBuffer()))
      .rotate()
      .resize({ width: 1000, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    const metadata = await sharp(bytes).metadata();
    if (metadata.width < 600 || metadata.height < 350) continue;
    const file = `destination-${destination}-${index}.jpg`;
    await writeFile(new URL(file, root), bytes);
    provenance.push({
      city,
      file,
      title: page.title,
      source: info.descriptionurl,
      download: info.thumburl ?? info.url,
      authorHtml: meta.Artist?.value,
      creditHtml: meta.Credit?.value,
      license: meta.LicenseShortName.value,
      licenseUrl: meta.LicenseUrl?.value,
      modifications:
        "Resized to at most 1000 pixels wide, auto-oriented and JPEG encoded",
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
    if (++index === 3) break;
  }
  if (index !== 3)
    throw new Error(`Insufficient licensed destination images: ${city}`);
}
await writeFile(
  new URL("provenance.json", root),
  JSON.stringify(provenance, null, 2) + "\n"
);
process.stdout.write(
  `Prepared ${provenance.length} licensed images for 60 listing image references.\n`
);
