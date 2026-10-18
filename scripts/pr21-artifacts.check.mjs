import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import prettier from "prettier";
import sharp from "sharp";

// Compare generated outputs without dumping their large payloads or executing HTML.
for (const path of [
  "graphify-out/.graphify_labels.json",
  "graphify-out/cost.json",
  "graphify-out/graph.json",
  "graphify-out/manifest.json",
  "graphify-out/graph.html",
]) {
  const base = execFileSync("git", ["show", `592bdf1:${path}`], {
    encoding: "utf8",
  });
  const head = execFileSync("git", ["show", `acda76a:${path}`], {
    encoding: "utf8",
  });
  assert.equal(
    await prettier.format(head, { filepath: path }),
    await prettier.format(base, { filepath: path }),
    path
  );
  process.stdout.write(`${path}: formatting-only change\n`);
}
const provenance = JSON.parse(
  await readFile("public/demo-properties/provenance.json", "utf8")
);
assert.equal(provenance.length, 15);
for (const entry of provenance) {
  assert.match(entry.file, /^destination-[0-4]-[0-2]\.jpg$/);
  assert.ok(entry.authorHtml && entry.licenseUrl && entry.source);
  assert.match(entry.source, /^https:\/\/commons\.wikimedia\.org\//);
  const bytes = await readFile(`public/demo-properties/${entry.file}`);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), entry.sha256);
  const metadata = await sharp(bytes).metadata();
  assert.equal(metadata.format, "jpeg");
  assert.ok(metadata.width >= 600 && metadata.height >= 350);
  assert.equal(metadata.exif, undefined);
  await sharp(bytes).stats();
}
assert.equal(new Set(provenance.map((entry) => entry.file)).size, 15);
process.stdout.write(
  "15 JPEG assets: attribution, hash, dimensions, decoding and absent EXIF verified\n"
);
