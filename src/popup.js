import { api, announce, currentDomain } from "./ui.js";

const toggle = document.querySelector("#enabled");
const siteButton = document.querySelector("#site-toggle");
const settingsButton = document.querySelector("#settings");
let state;
let domain;

function render() {
  toggle.checked = state.settings.enabled;
  document.body.classList.toggle("disabled", !state.settings.enabled);
  document.querySelector("#total").textContent = state.stats.total.toLocaleString();
  document.querySelector("#mode").textContent = state.settings.enabled ? "Protection active" : "Protection paused";
  document.querySelector("#mode-detail").textContent = state.settings.enabled
    ? "Ads, trackers and annoyances are being filtered."
    : "All packaged filters are currently disabled.";
  document.querySelector("#domain").textContent = domain || "This page cannot be filtered";
  const allowed = domain && state.allowlist.includes(domain);
  siteButton.disabled = !domain;
  siteButton.textContent = allowed ? "Resume protection here" : "Allow this site";
  siteButton.dataset.allowed = String(Boolean(allowed));
}

async function start() {
  [state, domain] = await Promise.all([api.state(), currentDomain()]);
  render();
}

toggle.addEventListener("change", async () => {
  try {
    const response = await api.settings({ ...state.settings, enabled: toggle.checked });
    state.settings = response.settings;
    render();
    announce(toggle.checked ? "Protection enabled" : "Protection paused");
  } catch (error) {
    toggle.checked = !toggle.checked;
    announce(error.message, true);
  }
});

siteButton.addEventListener("click", async () => {
  const currentlyAllowed = siteButton.dataset.allowed === "true";
  try {
    const response = await api.domain(domain, "allow", !currentlyAllowed);
    state.allowlist = response.list;
    render();
    announce(currentlyAllowed ? "Protection resumed for this site" : "Site added to allowlist");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) await chrome.tabs.reload(tab.id);
  } catch (error) {
    announce(error.message, true);
  }
});

settingsButton.addEventListener("click", () => chrome.runtime.openOptionsPage());
start().catch((error) => announce(error.message, true));
