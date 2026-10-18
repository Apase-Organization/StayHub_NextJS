/* eslint-disable @typescript-eslint/no-require-imports -- Isolated production service with a transactional database mock. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
let state, rejectPromotion;
function client(getState) {
  return {
    property: {
      create: async ({ data }) => {
        assert.equal("amenityIds" in data, false);
        getState().properties.push(data);
        return {
          ...data,
          images: [],
          amenities: [],
          host: { id: data.hostId },
        };
      },
    },
    user: {
      updateMany: async ({ where, data }) => {
        if (rejectPromotion) throw new Error("promotion failed");
        if (getState().role === where.role) getState().role = data.role;
        assert.equal(where.id, "owner");
        return { count: 1 };
      },
    },
  };
}
const prisma = client(() => state);
prisma.$transaction = async (operation) => {
  const pending = structuredClone(state);
  const result = await operation(client(() => pending));
  state = pending;
  return result;
};
const exportsObject = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync("src/services/property.service.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
  ).outputText,
  {
    exports: exportsObject,
    require: (id) => {
      assert.equal(id, "@/lib/prisma");
      return { prisma };
    },
  }
);
const input = { title: "Listing", amenityIds: [] };
(async () => {
  state = { role: "GUEST", properties: [] };
  await exportsObject.createProperty("owner", input);
  assert.equal(
    state.role,
    "HOST",
    "publishing and promotion must commit together"
  );
  assert.equal(state.properties.length, 1);
  assert.equal(state.properties[0].status, "ACTIVE");
  state = { role: "GUEST", properties: [] };
  rejectPromotion = true;
  await assert.rejects(
    exportsObject.createProperty("owner", input),
    /promotion failed/
  );
  assert.equal(
    state.properties.length,
    0,
    "failed promotion must roll back publication"
  );
  assert.equal(state.role, "GUEST");
  rejectPromotion = false;
  state = { role: "ADMIN", properties: [] };
  await exportsObject.createProperty("owner", input);
  assert.equal(
    state.role,
    "ADMIN",
    "never downgrade a current admin from a stale session"
  );
  process.stdout.write("Property onboarding smoke passed\n");
})().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});
