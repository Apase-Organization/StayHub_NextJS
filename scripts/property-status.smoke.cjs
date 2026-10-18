/* eslint-disable @typescript-eslint/no-require-imports -- Isolated production schema/service smoke. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, dependencies) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      exports,
      require: (id) => {
        assert.ok(id in dependencies, id);
        return dependencies[id];
      },
    }
  );
  return exports;
}
const { propertyUpdateSchema } = load("src/schemas/property.schema.ts", {
  zod: require("zod"),
});
let mutation;
const service = load("src/services/property.service.ts", {
  "@/lib/prisma": {
    prisma: {
      property: {
        update: async ({ data }) => {
          mutation = data;
          return { ...data, images: [], amenities: [], host: { id: "owner" } };
        },
      },
    },
  },
});
(async () => {
  // New status-only operation must not reset the listing's fee or amenities.
  await service.updateProperty(
    "property",
    propertyUpdateSchema.parse({ status: "INACTIVE" })
  );
  assert.equal(mutation.status, "INACTIVE");
  assert.equal(
    "cleaningFee" in mutation,
    false,
    "status toggle must preserve cleaning fee"
  );
  assert.equal(
    "amenities" in mutation,
    false,
    "status toggle must preserve amenities"
  );

  // Explicit zero/empty updates still intentionally clear the fee and amenities.
  await service.updateProperty(
    "property",
    propertyUpdateSchema.parse({
      status: "ACTIVE",
      cleaningFee: 0,
      amenityIds: [],
    })
  );
  assert.equal(mutation.cleaningFee, 0);
  assert.equal(mutation.amenities.create.length, 0);
  assert.ok(mutation.amenities.deleteMany);
  assert.equal(
    propertyUpdateSchema.safeParse({ status: "DELETED" }).success,
    false
  );
  process.stdout.write("Property status smoke passed\n");
})().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});
