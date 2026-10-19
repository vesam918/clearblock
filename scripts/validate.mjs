import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "src");
const manifest = JSON.parse(await readFile(resolve(source, "manifest.json"), "utf8"));
const referenced = [
  manifest.action.default_popup,
  manifest.background.service_worker,
  manifest.options_page,
  ...Object.values(manifest.icons),
  ...manifest.declarative_net_request.rule_resources.map(({ path }) => path),
];

for (const path of referenced) await access(resolve(source, path), constants.R_OK);

const rules = [];
for (const resource of manifest.declarative_net_request.rule_resources) {
  const value = JSON.parse(await readFile(resolve(source, resource.path), "utf8"));
  if (!Array.isArray(value) || value.length === 0) throw new Error(`${resource.path} has no rules`);
  if (new Set(value.map(({ id }) => id)).size !== value.length) throw new Error(`${resource.path} has duplicate IDs`);
  rules.push([resource.id, value.length]);
}

if (manifest.manifest_version !== 3) throw new Error("Manifest V3 is required");
if (manifest.permissions.includes("webRequest")) throw new Error("Legacy webRequest permission is not allowed");
console.log(`Manifest ${manifest.version} valid (${rules.map(([id, count]) => `${id}: ${count}`).join(", ")})`);
console.log(`Validated from ${dirname(resolve(source, "manifest.json"))}`);
