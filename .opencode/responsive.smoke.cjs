/* eslint-disable @typescript-eslint/no-require-imports, no-console -- Standalone CommonJS smoke runner uses Node module hooks. */
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const assert = require("node:assert/strict");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
require.extensions[".tsx"] = require.extensions[".ts"] = (module, filename) => {
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText,
    filename
  );
};
const original = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return original.call(
    this,
    name.startsWith("@/") ? path.join(root, "src", name.slice(2)) : name,
    ...args
  );
};
const {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} = require("../src/components/ui/tabs.tsx");
for (const orientation of ["horizontal", "vertical"]) {
  const html = renderToStaticMarkup(
    React.createElement(
      Tabs,
      { orientation, defaultValue: "a" },
      React.createElement(
        TabsList,
        {},
        React.createElement(TabsTrigger, { value: "a" }, "A"),
        React.createElement(TabsTrigger, { value: "b" }, "B")
      ),
      React.createElement(TabsContent, { value: "a" }, "selected booking"),
      React.createElement(TabsContent, { value: "b" }, "other booking")
    )
  );
  assert.match(html, new RegExp(`aria-orientation="${orientation}"`));
  assert.match(html, /data-\[orientation=horizontal\]:flex-col/);
  assert.match(html, /data-\[state=active\]:bg-background/);
  assert.ok(
    html.includes("selected booking") && !html.includes("other booking")
  );
}
const page = fs.readFileSync(
  path.join(root, "src/app/(guest)/bookings/page.tsx"),
  "utf8"
);
assert.match(
  page,
  /bookings\.filter\(\(booking\) => booking\.status === activeTab\)/
);
assert.match(page, /\["userBookings", activeTab\]/);
for (const label of ["Upcoming", "Pending", "Completed", "Cancelled"])
  assert.ok(page.includes(`>${label}</TabsTrigger>`));
assert.match(page, /grid w-full grid-cols-4/);
const source = ts.createSourceFile(
  "bookings.tsx",
  page,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);
let filterExpression;
function visit(node) {
  if (
    ts.isCallExpression(node) &&
    node.expression.getText(source) === "bookings.filter"
  )
    filterExpression = node.getText(source);
  ts.forEachChild(node, visit);
}
visit(source);
const filter = new Function(
  "bookings",
  "activeTab",
  `return ${filterExpression}`
);
const statuses = ["CONFIRMED", "PENDING_PAYMENT", "COMPLETED", "CANCELLED"];
const fixtures = statuses.map((status, id) => ({ id, status }));
for (const status of statuses) {
  assert.deepEqual(
    filter(fixtures, status),
    fixtures.filter((item) => item.status === status)
  );
  assert.deepEqual(filter([], status), []);
}
console.log(
  "PASS: real Radix SSR horizontal/vertical state, inactive-panel exclusion, and My Trips filter/layout contracts"
);
