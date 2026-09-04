const { app, BrowserWindow, Tray, Menu, nativeImage, screen, globalShortcut } = require("electron");
const path = require("path");
const fs = require("fs");

const APP_URL = "https://www.habico.ug/auth";
const APP_ID = "com.habico.portal";
const APP_NAME = "Habico Portal";

let mainWindow = null;
let tray = null;

const iconPath = path.join(__dirname, "buildResources", "icon.ico");
const errorPagePath = path.join(__dirname, "error.html");

function loadErrorPage(detail) {
  if (!mainWindow) return;
  let html = fs.readFileSync(errorPagePath, "utf-8");
  if (detail) {
    html = html.replace(
      '<div class="details" id="errorDetail"></div>',
      `<div class="details" id="errorDetail">${detail}</div>`
    );
  }
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
}

app.setAppUserModelId(APP_ID);

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const icon = nativeImage.createFromPath(iconPath);
  const iconArg = !icon.isEmpty() ? icon : undefined;

  mainWindow = new BrowserWindow({
    width: Math.min(1280, width),
    height: Math.min(800, height),
    minWidth: 900,
    minHeight: 600,
    icon: iconArg,
    title: APP_NAME,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    backgroundColor: "#f8fafc",
  });

  // Right-click context menu with Inspect
  mainWindow.webContents.on("context-menu", (_e, params) => {
    const ctxMenu = Menu.buildFromTemplate([
      { label: "Back", click: () => mainWindow.webContents.goBack() },
      { label: "Forward", click: () => mainWindow.webContents.goForward() },
      { type: "separator" },
      { label: "Reload", click: () => mainWindow.webContents.reload() },
      { type: "separator" },
      { label: "Inspect Element", click: () => mainWindow.webContents.inspectElement(params.x, params.y) },
      { label: "DevTools", click: () => mainWindow.webContents.openDevTools() },
    ]);
    ctxMenu.popup();
  });

  // F12 to toggle DevTools
  globalShortcut.register("F12", () => {
    if (mainWindow) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools();
      }
    }
  });

  Menu.setApplicationMenu(null);

  mainWindow.loadURL(APP_URL);

  let pageError = false;

  mainWindow.once("ready-to-show", () => {
    if (!pageError) mainWindow.show();
  });

  let failedOnce = false;
  mainWindow.webContents.on("did-fail-load", (_e, code, desc, url) => {
    console.error(`Failed to load ${url}: ${code} ${desc}`);
    if (!failedOnce && url !== "data:text/html,<html></html>") {
      failedOnce = true;
      pageError = true;
      loadErrorPage(`Failed to load ${APP_URL}<br/>Error: ${desc} (${code})`);
    }
  });

  // Catch JS errors in the web app
  mainWindow.webContents.on("console-message", (_e, level, message) => {
    if (level >= 2) console.error(`[renderer] ${message}`);
  });

  // If page loads but is blank after 10s, show error page
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible() && !pageError) {
      pageError = true;
      loadErrorPage("The page loaded but did not render correctly. Try reloading.");
    }
  }, 10000);

  mainWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  try {
    const trayIconImg = nativeImage.createFromPath(iconPath);
    if (trayIconImg.isEmpty()) return;
    const trayIcon = trayIconImg.resize({ width: 16, height: 16 });
    tray = new Tray(trayIcon);
    tray.setToolTip(APP_NAME);

    const contextMenu = Menu.buildFromTemplate([
      { label: "Show", click: () => { mainWindow.show(); mainWindow.focus(); } },
      { label: "Quit", click: () => { app.isQuitting = true; app.quit(); } },
    ]);
    tray.setContextMenu(contextMenu);

    tray.on("click", () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (_) { /* tray not critical */ }
}

app.on("certificate-error", (event, _webContents, _url, _error, _certificate, callback) => {
  event.preventDefault();
  callback(false);
  if (mainWindow && !mainWindow.isDestroyed()) {
    loadErrorPage("SSL certificate error. Check your system date/time and internet connection.");
  }
});

app.whenReady().then(() => {
  try {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: app.getPath("exe"),
    });
  } catch (_) { /* auto-start not critical */ }

  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    // Keep running in tray on Windows
  }
});
