// Alza Bearer Sync — background service worker
// Captures Authorization header from requests to adminapi.alza.cz
// and stores it for the Admin Explorer to use.

let lastBearer = "";
let lastLogin = "";
let captureCount = 0;

// Listen for requests to admin API and capture bearer token
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const authHeader = details.requestHeaders?.find(
      (h) => h.name.toLowerCase() === "authorization"
    );
    if (authHeader?.value?.startsWith("Bearer ")) {
      const token = authHeader.value.slice(7);
      if (token !== lastBearer) {
        lastBearer = token;
        captureCount++;
        // Try to decode JWT to get login info
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          lastLogin = payload.preferred_username || payload.email || payload.name || "";
        } catch {
          lastLogin = "";
        }
        // Store for popup and content scripts
        chrome.storage.local.set({
          bearer: token,
          login: lastLogin,
          capturedAt: new Date().toISOString(),
          captureCount,
        });
      }
    }
  },
  { urls: ["https://adminapi.alza.cz/*", "https://admin.alza.cz/*"] },
  ["requestHeaders"]
);

// Handle messages from popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "getStatus") {
    chrome.storage.local.get(["bearer", "login", "capturedAt", "captureCount"], (data) => {
      sendResponse({
        hasToken: !!data.bearer,
        login: data.login || "",
        capturedAt: data.capturedAt || "",
        captureCount: data.captureCount || 0,
      });
    });
    return true; // async response
  }
  if (msg.type === "clearToken") {
    lastBearer = "";
    lastLogin = "";
    chrome.storage.local.remove(["bearer", "login", "capturedAt", "captureCount"]);
    sendResponse({ ok: true });
    return true;
  }
  // SSO check — fetch account.obsahovka.eu/sso_api.php from extension context
  // Uses chrome.cookies API to get cookies and forward them manually,
  // because MV3 service worker fetch() doesn't share browser cookies.
  if (msg.type === "ssoCheck") {
    chrome.cookies.getAll({ url: "https://account.obsahovka.eu/" }, (cookies) => {
      const cookieHeader = (cookies || []).map((c) => `${c.name}=${c.value}`).join("; ");
      fetch("https://account.obsahovka.eu/sso_api.php", {
        headers: cookieHeader ? { Cookie: cookieHeader } : {},
      })
        .then((r) => {
          if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
          return r.json();
        })
        .then((data) => sendResponse(data))
        .catch((e) => sendResponse({ ok: false, error: e.message }));
    });
    return true; // async response
  }
});
