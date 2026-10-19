import {
  buildAllowRule,
  buildCustomBlockRule,
  buildPauseRule,
  buildSiteCompatibilityRules,
  nextRuleId,
  normalizeDomain,
  sanitizeSettings,
} from "./core.js";

const SETTINGS_KEY = "settings";
const STATS_KEY = "stats";
const ALLOWLIST_KEY = "allowlist";
const CUSTOM_BLOCKLIST_KEY = "customBlocklist";
const RULESETS = { blockAds: "ads", blockTrackers: "trackers", blockAnnoyances: "annoyances" };
const ALLOW_RANGE = [1_000_001, 1_999_999];
const BLOCK_RANGE = [2_000_001, 2_999_999];
const PAUSE_RULE_ID = 3_000_001;
const YOUTUBE_COMPATIBILITY_RULE_IDS = [3_100_001, 3_100_002];

async function getState() {
  const stored = await chrome.storage.local.get([
    SETTINGS_KEY,
    STATS_KEY,
    ALLOWLIST_KEY,
    CUSTOM_BLOCKLIST_KEY,
  ]);
  return {
    settings: sanitizeSettings(stored[SETTINGS_KEY]),
    stats: { total: 0, ...(stored[STATS_KEY] || {}) },
    allowlist: Array.isArray(stored[ALLOWLIST_KEY]) ? stored[ALLOWLIST_KEY] : [],
    customBlocklist: Array.isArray(stored[CUSTOM_BLOCKLIST_KEY])
      ? stored[CUSTOM_BLOCKLIST_KEY]
      : [],
  };
}

async function applySettings(settings) {
  const normalized = sanitizeSettings(settings);
  const enabledRulesets = Object.entries(RULESETS).filter(([key]) => normalized[key]).map(([, id]) => id);
  const disabledRulesets = Object.values(RULESETS).filter((id) => !enabledRulesets.includes(id));
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: enabledRulesets,
    disableRulesetIds: disabledRulesets,
  });

  const dynamicRules = await chrome.declarativeNetRequest.getDynamicRules();
  const managedRuleIds = [PAUSE_RULE_ID, ...YOUTUBE_COMPATIBILITY_RULE_IDS];
  const installedManagedRuleIds = dynamicRules
    .filter(({ id }) => managedRuleIds.includes(id))
    .map(({ id }) => id);
  const addRules = [];
  if (!normalized.enabled) addRules.push(buildPauseRule(PAUSE_RULE_ID));
  if (normalized.youtubeCompatibility) {
    addRules.push(...buildSiteCompatibilityRules("youtube", YOUTUBE_COMPATIBILITY_RULE_IDS[0]));
  }
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: installedManagedRuleIds,
    addRules,
  });
  await chrome.storage.local.set({ [SETTINGS_KEY]: normalized });
  return normalized;
}

async function replaceDomainRule(domainValue, kind, shouldAdd) {
  const domain = normalizeDomain(domainValue);
  if (!domain) throw new Error("Enter a valid public domain.");
  const state = await getState();
  const key = kind === "allow" ? ALLOWLIST_KEY : CUSTOM_BLOCKLIST_KEY;
  const range = kind === "allow" ? ALLOW_RANGE : BLOCK_RANGE;
  const list = kind === "allow" ? state.allowlist : state.customBlocklist;
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  const matchingRules = rules.filter((rule) => rule.id >= range[0] && rule.id <= range[1] && rule.condition.requestDomains?.includes(domain));
  const nextList = shouldAdd
    ? [...new Set([...list, domain])].sort()
    : list.filter((item) => item !== domain);
  const addRules = [];
  if (shouldAdd && matchingRules.length === 0) {
    const id = nextRuleId(rules, ...range);
    addRules.push(kind === "allow" ? buildAllowRule(domain, id) : buildCustomBlockRule(domain, id));
  }
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: matchingRules.map(({ id }) => id),
    addRules,
  });
  await chrome.storage.local.set({ [key]: nextList });
  return nextList;
}

async function resetStats() {
  const stats = { total: 0 };
  await chrome.storage.local.set({ [STATS_KEY]: stats });
  await chrome.action.setBadgeText({ text: "" });
  return stats;
}

async function initialize() {
  const state = await getState();
  await chrome.storage.local.set(state);
  await applySettings(state.settings);
}

chrome.runtime.onInstalled.addListener(() => void initialize());
chrome.runtime.onStartup.addListener(() => void initialize());

const pendingMatches = new Map();
let statsFlushTimer;

async function flushMatches() {
  statsFlushTimer = undefined;
  const matches = [...pendingMatches.entries()];
  pendingMatches.clear();
  if (matches.length === 0) return;

  const state = await getState();
  if (!state.settings.enabled) return;
  const total = state.stats.total + matches.reduce((sum, [, count]) => sum + count, 0);
  await chrome.storage.local.set({ [STATS_KEY]: { total } });
  if (state.settings.showBadge) {
    await chrome.action.setBadgeBackgroundColor({ color: "#6D5EF7" });
    await Promise.all(matches.filter(([tabId]) => tabId >= 0).map(([tabId, count]) =>
      chrome.action.setBadgeText({ tabId, text: count > 999 ? "999+" : String(count) }),
    ));
  }
}

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
  if (info.rule.rulesetId === "_dynamic" && info.rule.ruleId === PAUSE_RULE_ID) return;
  pendingMatches.set(info.tabId, (pendingMatches.get(info.tabId) || 0) + 1);
  if (!statsFlushTimer) statsFlushTimer = setTimeout(() => void flushMatches(), 250);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    pendingMatches.delete(tabId);
    void chrome.action.setBadgeText({ tabId, text: "" });
  }
});
chrome.tabs.onRemoved.addListener((tabId) => pendingMatches.delete(tabId));

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const respond = async () => {
    switch (message?.type) {
      case "GET_STATE": return getState();
      case "SET_SETTINGS": return { settings: await applySettings(message.settings) };
      case "SET_DOMAIN": return { list: await replaceDomainRule(message.domain, message.kind, message.enabled) };
      case "RESET_STATS": return { stats: await resetStats() };
      default: throw new Error("Unknown ClearBlock request.");
    }
  };
  respond().then(sendResponse).catch((error) => sendResponse({ error: error.message }));
  return true;
});

void initialize();
