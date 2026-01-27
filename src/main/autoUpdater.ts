/**
 * Auto-Updater Module for Dev Tools Manager
 * 
 * This module handles automatic updates using electron-updater.
 * It checks for updates on startup and notifies the user when updates are available.
 * 
 * Requirements: 12.1-12.3 (Cross-platform support and distribution)
 */

import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import fs from 'node:fs';
import path from 'node:path';

// Configure logging
autoUpdater.logger = console;

// Disable auto-download by default - let user decide
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// For development, allow updates from local server
if (process.env.NODE_ENV === 'development') {
  autoUpdater.forceDevUpdateConfig = true;
}

const LEGACY_V2_RELEASES_URL = 'https://github.com/cocojojo5213/Dev-Janitor/releases';
const LEGACY_NOTICE_FILE = 'legacy-upgrade-notice.json';

type LegacyNoticeState = {
  dismissed: boolean;
};

function getLegacyNoticeStatePath(): string {
  return path.join(app.getPath('userData'), LEGACY_NOTICE_FILE);
}

function readLegacyNoticeState(): LegacyNoticeState {
  try {
    const statePath = getLegacyNoticeStatePath();
    if (!fs.existsSync(statePath)) {
      return { dismissed: false };
    }

    const raw = fs.readFileSync(statePath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<LegacyNoticeState>;
    return { dismissed: parsed.dismissed === true };
  } catch (error) {
    console.warn('Failed to read legacy notice state:', error);
    return { dismissed: false };
  }
}

function writeLegacyNoticeState(state: LegacyNoticeState): void {
  try {
    const statePath = getLegacyNoticeStatePath();
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.warn('Failed to write legacy notice state:', error);
  }
}

function shouldShowLegacyUpgradeNotice(): boolean {
  return !readLegacyNoticeState().dismissed;
}

async function showLegacyUpgradeNotice(mainWindow: BrowserWindow): Promise<void> {
  // Only show this notice in packaged builds for real end users.
  if (!app.isPackaged) {
    return;
  }

  if (!shouldShowLegacyUpgradeNotice()) {
    return;
  }

  const result = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    title: 'Dev Janitor v2 Available',
    message: 'You are using the legacy v1 (Electron) version.',
    detail:
      'Dev Janitor v2 is now available and actively maintained.\n\n' +
      'We strongly recommend upgrading to v2 for better performance and smaller downloads.',
    buttons: ['Open v2 Releases', 'Remind Me Next Time', 'Stop Reminding'],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });

  if (result.response === 0) {
    void shell.openExternal(LEGACY_V2_RELEASES_URL);
  }

  if (result.response === 2) {
    writeLegacyNoticeState({ dismissed: true });
  }
}

/**
 * Initialize the auto-updater
 * @param mainWindow - The main browser window for sending update events
 */
export function initAutoUpdater(mainWindow: BrowserWindow): void {
  // Show legacy upgrade notice on every startup until the user opts out.
  setTimeout(() => {
    void showLegacyUpgradeNotice(mainWindow);
  }, 1500);

  // Check for updates on startup (with delay to not block app launch)
  setTimeout(() => {
    checkForUpdates(mainWindow);
  }, 3000);

  // Set up event handlers
  setupUpdateEvents(mainWindow);

  // Set up IPC handlers for renderer process
  setupIPCHandlers(mainWindow);
}

/**
 * Check for available updates
 */
export async function checkForUpdates(_mainWindow: BrowserWindow): Promise<void> {
  try {
    console.log('Checking for updates...');
    await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error('Error checking for updates:', error);
    // Don't show error to user - updates are optional
  }
}

/**
 * Set up auto-updater event handlers
 */
function setupUpdateEvents(mainWindow: BrowserWindow): void {
  // Update available
  autoUpdater.on('update-available', (info: UpdateInfo) => {
    console.log('Update available:', info.version);
    
    // Notify renderer process
    mainWindow.webContents.send('update:available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    });

    // Show dialog to user
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) is available.`,
      detail: 'Would you like to download and install it now?',
      buttons: ['Download', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  });

  // No update available
  autoUpdater.on('update-not-available', (_info: UpdateInfo) => {
    console.log('No update available. Current version:', app.getVersion());
    mainWindow.webContents.send('update:not-available', {
      currentVersion: app.getVersion()
    });
  });

  // Download progress
  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    console.log(`Download progress: ${progress.percent.toFixed(1)}%`);
    mainWindow.webContents.send('update:download-progress', {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    });
  });

  // Update downloaded
  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    console.log('Update downloaded:', info.version);
    mainWindow.webContents.send('update:downloaded', {
      version: info.version
    });

    // Show dialog to restart
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded successfully.',
      detail: 'The application will restart to install the update.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  // Error handling
  autoUpdater.on('error', (error: Error) => {
    console.error('Auto-updater error:', error);
    mainWindow.webContents.send('update:error', {
      message: error.message
    });
  });
}

/**
 * Set up IPC handlers for update-related actions from renderer
 * These handlers override the default handlers registered in ipcHandlers.ts
 *
 * Note: This function should only be called once during app initialization
 * to avoid race conditions with handler registration
 */
let handlersRegistered = false
const handlerRegistrationLock = { locked: false }

function setupIPCHandlers(_mainWindow: BrowserWindow): void {
  // Prevent duplicate registration
  if (handlersRegistered) {
    console.warn('Update IPC handlers already registered, skipping duplicate registration')
    return
  }

  // Simple lock to prevent concurrent registration
  if (handlerRegistrationLock.locked) {
    console.warn('Handler registration in progress, waiting...')
    return
  }

  handlerRegistrationLock.locked = true

  try {
    // Remove default handlers first to avoid duplicate registration
    ipcMain.removeHandler('update:check')
    ipcMain.removeHandler('update:download')
    ipcMain.removeHandler('update:install')
    ipcMain.removeHandler('app:version')

    // Check for updates manually
    ipcMain.handle('update:check', async () => {
      try {
        const result = await autoUpdater.checkForUpdates();
        return {
          success: true,
          updateAvailable: result?.updateInfo?.version !== app.getVersion(),
          version: result?.updateInfo?.version
        };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message
        };
      }
    });

    // Download update
    ipcMain.handle('update:download', async () => {
      try {
        await autoUpdater.downloadUpdate();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: (error as Error).message
        };
      }
    });

    // Install update (quit and install)
    ipcMain.handle('update:install', () => {
      autoUpdater.quitAndInstall(false, true);
    });

    // Get current version
    ipcMain.handle('app:version', () => {
      return app.getVersion();
    });

    handlersRegistered = true
  } finally {
    handlerRegistrationLock.locked = false
  }
}

/**
 * Export for conditional initialization
 * Only initialize auto-updater in production builds
 */
export function shouldEnableAutoUpdater(): boolean {
  // Disable in development mode
  if (process.env.NODE_ENV === 'development') {
    return false;
  }
  
  // Disable if running from source (not packaged)
  if (!app.isPackaged) {
    return false;
  }
  
  return true;
}
