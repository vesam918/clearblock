export const api = {
  async send(message) {
    const response = await chrome.runtime.sendMessage(message);
    if (response?.error) throw new Error(response.error);
    return response;
  },
  async state() {
    return this.send({ type: "GET_STATE" });
  },
  async settings(settings) {
    return this.send({ type: "SET_SETTINGS", settings });
  },
  async domain(domain, kind, enabled) {
    return this.send({ type: "SET_DOMAIN", domain, kind, enabled });
  },
};

export function escapeHtml(value) {
  const node = document.createElement("span");
  node.textContent = value;
  return node.innerHTML;
}

export function announce(message, isError = false) {
  const status = document.querySelector("#status");
  if (!status) return;
  status.textContent = message;
  status.classList.toggle("error", isError);
  window.setTimeout(() => { status.textContent = ""; }, 2500);
}

export async function currentDomain() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    const url = new URL(tab.url);
    return /^https?:$/.test(url.protocol) ? url.hostname.replace(/^www\./, "") : null;
  } catch {
    return null;
  }
}
