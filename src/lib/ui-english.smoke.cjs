/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node smoke runner. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const detail = read("app/(guest)/bookings/[id]/page.tsx");
assert.ok(
  detail.includes("Booking Details #"),
  "booking detail heading is English"
);
const hero = read("components/property/HeroSearchBar.tsx");
assert.ok(
  hero.includes("setLocation(dest.name)"),
  "destination selection retains original query value"
);
assert.ok(
  hero.includes("setLocation(e.target.value)"),
  "Unicode typing remains unchanged"
);
assert.ok(
  hero.includes("displayPlace(dest.name)"),
  "destination labels use display-only transliteration"
);
const helper = { exports: {} };
new Function(
  "exports",
  ts.transpileModule(read("lib/auth-ui.ts"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText
)(helper.exports);
assert.equal(helper.exports.displayPlace("Đà Nẵng"), "Da Nang");
assert.equal(
  helper.exports.displayPlace("Đa\u0300 Na\u0306\u0303ng"),
  "Da Nang"
);
for (const file of [
  "components/booking/BookingForm.tsx",
  "app/(guest)/properties/[id]/book/page.tsx",
  "app/(guest)/bookings/[id]/page.tsx",
  "app/(guest)/payments/vnpay/return/page.tsx",
]) {
  const source = ts.createSourceFile(
    file,
    read(file),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const visit = (node) => {
    if (
      ts.isStringLiteralLike(node) ||
      ts.isJsxText(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node)
    ) {
      assert.doesNotMatch(
        node.text.replace(/[×÷]/g, ""),
        /[\u00c0-\u00ff\u0102-\u0103\u0110-\u0111\u0128-\u0129\u0168-\u0169\u01a0-\u01b0\u1ea0-\u1ef9]/u,
        `${file}: static copy is English`
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}
const form = read("components/booking/BookingForm.tsx");
assert.ok(form.includes("displayPlace(property.city)"));
assert.ok(form.includes("displayPlace(property.address)"));
assert.ok(
  form.includes('setPromoError("Please enter a promo code")'),
  "empty promo input has an English error"
);
assert.ok(
  form.includes("discountCode: appliedPromo?.code || undefined"),
  "promo submission logic is retained"
);
process.stdout.write(
  "English UI smoke passed (copy, display and Unicode query preservation)\n"
);
