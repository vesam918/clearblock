import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_SETTINGS,
  buildAllowRule,
  buildCustomBlockRule,
  buildPauseRule,
  getYoutubeAdAction,
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

test("YouTube ads remain filtered even when legacy compatibility was enabled", () => {
  assert.equal(getYoutubeAdAction({
    enabled: true,
    blockAds: true,
    youtubeCompatibility: true,
  }), "block");
});

test("YouTube ad filtering follows master and advertising controls", () => {
  assert.equal(getYoutubeAdAction({ enabled: false, blockAds: true }), "allow");
  assert.equal(getYoutubeAdAction({ enabled: true, blockAds: false }), "allow");
  assert.equal(getYoutubeAdAction({ enabled: true, blockAds: true }), "block");
});

test("nextRuleId returns the first available id in the selected range", () => {
  assert.equal(nextRuleId([{ id: 1_000_001 }, { id: 1_000_003 }], 1_000_001, 1_999_999), 1_000_002);
});
