/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Node migration contract check. */
const assert = require("node:assert/strict");
const fs = require("node:fs");

// Offline deployment contract: existing users remain valid (both fields nullable).
const sql = fs.readFileSync(
  "prisma/migrations/20261019000000_add_user_profile/migration.sql",
  "utf8"
);
assert.match(sql, /ALTER TABLE "users"/);
for (const column of ["avatar_url", "bio"]) {
  assert.match(sql, new RegExp(`ADD COLUMN\\s+"${column}" TEXT(?:,|;)`));
}
assert.doesNotMatch(sql, /NOT NULL|DROP|DELETE|UPDATE|TRUNCATE/i);
assert.equal((sql.match(/ADD COLUMN/g) || []).length, 2);
process.stdout.write(
  "Profile migration smoke passed (nullable, additive users columns)\n"
);
