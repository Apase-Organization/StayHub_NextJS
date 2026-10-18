import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dataset,
  validateDataset,
  authorizeReset,
} from "./demo-properties.mjs";

test("20 valid demo listings with three distinct destination images", () => {
  const rows = dataset();
  assert.equal(rows.length, 20);
  validateDataset(rows);
});

test("reject duplicate listings and incomplete destructive consent", () => {
  const rows = dataset();
  rows[1] = rows[0];
  assert.throws(() => validateDataset(rows));
  assert.throws(() => authorizeReset(["--execute"]));
  assert.equal(authorizeReset([]), false);
  assert.equal(
    authorizeReset(["--execute", "--confirm=DELETE_ALL_DEMO_PROPERTIES"]),
    true
  );
});
