"use strict";

const MENU_GLOBAL = "ptg-enabled-global";
const MENU_SITE = "ptg-enabled-site";

const DEFAULT_STATE = {
  enabled: true,
  disabledSites: []
};

function getSupportedHosts() {
  const hosts = new Set();

  for (const script of chrome.runtime.getManifest().content_scripts || []) {
    for (const pattern of script.matches || []) {
      const match = /^https:\/\/([^/*]+)\//.exec(pattern);
      if (match) hosts.add(match[1]);
    }
  }

  return hosts;
}

function supportedHostFromUrl(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    return getSupportedHosts().has(parsed.hostname) ? parsed.hostname : null;
  } catch (error) {
    return null;
  }
}

function getState(callback) {
  chrome.storage.sync.get(DEFAULT_STATE, (state) => {
    const disabledSites = Array.isArray(state.disabledSites) ? state.disabledSites : [];
    callback({ enabled: state.enabled !== false, disabledSites });
  });
}

function isEnabledForHost(state, host) {
  return state.enabled && Boolean(host) && !state.disabledSites.includes(host);
}

function ensureMenus(callback) {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_GLOBAL,
      title: "Enabled",
      type: "checkbox",
      checked: true,
      contexts: ["action"]
    }, () => void chrome.runtime.lastError);

    chrome.contextMenus.create({
      id: MENU_SITE,
      title: "Enabled on this site",
      type: "checkbox",
      checked: true,
      contexts: ["action"]
    }, () => {
      void chrome.runtime.lastError;
      if (callback) callback();
    });
  });
}

function updateMenu(menuId, properties) {
  chrome.contextMenus.update(menuId, properties, () => {
    // If the menus are missing (for example after an update), rebuild once.
    if (chrome.runtime.lastError) {
      ensureMenus(refreshUi);
    }
  });
}

function updateBadgeForTab(tab, state) {
  if (!tab || typeof tab.id !== "number") return;

  const host = supportedHostFromUrl(tab.url);
  const showOff = Boolean(host) && !isEnabledForHost(state, host);

  chrome.action.setBadgeText({ tabId: tab.id, text: showOff ? "OFF" : "" }, () => void chrome.runtime.lastError);
}

function refreshAllBadges(state) {
  chrome.tabs.query({}, (tabs) => {
    if (chrome.runtime.lastError) return;
    for (const tab of tabs || []) {
      updateBadgeForTab(tab, state);
    }
  });
}

function refreshUi() {
  getState((state) => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) return;

      const tab = tabs && tabs[0];
      const host = tab ? supportedHostFromUrl(tab.url) : null;

      updateMenu(MENU_GLOBAL, { checked: state.enabled });

      updateMenu(MENU_SITE, {
        enabled: Boolean(host),
        checked: Boolean(host) && !state.disabledSites.includes(host),
        title: host ? `Enabled on ${host}` : "Enabled on this site"
      });

      updateBadgeForTab(tab, state);
    });
  });
}

function handleMenuClick(info, tab) {
  if (info.menuItemId === MENU_GLOBAL) {
    chrome.storage.sync.set({ enabled: info.checked === true });
    return;
  }

  if (info.menuItemId === MENU_SITE) {
    const host = tab ? supportedHostFromUrl(tab.url) : null;
    if (!host) return;

    getState((state) => {
      const disabledSites = info.checked
        ? state.disabledSites.filter((site) => site !== host)
        : Array.from(new Set(state.disabledSites.concat(host)));

      chrome.storage.sync.set({ disabledSites });
    });
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: "#8a94a6" });
  ensureMenus(refreshUi);
});

chrome.runtime.onStartup.addListener(() => {
  ensureMenus(refreshUi);
});

chrome.contextMenus.onClicked.addListener(handleMenuClick);

chrome.commands.onCommand.addListener((command) => {
  if (command !== "toggle-guard") return;

  getState((state) => {
    chrome.storage.sync.set({ enabled: !state.enabled });
  });
});

chrome.tabs.onActivated.addListener(refreshUi);

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.url && changeInfo.status !== "complete") return;

  getState((state) => updateBadgeForTab(tab, state));
  if (tab && tab.active) refreshUi();
});

chrome.windows.onFocusChanged.addListener(refreshUi);

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync") return;
  if (!changes.enabled && !changes.disabledSites) return;

  refreshUi();
  getState(refreshAllBadges);
});
