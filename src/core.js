export const DEFAULT_SETTINGS = Object.freeze({
  enabled: true,
  blockAds: true,
  blockTrackers: true,
  blockAnnoyances: true,
  showBadge: true,
  youtubeCompatibility: false,
});

const DOMAIN_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

export function normalizeDomain(value) {
  if (typeof value !== "string") return null;
  const candidate = value.trim().toLowerCase();
  if (!candidate || /\s/.test(candidate)) return null;

  try {
    const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
    if (!/^https?:$/.test(url.protocol)) return null;
    const hostname = url.hostname.replace(/^www\./, "").replace(/\.$/, "");
    return DOMAIN_PATTERN.test(hostname) ? hostname : null;
  } catch {
    return null;
  }
}

export function sanitizeSettings(value = {}) {
  return Object.fromEntries(
    Object.entries(DEFAULT_SETTINGS).map(([key, fallback]) => [
      key,
      typeof value[key] === "boolean" ? value[key] : fallback,
    ]),
  );
}

export function nextRuleId(rules, minimum, maximum) {
  const used = new Set(rules.map(({ id }) => id));
  for (let id = minimum; id <= maximum; id += 1) {
    if (!used.has(id)) return id;
  }
  throw new Error("No dynamic rule IDs are available in this range.");
}

export function buildAllowRule(domain, id) {
  return {
    id,
    priority: 1000,
    action: { type: "allowAllRequests" },
    condition: {
      requestDomains: [domain],
      resourceTypes: ["main_frame"],
    },
  };
}

export function buildCustomBlockRule(domain, id) {
  return {
    id,
    priority: 10,
    action: { type: "block" },
    condition: {
      requestDomains: [domain],
      resourceTypes: [
        "main_frame",
        "sub_frame",
        "stylesheet",
        "script",
        "image",
        "font",
        "object",
        "xmlhttprequest",
        "ping",
        "media",
        "websocket",
        "other",
      ],
    },
  };
}

export function buildPauseRule(id) {
  return {
    id,
    priority: 10_000,
    action: { type: "allowAllRequests" },
    condition: { urlFilter: "http", resourceTypes: ["main_frame"] },
  };
}

export function getYoutubeAdAction(settings) {
  const normalized = sanitizeSettings(settings);
  return normalized.enabled && normalized.blockAds ? "block" : "allow";
}
