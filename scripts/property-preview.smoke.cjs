/* eslint-disable @typescript-eslint/no-require-imports -- Isolated component lifecycle regression. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const states = [],
  effects = [],
  refs = [];
let cursor, effectCursor, refCursor;
const revoked = [];
let mutation;
let uploadFails = false;
const messages = [];
const React = {
  useState(initial) {
    const index = cursor++;
    if (!(index in states)) states[index] = initial;
    return [
      states[index],
      (value) => {
        states[index] =
          typeof value === "function" ? value(states[index]) : value;
      },
    ];
  },
  useRef(initial) {
    const index = refCursor++;
    return (refs[index] ??= { current: initial });
  },
  useEffect(callback, deps) {
    const index = effectCursor++;
    const old = effects[index];
    if (!old || deps.some((value, i) => value !== old.deps[i])) {
      old?.cleanup?.();
      effects[index] = { deps, cleanup: callback() };
    }
  },
};
const exportsObject = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync("src/components/host/AddPropertyModal.tsx", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }
  ).outputText,
  {
    exports: exportsObject,
    require(id) {
      if (id === "react") return React;
      if (id === "react/jsx-runtime")
        return { jsx: () => null, jsxs: () => null };
      if (id === "@tanstack/react-query")
        return {
          useQueryClient: () => ({ invalidateQueries() {} }),
          useMutation: (options) => {
            mutation = options;
            return {};
          },
        };
      return {};
    },
    URL: { revokeObjectURL: (url) => revoked.push(url) },
    FormData,
    fetch: async (url) => {
      if (url === "/api/properties")
        return {
          ok: true,
          json: async () => ({ success: true, data: { id: "created" } }),
        };
      if (uploadFails === "network") throw new Error("Network unavailable");
      if (uploadFails === "http")
        return { ok: false, json: async () => ({ success: false }) };
      return { ok: true, json: async () => ({ success: true }) };
    },
  }
);
function render() {
  cursor = effectCursor = refCursor = 0;
  exportsObject.AddPropertyModal({
    open: true,
    onOpenChange() {},
    onSuccessToast(message) {
      messages.push(message);
    },
  });
}
render();
states[2] = ["blob:first"];
render();
assert.deepEqual(revoked, [], "initial preview remains live");
states[2] = ["blob:first", "blob:second"];
render();
assert.deepEqual(
  revoked,
  [],
  "adding a photo must not revoke retained previews"
);
effects.forEach((effect) => effect.cleanup?.());
assert.deepEqual(
  revoked.sort(),
  ["blob:first", "blob:second"],
  "unmount releases all live previews"
);
(async () => {
  states[1] = [new Blob(["image"])];
  for (const fails of [false, "network", "http"]) {
    uploadFails = fails;
    render();
    const result = await mutation.mutationFn();
    mutation.onSuccess(result);
    assert.equal(
      messages.at(-1).includes("Cloudinary thành công"),
      !fails,
      "photo failure must not be reported as successful upload"
    );
    if (fails) assert.match(messages.at(-1), /ảnh.*(lỗi|thất bại|chưa)/i);
    states[1] = [new Blob(["image"])];
  }
  process.stdout.write("Property preview and upload smoke passed\n");
})().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});
