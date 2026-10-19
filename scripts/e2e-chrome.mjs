import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const endpoint = `http://127.0.0.1:${process.env.CLEARBLOCK_CDP_PORT || "9333"}`;
const targets = await (await fetch(`${endpoint}/json`)).json();
const extensionTarget = targets.find(({ type, url }) => type === "service_worker" && url.startsWith("chrome-extension://"));
assert.ok(extensionTarget, "ClearBlock service worker did not start");
const extensionId = new URL(extensionTarget.url).hostname;

async function open(path) {
  const pageUrl = `chrome-extension://${extensionId}/${path}`;
  const target = await (await fetch(`${endpoint}/json/new?about:blank`, { method: "PUT" })).json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolveOpen, reject) => {
    socket.addEventListener("open", resolveOpen, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message);
      pending.delete(message.id);
    }
  });
  const send = (method, params = {}) => new Promise((resolveMessage) => {
    id += 1;
    pending.set(id, resolveMessage);
    socket.send(JSON.stringify({ id, method, params }));
  });
  await send("Page.enable");
  await send("Page.navigate", { url: pageUrl });
  let page;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await send("Runtime.evaluate", { expression: "({title:document.title,text:document.body.innerText,ready:document.readyState,width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight})", returnByValue: true });
    page = result.result.result.value;
    if (page?.ready === "complete" && page?.text?.includes("ClearBlock")) break;
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  assert.equal(page?.ready, "complete");
  assert.ok(page?.text?.includes("ClearBlock"), `Failed to load ${path}: ${JSON.stringify(page)}`);
  const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  const output = resolve(import.meta.dirname, `../release/${path.replace(".html", "")}.png`);
  await writeFile(output, Buffer.from(screenshot.result.data, "base64"));
  socket.close();
  return { ...page, screenshot: output };
}

const popup = await open("popup.html");
assert.ok(popup.text.includes("Protection active"));
assert.ok(popup.text.includes("requests blocked"));
const options = await open("options.html");
assert.ok(options.text.includes("Advertising"));
assert.ok(options.text.includes("Custom blocklist"));
assert.ok(options.text.includes("Private by design"));
console.log(JSON.stringify({ extensionId, popup, options }, null, 2));
