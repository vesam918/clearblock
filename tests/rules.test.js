import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../src/manifest.json", import.meta.url), "utf8"));

for (const resource of manifest.declarative_net_request.rule_resources) {
  test(`${resource.id} is a substantial, valid DNR ruleset`, async () => {
    const rules = JSON.parse(await readFile(new URL(`../src/${resource.path}`, import.meta.url), "utf8"));
    assert.ok(rules.length >= 100, `${resource.id} only has ${rules.length} rules`);
    assert.equal(new Set(rules.map(({ id }) => id)).size, rules.length, "rule IDs must be unique within a ruleset");
    for (const rule of rules.slice(0, 100)) {
      assert.equal(typeof rule.id, "number");
      assert.ok(rule.action?.type);
      assert.ok(rule.condition);
    }
  });
}
