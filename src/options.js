import { api, announce, escapeHtml } from "./ui.js";

let state;
const form = document.querySelector("#settings-form");
const lists = {
  allow: document.querySelector("#allowlist"),
  block: document.querySelector("#blocklist"),
};

function renderList(kind, values) {
  const list = lists[kind];
  list.innerHTML = values.length
    ? values.map((domain) => `<li><span>${escapeHtml(domain)}</span><button type="button" data-kind="${kind}" data-domain="${escapeHtml(domain)}" aria-label="Remove ${escapeHtml(domain)}">Remove</button></li>`).join("")
    : `<li class="empty">No domains added.</li>`;
}

function render() {
  Object.entries(state.settings).forEach(([key, value]) => {
    const input = form.elements.namedItem(key);
    if (input) input.checked = value;
  });
  renderList("allow", state.allowlist);
  renderList("block", state.customBlocklist);
  document.querySelector("#total").textContent = state.stats.total.toLocaleString();
}

form.addEventListener("change", async () => {
  const settings = Object.fromEntries([...form.querySelectorAll("input[type=checkbox]")].map((input) => [input.name, input.checked]));
  try {
    const response = await api.settings(settings);
    state.settings = response.settings;
    render();
    announce("Settings saved");
  } catch (error) {
    render();
    announce(error.message, true);
  }
});

for (const kind of ["allow", "block"]) {
  document.querySelector(`#${kind}-form`).addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = event.currentTarget.elements.domain;
    try {
      const response = await api.domain(input.value, kind, true);
      if (kind === "allow") state.allowlist = response.list;
      else state.customBlocklist = response.list;
      input.value = "";
      render();
      announce("Domain added");
    } catch (error) {
      announce(error.message, true);
    }
  });
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-domain]");
  if (!button) return;
  try {
    const response = await api.domain(button.dataset.domain, button.dataset.kind, false);
    if (button.dataset.kind === "allow") state.allowlist = response.list;
    else state.customBlocklist = response.list;
    render();
    announce("Domain removed");
  } catch (error) {
    announce(error.message, true);
  }
});

document.querySelector("#reset-stats").addEventListener("click", async () => {
  const response = await api.send({ type: "RESET_STATS" });
  state.stats = response.stats;
  render();
  announce("Counter reset");
});

document.querySelector("#export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "clearblock-settings.json";
  link.click();
  URL.revokeObjectURL(link.href);
});

api.state().then((value) => { state = value; render(); }).catch((error) => announce(error.message, true));
