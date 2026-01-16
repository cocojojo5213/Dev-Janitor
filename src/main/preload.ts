/**
 * Preload Script
 * 
 * Exposes secure API to the renderer process via contextBridge.
 * This script runs in a sandboxed environment with access to Node.js APIs
 * but exposes only specific, safe functionality to the renderer.
 * 
 * Security: contextIsolation is enabled, nodeIntegration is disabled
 * 
 * Validates: Requirements 1.1, 3.1, 4.1, 10.1, 11.1
 */

import { ipcRenderer, contextBridge } from 'electron'
import type { ToolInfo, PackageInfo, RunningService, EnvironmentVariable, AnalysisResult, AIConfig } from '../shared/types'

/**
 * Type-safe IPC API exposed to renderer
 */
interface ElectronAPI {
  // Platform information
  platform: NodeJS.Platform

  // Tools API
  tools: {
    detectAll: () => Promise<ToolInfo[]>
    detectOne: (toolName: string) => Promise<ToolInfo>
  }

  // Packages API
  packages: {
    listNpm: () => Promise<PackageInfo[]>
    listPip: () => Promise<PackageInfo[]>
    listComposer: () => Promise<PackageInfo[]>
    listCargo: () => Promise<PackageInfo[]>
    listGem: () => Promise<PackageInfo[]>
    uninstall: (name: string, manager: string) => Promise<boolean>
    checkNpmLatestVersion: (packageName: string) => Promise<{ name: string; latest: string; current?: string } | null>
    checkPipLatestVersion: (packageName: string) => Promise<{ name: string; latest: string } | null>
  }

  // Services API
  services: {
    list: () => Promise<RunningService[]>
    kill: (pid: number) => Promise<boolean>
    onUpdated: (callback: (services: RunningService[]) => void) => () => void
  }

  // Environment API
  env: {
    getAll: () => Promise<EnvironmentVariable[]>
    getPath: () => Promise<string[]>
  }

  // Settings API
  settings: {
    getLanguage: () => Promise<string>
    setLanguage: (lang: string) => Promise<void>
    onLanguageChanged: (callback: (lang: string) => void) => () => void
  }

  // AI Assistant API
  ai: {
    analyze: () => Promise<AnalysisResult>
    updateConfig: (config: AIConfig) => Promise<void>
  }

  // Shell API (for opening paths, URLs, and executing commands)
  shell: {
    openPath: (path: string) => Promise<string>
    openExternal: (url: string) => Promise<void>
    executeCommand: (command: string) => Promise<{ success: boolean; stdout: string; stderr: string }>
  }

  // Events API
  events: {
    onDetectionProgress: (callback: (progress: number) => void) => () => void
    onError: (callback: (error: string) => void) => () => void
  }

  // App/Update API
  app: {
    getVersion: () => Promise<string>
    checkForUpdates: () => Promise<{ success: boolean; updateAvailable?: boolean; version?: string; error?: string }>
    downloadUpdate: () => Promise<{ success: boolean; error?: string }>
    installUpdate: () => void
    onUpdateAvailable: (callback: (info: { version: string; releaseDate?: string; releaseNotes?: string }) => void) => () => void
    onUpdateNotAvailable: (callback: (info: { currentVersion: string }) => void) => () => void
    onDownloadProgress: (callback: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) => () => void
    onUpdateDownloaded: (callback: (info: { version: string }) => void) => () => void
    onUpdateError: (callback: (error: { message: string }) => void) => () => void
  }
}

