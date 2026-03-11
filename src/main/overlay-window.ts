import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import { OVERLAY_WIDTH, OVERLAY_HEIGHT } from '../shared/constants';

declare const OVERLAY_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const OVERLAY_WINDOW_VITE_NAME: string;

const BOTTOM_PADDING = 48;

// Store the display-anchored bottom position so we can grow upward
let anchorDisplay: Electron.Display | null = null;

export function repositionOverlayTocursor(overlay: BrowserWindow): void {
  const cursor = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursor);
  anchorDisplay = display;
  const { x: areaX, y: areaY, width: areaW, height: areaH } = display.workArea;

  const x = Math.round(areaX + areaW / 2 - OVERLAY_WIDTH / 2);
  const y = areaY + areaH - OVERLAY_HEIGHT - BOTTOM_PADDING;

  overlay.setBounds({ x, y, width: OVERLAY_WIDTH, height: OVERLAY_HEIGHT });
}

/**
 * Resize overlay dynamically, anchoring the bottom edge.
 * Used when transcript card expands/collapses.
 */
export function resizeOverlay(overlay: BrowserWindow, width: number, height: number): void {
  const display = anchorDisplay || screen.getPrimaryDisplay();
  const { x: areaX, y: areaY, width: areaW, height: areaH } = display.workArea;

  // Keep the bottom edge anchored at its original position
  const bottomY = areaY + areaH - BOTTOM_PADDING;
  const x = Math.round(areaX + areaW / 2 - width / 2);
  const y = bottomY - height;

  overlay.setBounds({ x, y, width, height });
}

export function createOverlayWindow(): BrowserWindow {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const overlay = new BrowserWindow({
    width: OVERLAY_WIDTH,
    height: OVERLAY_HEIGHT,
    x: Math.round(screenWidth / 2 - OVERLAY_WIDTH / 2),
    y: screenHeight - OVERLAY_HEIGHT - BOTTOM_PADDING,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    hasShadow: false,
    show: false,
    acceptFirstMouse: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  // 🔧 初始状态忽略鼠标事件（后续根据状态动态切换）
  overlay.setIgnoreMouseEvents(true);
  overlay.setVisibleOnAllWorkspaces(true);
  overlay.setAlwaysOnTop(true, 'floating');

  // Load the same renderer but the overlay component will handle routing
  if (OVERLAY_WINDOW_VITE_DEV_SERVER_URL) {
    overlay.loadURL(OVERLAY_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    overlay.loadFile(
      path.join(__dirname, `../renderer/${OVERLAY_WINDOW_VITE_NAME}/index.html`)
    );
  }

  return overlay;
}
