import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_SETTINGS,
  buildAllowRule,
  buildCustomBlockRule,
  buildPauseRule,
  buildSiteCompatibilityRules,
  normalizeDomain,
  nextRuleId,
  sanitizeSettings,
} from "../src/core.js";

test("normalizeDomain accepts hostnames and URLs", () => {
  assert.equal(normalizeDomain("https://WWW.Example.com/path"), "example.com");
  assert.equal(normalizeDomain("sub.example.co.uk"), "sub.example.co.uk");
});

test("normalizeDomain rejects unsupported or malformed values", () => {
  assert.equal(normalizeDomain("chrome://extensions"), null);
  assert.equal(normalizeDomain("not a domain"), null);
  assert.equal(normalizeDomain("localhost"), null);
});

test("sanitizeSettings merges safe booleans with defaults", () => {
  assert.deepEqual(sanitizeSettings({ enabled: false, blockTrackers: "yes" }), {
    ...DEFAULT_SETTINGS,
    enabled: false,
  });
});

test("buildAllowRule creates a main-frame allow rule for a domain", () => {
  assert.deepEqual(buildAllowRule("example.com", 1_000_001), {
    id: 1_000_001,
    priority: 1000,
    action: { type: "allowAllRequests" },
    condition: {
      requestDomains: ["example.com"],
      resourceTypes: ["main_frame"],
    },
  });
});

test("buildCustomBlockRule blocks the domain and its subdomains", () => {
  const rule = buildCustomBlockRule("ads.example.com", 2_000_001);
  assert.equal(rule.id, 2_000_001);
  assert.equal(rule.action.type, "block");
  assert.deepEqual(rule.condition.requestDomains, ["ads.example.com"]);
});

test("buildPauseRule bypasses filtering globally", () => {
  assert.deepEqual(buildPauseRule(3_000_001), {
    id: 3_000_001,
    priority: 10_000,
    action: { type: "allowAllRequests" },
    condition: { urlFilter: "http", resourceTypes: ["main_frame"] },
  });
});

test("buildSiteCompatibilityRules relaxes filtering only for the configured site family", () => {
  assert.deepEqual(buildSiteCompatibilityRules("youtube", 3_100_001), [
    {
      id: 3_100_001,
      priority: 9_000,
      action: { type: "allowAllRequests" },
      condition: {
        requestDomains: ["youtube.com", "youtube-nocookie.com", "youtu.be"],
        resourceTypes: ["main_frame"],
      },
    },
    {
      id: 3_100_002,
      priority: 9_000,
      action: { type: "allow" },
      condition: {
        initiatorDomains: ["youtube.com", "youtube-nocookie.com", "youtu.be"],
        resourceTypes: [
          "main_frame", "sub_frame", "stylesheet", "script", "image", "font", "object",
          "xmlhttprequest", "ping", "media", "websocket", "other",
        ],
      },
    },
  ]);
});

test("buildSiteCompatibilityRules rejects unknown profiles", () => {
  assert.throws(() => buildSiteCompatibilityRules("unknown", 3_100_001), /Unknown compatibility profile/);
});

test("nextRuleId returns the first available id in the selected range", () => {
  assert.equal(nextRuleId([{ id: 1_000_001 }, { id: 1_000_003 }], 1_000_001, 1_999_999), 1_000_002);
});
