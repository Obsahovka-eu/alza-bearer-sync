// Alza Bearer Sync — popup script
const statusEl = document.getElementById("status");
const syncBtn = document.getElementById("syncBtn");
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");
const msgEl = document.getElementById("msg");

function showMsg(text, type) {
  msgEl.textContent = text;
  msgEl.className = "msg " + type;
  msgEl.style.display = "block";
  setTimeout(() => { msgEl.style.display = "none"; }, 3000);
}

function refreshStatus() {
  chrome.runtime.sendMessage({ type: "getStatus" }, (res) => {
    if (!res) {
      statusEl.className = "status no";
      statusEl.innerHTML = "<p>⚠️ Otevři admin.alza.cz a proveď libovolnou akci — token se zachytí automaticky.</p>";
      syncBtn.disabled = true;
      copyBtn.disabled = true;
      return;
    }
    if (res.hasToken) {
      statusEl.className = "status ok";
      statusEl.innerHTML = `
        <div class="field"><span class="label">Stav:</span><span class="value" style="color:#6fcf97">✅ Token zachycen</span></div>
        ${res.login ? `<div class="field"><span class="label">Login:</span><span class="value">${res.login}</span></div>` : ""}
        <div class="field"><span class="label">Zachyceno:</span><span class="value">${res.capturedAt ? new Date(res.capturedAt).toLocaleTimeString("cs-CZ") : "—"}</span></div>
        <div class="field"><span class="label">Celkem zachyceno:</span><span class="value">${res.captureCount}×</span></div>
      `;
      syncBtn.disabled = false;
      copyBtn.disabled = false;
    } else {
      statusEl.className = "status no";
      statusEl.innerHTML = "<p>⏳ Čekám na token... Otevři admin.alza.cz a proveď libovolnou akci.</p>";
      syncBtn.disabled = true;
      copyBtn.disabled = true;
    }
  });
}

syncBtn.addEventListener("click", () => {
  chrome.storage.local.get(["bearer", "login"], (data) => {
    if (!data.bearer) {
      showMsg("Žádný token k synchronizaci", "err");
      return;
    }
    // Send to ALL open tabs (skip chrome:// and extension pages)
    chrome.tabs.query({}, (tabs) => {
      let sentCount = 0;
      for (const tab of tabs) {
        if (!tab.id || !tab.url) continue;
        if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) continue;
        chrome.tabs.sendMessage(tab.id, {
          type: "alza-bearer-sync",
          bearer: data.bearer,
          login: data.login || "",
        }).catch(() => {}); // tab may not have content script
        sentCount++;
      }
      showMsg(sentCount > 0 ? `✅ Token odeslán do ${sentCount} tabů!` : "Žádný otevřený tab", sentCount > 0 ? "ok" : "err");
    });
  });
});

copyBtn.addEventListener("click", () => {
  chrome.storage.local.get(["bearer"], (data) => {
    if (!data.bearer) {
      showMsg("Žádný token ke zkopírování", "err");
      return;
    }
    navigator.clipboard.writeText(data.bearer).then(() => {
      showMsg("✅ Token zkopírován do schránky!", "ok");
    }).catch(() => {
      showMsg("Nepodařilo se zkopírovat", "err");
    });
  });
});

clearBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "clearToken" }, () => {
    refreshStatus();
    showMsg("Token smazán", "ok");
  });
});

refreshStatus();
