// Content script — receives bearer token from extension popup
// and injects it into the Admin Explorer app

function injectBearer(bearer, login) {
  localStorage.setItem("admin_bearer", bearer);
  if (login) localStorage.setItem("admin_bearer_login", login);
  // Use postMessage — CustomEvent detail doesn't cross content-script ↔ page isolated worlds
  window.postMessage({ type: "ALZA_BEARER_UPDATED", bearer, login: login || "" }, "*");
}

// Listen for manual sync from popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "alza-bearer-sync" && msg.bearer) {
    injectBearer(msg.bearer, msg.login);
  }
});

// Listen for SSO check requests from the page (via CustomEvent on window)
window.addEventListener("sso-check-request", () => {
  chrome.runtime.sendMessage({ type: "ssoCheck" }, (response) => {
    const detail = response || { ok: false, error: "Extension neodpověděla" };
    // Musíme předat data přes DOM atribut (CustomEvent detail se neklonuje cross-context)
    document.documentElement.setAttribute("data-sso-response", JSON.stringify(detail));
    window.dispatchEvent(new CustomEvent("sso-check-response"));
  });
});

// Respond to ALZA_BEARER_REQUEST from the page (used by detectExtensionBearer())
window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.type === "ALZA_BEARER_REQUEST") {
    chrome.storage.local.get(["bearer", "login"], (data) => {
      window.postMessage({
        type: "ALZA_BEARER_RESPONSE",
        token: data.bearer || null,
        login: data.login || "",
      }, "*");
    });
  }
});

// Auto-sync: on page load, check if extension has a captured token
chrome.storage.local.get(["bearer", "login"], (data) => {
  if (data.bearer) {
    injectBearer(data.bearer, data.login);
  }
});

// Auto-sync: when token changes in storage (captured new one), push it
chrome.storage.onChanged.addListener((changes) => {
  if (changes.bearer && changes.bearer.newValue) {
    const login = changes.login ? changes.login.newValue : "";
    injectBearer(changes.bearer.newValue, login);
  }
});
