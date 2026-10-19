const AD_SELECTORS = [
  "ytd-display-ad-renderer",
  "ytd-promoted-sparkles-web-renderer",
  "ytd-promoted-video-renderer",
  "ytd-in-feed-ad-layout-renderer",
  "ytd-ad-slot-renderer",
  "ytd-player-legacy-desktop-watch-ads-renderer",
  "ytm-promoted-sparkles-web-renderer",
  ".ytd-banner-promo-renderer",
  ".video-ads",
  ".ytp-ad-overlay-container",
];

let protectionEnabled = true;
let advertisingEnabled = true;

function removeRenderedAds(root = document) {
  if (!protectionEnabled || !advertisingEnabled) return;
  for (const selector of AD_SELECTORS) {
    root.querySelectorAll?.(selector).forEach((element) => element.remove());
  }
}

const observer = new MutationObserver((records) => {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      if (AD_SELECTORS.some((selector) => node.matches?.(selector))) node.remove();
      else removeRenderedAds(node);
    }
  }
});

chrome.storage.local.get("settings", ({ settings = {} }) => {
  protectionEnabled = settings.enabled !== false;
  advertisingEnabled = settings.blockAds !== false;
  if (!protectionEnabled || !advertisingEnabled) return;
  removeRenderedAds();
  observer.observe(document.documentElement, { childList: true, subtree: true });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.settings) return;
  const settings = changes.settings.newValue || {};
  protectionEnabled = settings.enabled !== false;
  advertisingEnabled = settings.blockAds !== false;
  if (protectionEnabled && advertisingEnabled) {
    removeRenderedAds();
    observer.observe(document.documentElement, { childList: true, subtree: true });
  } else {
    observer.disconnect();
  }
});
