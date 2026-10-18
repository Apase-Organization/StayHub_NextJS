/* eslint-disable @typescript-eslint/no-require-imports -- Isolated runtime smoke with mocked external services. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { test } = require("node:test");

function load(relative, mocks = {}) {
  const filename = path.resolve(__dirname, "../..", relative);
  const loaded = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  new Function("require", "module", "exports", code)(
    (id) => {
      if (id in mocks) return mocks[id];
      if (id.startsWith("@/")) return load(`src/${id.slice(2)}.ts`, mocks);
      return require(id);
    },
    loaded,
    loaded.exports
  );
  return loaded.exports;
}

test("session update reloads persisted profile, never client claims", async () => {
  let config;
  const persisted = {
    id: "u1",
    fullName: "Saved Name",
    email: "saved@example.com",
    avatarUrl: "https://res.cloudinary.com/demo/image/upload/avatar.png",
    role: "GUEST",
    status: "ACTIVE",
  };
  load("src/lib/auth.ts", {
    "next-auth": (options) => {
      config = options;
      return {};
    },
    "next-auth/providers/credentials": (options) => options,
    "next-auth/providers/google": (options) => options,
    "@/lib/prisma": {
      prisma: {
        user: {
          findUnique: async ({ where }) => {
            assert.equal(where.id, "u1");
            return persisted;
          },
        },
      },
    },
  });
  const token = await config.callbacks.jwt({
    token: { id: "u1", role: "GUEST", name: "Old", image: "old" },
    trigger: "update",
    session: { name: "Forged", role: "ADMIN", image: "evil" },
  });
  assert.equal(token.name, persisted.fullName);
  assert.equal(token.image, persisted.avatarUrl);
  assert.equal(token.role, "GUEST");
  persisted.avatarUrl = null;
  const cleared = await config.callbacks.jwt({ token, trigger: "update" });
  const session = config.callbacks.session({
    session: { user: { image: "old" } },
    token: cleared,
  });
  assert.equal(session.user.image, null);
});

test("avatar hosts work with Next image validation; arbitrary hosts stay blocked", () => {
  const {
    hasRemoteMatch,
  } = require("next/dist/shared/lib/match-remote-pattern");
  const config = load("next.config.ts").default;
  for (const url of [
    "https://res.cloudinary.com/demo/image/upload/avatar.png",
    "https://lh3.googleusercontent.com/a/avatar",
  ])
    assert.equal(
      hasRemoteMatch([], config.images.remotePatterns, new URL(url)),
      true,
      url
    );
  assert.equal(
    hasRemoteMatch(
      [],
      config.images.remotePatterns,
      new URL("https://attacker.example/avatar")
    ),
    false
  );
});

test("email change clears verification and invalidates old OTPs atomically; unchanged email preserves it", async () => {
  const writes = [];
  let inTransaction = false;
  const user = { id: "u1", email: "old@example.com", provider: "LOCAL" };
  const db = {
    user: {
      findUnique: async ({ where }) => (where.id ? user : null),
      update: async ({ data }) => {
        writes.push({ data, inTransaction });
        return { ...user, ...data };
      },
    },
    verificationToken: {
      updateMany: async (args) => {
        assert.equal(inTransaction, true);
        assert.equal(args.where.userId, "u1");
        writes.push({ invalidated: true });
      },
    },
    $transaction: async (callback) => {
      inTransaction = true;
      try {
        return await callback(db);
      } finally {
        inTransaction = false;
      }
    },
  };
  const { PATCH } = load("src/app/api/user/profile/route.ts", {
    "@/lib/auth": { auth: async () => ({ user: { id: "u1" } }) },
    "@/lib/prisma": { prisma: db },
  });
  const request = (email) =>
    new Request("http://localhost/api/user/profile", {
      method: "PATCH",
      body: JSON.stringify({ email, fullName: "Saved" }),
    });
  assert.equal((await PATCH(request("new@example.com"))).status, 200);
  const update = writes.find((entry) => entry.data);
  assert.equal(update.data.emailVerified, null);
  assert.equal(update.inTransaction, true);
  assert.equal(
    writes.some((entry) => entry.invalidated),
    true
  );
  writes.length = 0;
  assert.equal((await PATCH(request("OLD@example.com"))).status, 200);
  assert.equal(
    "emailVerified" in writes.find((entry) => entry.data).data,
    false
  );
  assert.equal(
    writes.some((entry) => entry.invalidated),
    false
  );
});
