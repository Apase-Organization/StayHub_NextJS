import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { prisma } from "../src/lib/prisma.ts";
import {
  authorizeReset,
  dataset,
  validateDataset,
} from "./demo-properties.mjs";

const digest = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const plain = (value) =>
  value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

async function counts(db) {
  const result = {};
  for (const name of [
    "property",
    "booking",
    "payment",
    "review",
    "propertyImage",
    "propertyAmenity",
    "user",
    "amenity",
    "discountCode",
    "verificationToken",
  ])
    result[name] = await db[name].count();
  return result;
}

async function preserved(db) {
  return digest(
    await Promise.all([
      db.user.findMany({ orderBy: { id: "asc" } }),
      db.amenity.findMany({ orderBy: { id: "asc" } }),
      db.discountCode.findMany({ orderBy: { id: "asc" } }),
      db.verificationToken.findMany({ orderBy: { id: "asc" } }),
    ])
  );
}

async function verifyImages(rows) {
  const provenance = JSON.parse(
    await readFile(
      new URL("../public/demo-properties/provenance.json", import.meta.url),
      "utf8"
    )
  );
  for (const row of rows) {
    const credits = [];
    for (const image of row.images) {
      assert.match(
        image.imageUrl,
        /^\/demo-properties\/destination-[0-4]-[0-2]\.jpg$/
      );
      const source = provenance.find(
        (entry) =>
          `/demo-properties/${entry.file}` === image.imageUrl &&
          entry.city === row.city
      );
      assert.ok(
        source?.authorHtml && source?.licenseUrl && source?.source,
        "Missing image attribution"
      );
      const bytes = await readFile(
        new URL(`../public${image.imageUrl}`, import.meta.url)
      );
      assert.equal(
        createHash("sha256").update(bytes).digest("hex"),
        source.sha256
      );
      const { width, height } = await sharp(bytes).metadata();
      assert.ok(width >= 600 && height >= 350);
      await sharp(bytes).stats();
      credits.push(
        `${plain(source.authorHtml)} — ${source.license} (${source.licenseUrl}), ${source.source}`
      );
    }
    row.description += `\nẢnh minh họa (đã đổi kích thước và mã hóa JPEG), theo thứ tự: ${credits.join("; ")}. Chi tiết: /demo-properties/provenance.json`;
  }
}

async function main() {
  const execute = authorizeReset(process.argv.slice(2));
  const rows = dataset();
  validateDataset(rows);
  await verifyImages(rows);
  const result = await prisma.$transaction(
    async (db) => {
      // Prevent concurrent writes to the entire inspected dependency graph during replacement.
      if (execute)
        await db.$executeRawUnsafe(
          "LOCK TABLE users, properties, bookings, payments, reviews, property_images, property_amenities, amenities, discount_codes, verification_tokens IN EXCLUSIVE MODE"
        );
      const dependencies =
        await db.$queryRaw`SELECT conrelid::regclass::text AS child, confrelid::regclass::text AS parent FROM pg_constraint WHERE contype = 'f' AND confrelid IN ('properties'::regclass, 'bookings'::regclass, 'payments'::regclass, 'reviews'::regclass, 'property_images'::regclass, 'property_amenities'::regclass)`;
      const allowed = new Set([
        "property_images:properties",
        "property_amenities:properties",
        "bookings:properties",
        "reviews:properties",
        "payments:bookings",
        "reviews:bookings",
      ]);
      assert.ok(
        dependencies.every(({ child, parent }) =>
          allowed.has(`${child}:${parent}`)
        ),
        "Unexpected destructive dependency; stop"
      );
      let host = await db.user.findUnique({
        where: { email: "host@stayhub.com" },
      });
      assert.ok(
        host && host.role !== "ADMIN" && host.passwordHash,
        "Existing non-admin host with password required"
      );
      const before = await counts(db);
      if (!execute)
        return {
          mode: "DRY_RUN",
          before,
          host: { role: host.role, status: host.status },
          imagesVerified: 60,
          dependencies,
          proposedProperties: 20,
        };
      const passwordHash = host.passwordHash;
      host = await db.user.update({
        where: { id: host.id },
        data: { role: "HOST", status: "ACTIVE" },
      });
      const unchanged = await preserved(db);
      const old = await db.property.findMany({ select: { id: true } });
      await db.review.deleteMany({});
      await db.payment.deleteMany({});
      await db.booking.deleteMany({});
      await db.property.deleteMany({});
      for (const { images, ...property } of rows)
        await db.property.create({
          data: { ...property, hostId: host.id, images: { create: images } },
        });
      const actual = await db.property.findMany({ include: { images: true } });
      validateDataset(
        actual.map((row) => ({
          ...row,
          pricePerNight: Number(row.pricePerNight),
          cleaningFee: Number(row.cleaningFee),
        }))
      );
      assert.ok(
        actual.every(
          (row) =>
            row.hostId === host.id && !old.some(({ id }) => id === row.id)
        )
      );
      const after = await counts(db);
      assert.equal(after.booking + after.payment + after.review, 0);
      assert.equal(after.propertyImage, 60);
      assert.equal(await preserved(db), unchanged, "Unrelated records changed");
      const finalHost = await db.user.findUnique({ where: { id: host.id } });
      assert.ok(
        finalHost.role === "HOST" &&
          finalHost.status === "ACTIVE" &&
          finalHost.passwordHash === passwordHash
      );
      return {
        mode: "EXECUTED",
        before,
        after,
        host: { role: finalHost.role, status: finalHost.status },
        passwordPreserved: true,
        unrelatedRecordsPreserved: true,
        oldPropertyIdsAbsent: true,
        imagesVerified: 60,
      };
    },
    { timeout: 30000, isolationLevel: "Serializable" }
  );
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

try {
  await main();
} catch (error) {
  // Prisma connection/query errors may contain credentials; never print raw errors.
  process.stderr.write(
    `Demo reset stopped safely: ${error instanceof assert.AssertionError ? error.message : "operation failed (details suppressed to protect credentials)"}\n`
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
