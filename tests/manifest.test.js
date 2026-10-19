import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../src/manifest.json", import.meta.url), "utf8"));

test("extension uses Manifest V3 with a module service worker", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.background, { service_worker: "background.js", type: "module" });
});

test("extension declares only the permissions used by the implementation", () => {
  assert.deepEqual(
    manifest.permissions.sort(),
    ["declarativeNetRequest", "declarativeNetRequestFeedback", "storage", "tabs"].sort(),
  );
  assert.deepEqual(manifest.host_permissions, ["<all_urls>"]);
});

test("all packaged rulesets start enabled", () => {
  assert.ok(manifest.declarative_net_request.rule_resources.length >= 3);
  assert.ok(manifest.declarative_net_request.rule_resources.every((ruleset) => ruleset.enabled));
});

test("YouTube cleanup runs only on YouTube pages", () => {
  assert.deepEqual(manifest.content_scripts, [{
    matches: ["https://www.youtube.com/*", "https://m.youtube.com/*"],
    js: ["youtube.js"],
    run_at: "document_start",
  }]);
});