// Create the API object
const electronAPI: ElectronAPI = {
  // Platform information
  platform: process.platform,

  // Tools API
  tools: {
    detectAll: () => ipcRenderer.invoke('tools:detect-all'),
    detectOne: (toolName: string) => ipcRenderer.invoke('tools:detect-one', toolName),
  },

  // Packages API
  packages: {
    listNpm: () => ipcRenderer.invoke('packages:list-npm'),
    listPip: () => ipcRenderer.invoke('packages:list-pip'),
    listComposer: () => ipcRenderer.invoke('packages:list-composer'),
    listCargo: () => ipcRenderer.invoke('packages:list-cargo'),
    listGem: () => ipcRenderer.invoke('packages:list-gem'),
    uninstall: (name: string, manager: string) => 
      ipcRenderer.invoke('packages:uninstall', name, manager),
    checkNpmLatestVersion: (packageName: string) =>
      ipcRenderer.invoke('packages:check-npm-latest', packageName),
    checkPipLatestVersion: (packageName: string) =>
      ipcRenderer.invoke('packages:check-pip-latest', packageName),
  },

  // Services API
  services: {
    list: () => ipcRenderer.invoke('services:list'),
    kill: (pid: number) => ipcRenderer.invoke('services:kill', pid),
    onUpdated: (callback: (services: RunningService[]) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, services: RunningService[]) => {
        callback(services)
      }
      ipcRenderer.on('services:updated', handler)
      // Return cleanup function
      return () => {
        ipcRenderer.removeListener('services:updated', handler)
      }
    },
  },

  // Environment API
  env: {
    getAll: () => ipcRenderer.invoke('env:get-all'),
    getPath: () => ipcRenderer.invoke('env:get-path'),
  },

  // Settings API
  settings: {
    getLanguage: () => ipcRenderer.invoke('settings:get-language'),
    setLanguage: (lang: string) => ipcRenderer.invoke('settings:set-language', lang),
    onLanguageChanged: (callback: (lang: string) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, lang: string) => {
        callback(lang)
      }
      ipcRenderer.on('settings:language-changed', handler)
      // Return cleanup function
      return () => {
        ipcRenderer.removeListener('settings:language-changed', handler)
      }
    },
  },

  // AI Assistant API
  ai: {
    analyze: () => ipcRenderer.invoke('ai:analyze'),
    updateConfig: (config: AIConfig) => ipcRenderer.invoke('ai:update-config', config),
  },

  // Shell API
  shell: {
    openPath: (path: string) => ipcRenderer.invoke('shell:open-path', path),
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
    executeCommand: (command: string) => ipcRenderer.invoke('shell:execute-command', command),
  },

  // Events API
  events: {
    onDetectionProgress: (callback: (progress: number) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, progress: number) => {
        callback(progress)
      }
      ipcRenderer.on('detection:progress', handler)
      // Return cleanup function
      return () => {
        ipcRenderer.removeListener('detection:progress', handler)
      }
    },
    onError: (callback: (error: string) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, error: string) => {
        callback(error)
      }
      ipcRenderer.on('error', handler)
      // Return cleanup function
      return () => {
        ipcRenderer.removeListener('error', handler)
      }
    },
  },

  // App/Update API
  app: {
    getVersion: () => ipcRenderer.invoke('app:version'),
    checkForUpdates: () => ipcRenderer.invoke('update:check'),
    downloadUpdate: () => ipcRenderer.invoke('update:download'),
    installUpdate: () => ipcRenderer.invoke('update:install'),
    onUpdateAvailable: (callback: (info: { version: string; releaseDate?: string; releaseNotes?: string }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, info: { version: string; releaseDate?: string; releaseNotes?: string }) => {
        callback(info)
      }
      ipcRenderer.on('update:available', handler)
      return () => {
        ipcRenderer.removeListener('update:available', handler)
      }
    },
    onUpdateNotAvailable: (callback: (info: { currentVersion: string }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, info: { currentVersion: string }) => {
        callback(info)
      }
      ipcRenderer.on('update:not-available', handler)
      return () => {
        ipcRenderer.removeListener('update:not-available', handler)
      }
    },
    onDownloadProgress: (callback: (progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, progress: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => {
        callback(progress)
      }
      ipcRenderer.on('update:download-progress', handler)
      return () => {
        ipcRenderer.removeListener('update:download-progress', handler)
      }
    },
    onUpdateDownloaded: (callback: (info: { version: string }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, info: { version: string }) => {
        callback(info)
      }
      ipcRenderer.on('update:downloaded', handler)
      return () => {
        ipcRenderer.removeListener('update:downloaded', handler)
      }
    },
    onUpdateError: (callback: (error: { message: string }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, error: { message: string }) => {
        callback(error)
      }
      ipcRenderer.on('update:error', handler)
      return () => {
        ipcRenderer.removeListener('update:error', handler)
      }
    },
  },
}

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Type declarations for the renderer process
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export type { ElectronAPI }
