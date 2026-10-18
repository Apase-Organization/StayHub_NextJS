/* eslint-disable @typescript-eslint/no-require-imports -- Isolated route smoke with mocked external dependencies. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
let images, deleted;
const matches = (image, where) =>
  Object.entries(where).every(([key, value]) => image[key] === value);
const model = {
  findUnique: async ({ where }) =>
    images.find((image) => matches(image, where)),
  findFirst: async ({ where }) => images.find((image) => matches(image, where)),
  delete: async ({ where }) => {
    images = images.filter((image) => !matches(image, where));
  },
  update: async ({ where, data }) =>
    Object.assign(
      images.find((image) => matches(image, where)),
      data
    ),
  updateMany: async ({ where, data }) =>
    images
      .filter((image) => matches(image, where))
      .forEach((image) => Object.assign(image, data)),
};
const mocks = {
  "next/server": { NextResponse: Response },
  "@/lib/api-response": {
    fail: (message) => ({ success: false, message }),
    ok: (data) => ({ success: true, data }),
  },
  "@/lib/auth": { auth: async () => ({ user: { id: "host", role: "HOST" } }) },
  "@/lib/cloudinary": { deleteImage: async (id) => deleted.push(id) },
  "@/lib/prisma": {
    prisma: {
      property: { findUnique: async () => ({ hostId: "host" }) },
      propertyImage: model,
      $transaction: async (operations) => Promise.all(operations),
    },
  },
};
const moduleObject = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync("src/app/api/properties/[id]/images/route.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
  ).outputText,
  {
    exports: moduleObject.exports,
    require: (id) => {
      assert.ok(mocks[id], id);
      return mocks[id];
    },
    URL,
    Buffer,
    process,
  }
);
const route = moduleObject.exports;
const reset = () => {
  images = [
    { id: "a", propertyId: "A", publicId: "pa", isCover: true },
    { id: "a2", propertyId: "A", publicId: "pa2", isCover: false },
    { id: "b", propertyId: "B", publicId: "pb", isCover: true },
  ];
  deleted = [];
};
const context = { params: Promise.resolve({ id: "A" }) };
(async () => {
  for (const method of ["DELETE", "PATCH"]) {
    reset();
    const before = structuredClone(images);
    const response = await route[method](
      new Request("https://example.test/api?imageId=b", {
        method,
        ...(method === "PATCH"
          ? { body: JSON.stringify({ imageId: "b" }) }
          : {}),
      }),
      context
    );
    assert.equal(
      response.status,
      404,
      `${method} must reject another property's image`
    );
    assert.deepEqual(images, before);
    assert.deepEqual(deleted, []);
  }
  reset();
  assert.equal(
    (
      await route.PATCH(
        new Request("https://example.test", {
          method: "PATCH",
          body: JSON.stringify({ imageId: "a2" }),
        }),
        context
      )
    ).status,
    200
  );
  assert.equal(images.find((image) => image.id === "a").isCover, false);
  assert.equal(images.find((image) => image.id === "a2").isCover, true);
  reset();
  assert.equal(
    (
      await route.DELETE(
        new Request("https://example.test?imageId=a", { method: "DELETE" }),
        context
      )
    ).status,
    200
  );
  assert.deepEqual(deleted, ["pa"]);
  assert.equal(images.find((image) => image.id === "a2").isCover, true);
  assert.equal(images.find((image) => image.id === "b").isCover, true);
  process.stdout.write("Property image route smoke passed\n");
})().catch((error) => {
  process.stderr.write(`${error.stack ?? error}\n`);
  process.exitCode = 1;
});
