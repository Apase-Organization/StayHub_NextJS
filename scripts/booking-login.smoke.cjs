/* eslint-disable @typescript-eslint/no-require-imports -- Isolated page redirect smoke. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const output = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync("src/app/(guest)/properties/[id]/book/page.tsx", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }
  ).outputText,
  {
    exports: output,
    URLSearchParams,
    encodeURIComponent,
    require(id) {
      if (id === "@/lib/auth") return { auth: async () => null };
      if (id === "next/navigation")
        return {
          redirect: (url) => {
            throw new Error(url);
          },
        };
      return {};
    },
  }
);
(async () => {
  for (const query of [
    {},
    { checkIn: "2026-12-01", checkOut: "2026-12-04", guests: "3" },
  ]) {
    let location;
    try {
      await output.default({
        params: Promise.resolve({ id: "property-1" }),
        searchParams: Promise.resolve(query),
      });
    } catch (error) {
      location = error.message;
    }
    const login = new URL(location, "https://example.test");
    assert.equal(login.pathname, "/login");
    const callback = new URL(
      login.searchParams.get("callbackUrl"),
      login.origin
    );
    assert.equal(callback.pathname, "/properties/property-1/book");
    for (const [key, value] of Object.entries(query))
      assert.equal(callback.searchParams.get(key), value);
  }
  process.stdout.write("Booking login redirect smoke passed\n");
})().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});
