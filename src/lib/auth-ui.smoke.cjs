/* eslint-disable @typescript-eslint/no-require-imports -- Isolated Node CommonJS smoke runner with a TypeScript transpilation hook. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => {
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    filename
  );
};
const {
  registerSchema,
  verifyOtpSchema,
} = require("../schemas/auth.schema.ts");
const { displayPlace, authResponseSucceeded } = require("./auth-ui.ts");
assert.equal(
  registerSchema.safeParse({
    fullName: "Nguyễn An",
    email: "AN@example.com",
    password: "abcdefgh",
  }).success,
  true
);
assert.equal(
  verifyOtpSchema.safeParse({ email: "an@example.com", otp: "012345" }).success,
  true
);
assert.equal(
  verifyOtpSchema.safeParse({ email: "an@example.com", otp: "12345x" }).success,
  false
);
assert.equal(displayPlace("Đà Nẵng"), "Da Nang");
assert.equal(displayPlace("ĐẮK LẮK"), "DAK LAK");
assert.equal(
  authResponseSucceeded({
    success: true,
    data: null,
    errorCode: null,
    message: "OK",
  }),
  true
);
assert.equal(authResponseSucceeded({ success: true }), false);
process.stdout.write("Auth UI smoke passed\n");
