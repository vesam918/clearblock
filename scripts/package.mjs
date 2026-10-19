import archiver from "archiver";
import { createWriteStream } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const release = resolve(root, "release");
await mkdir(release, { recursive: true });
const manifest = JSON.parse(await readFile(resolve(root, "src/manifest.json"), "utf8"));
const target = resolve(release, `clearblock-chrome-v${manifest.version}.zip`);
const output = createWriteStream(target);
const archive = archiver("zip", { zlib: { level: 9 } });

const finished = new Promise((resolveFinished, reject) => {
  output.on("close", resolveFinished);
  output.on("error", reject);
  archive.on("error", reject);
});
archive.pipe(output);
archive.directory(resolve(root, "dist"), false);
await archive.finalize();
await finished;
console.log(`Packaged ${archive.pointer()} bytes: ${target}`);
