/**
 * Zustand Store for Dev Tools Manager
 * 
 * Manages application state for tools, packages, services, and environment.
 * Integrates IPC calls to communicate with the main process.
 * 
 * Validates: Requirements 2.1, 7.3, 13.1-13.8
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ToolInfo, PackageInfo, RunningService, EnvironmentVariable, ViewType, SupportedLanguage, ThemeMode } from '@shared/types'
import { ipcClient } from '../ipc'
import i18n from '../i18n'

// ============================================================================
// State Interface
// ============================================================================

// Version check cache type
interface VersionInfo {
  latest: string
  checking: boolean
  checked: boolean
  updating?: boolean
}

interface AppState {
  // Tools
  tools: ToolInfo[]
  toolsLoading: boolean
  toolsError: string | null
  
  // Packages
  npmPackages: PackageInfo[]
  pipPackages: PackageInfo[]
  composerPackages: PackageInfo[]
  packagesLoading: boolean
  packagesError: string | null
  
  // Package version cache (persisted)
  packageVersionCache: Record<string, VersionInfo>
  
  // Services
  runningServices: RunningService[]
  servicesLoading: boolean
  servicesError: string | null
  
  // Environment
  environmentVariables: EnvironmentVariable[]
  pathEntries: string[]
  envLoading: boolean
  envError: string | null
  
  // UI
  currentView: ViewType
  language: SupportedLanguage
  themeMode: ThemeMode
  
  // Detection progress
  detectionProgress: number
  
  // Actions - Data Loading
  loadTools: () => Promise<void>
  loadPackages: (manager?: 'npm' | 'pip' | 'composer' | 'all') => Promise<void>
  loadServices: () => Promise<void>
  loadEnvironment: () => Promise<void>
  refreshAll: () => Promise<void>
  
  // Actions - Service Management
  killService: (pid: number) => Promise<boolean>
  
  // Actions - Package Management
  uninstallPackage: (name: string, manager: 'npm' | 'pip' | 'composer') => Promise<boolean>
  
  // Actions - UI
  setCurrentView: (view: ViewType) => void
  setLanguage: (lang: SupportedLanguage) => void
  setThemeMode: (mode: ThemeMode) => void
  
  // Actions - State Setters (for direct updates)
  setTools: (tools: ToolInfo[]) => void
  setToolsLoading: (loading: boolean) => void
  setToolsError: (error: string | null) => void
  setNpmPackages: (packages: PackageInfo[]) => void
  setPipPackages: (packages: PackageInfo[]) => void
  setComposerPackages: (packages: PackageInfo[]) => void
  setPackagesLoading: (loading: boolean) => void
  setPackagesError: (error: string | null) => void
  setPackageVersionCache: (cache: Record<string, VersionInfo>) => void
  updatePackageVersionInfo: (packageName: string, info: Partial<VersionInfo>) => void
  setRunningServices: (services: RunningService[]) => void
  setServicesLoading: (loading: boolean) => void
  setServicesError: (error: string | null) => void
  setEnvironmentVariables: (vars: EnvironmentVariable[]) => void
  setPathEntries: (entries: string[]) => void
  setEnvLoading: (loading: boolean) => void
  setEnvError: (error: string | null) => void
  setDetectionProgress: (progress: number) => void
  
  // Actions - Error Clearing
  clearErrors: () => void
  
  // Actions - Initialization
  initializeLanguage: () => Promise<void>
}

// ============================================================================
// Store Creation
// ============================================================================

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ========================================================================
      // Initial State
      // ========================================================================
      
      // Tools
      tools: [],
      toolsLoading: false,
      toolsError: null,
      
      // Packages
      npmPackages: [],
      pipPackages: [],
      composerPackages: [],
      packagesLoading: false,
      packagesError: null,
      
      // Package version cache
      packageVersionCache: {},
      
      // Services
      runningServices: [],
      servicesLoading: false,
      servicesError: null,
      
      // Environment
      environmentVariables: [],
      pathEntries: [],
      envLoading: false,
      envError: null,
      
      // UI
      currentView: 'tools',
      language: 'en-US',
      themeMode: 'system',
      
      // Detection progress
      detectionProgress: 0,
      
      // ========================================================================
      // Data Loading Actions
      // ========================================================================
      
      /**
       * Load all development tools
       * Validates: Requirements 1.1, 2.1
       */
      loadTools: async () => {
        set({ toolsLoading: true, toolsError: null, detectionProgress: 0 })
        
        try {
          const tools = await ipcClient.tools.detectAll()
          set({ tools, toolsLoading: false, detectionProgress: 100 })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to detect tools'
          set({ toolsError: errorMessage, toolsLoading: false })
          console.error('Failed to load tools:', error)
        }
      },
      
      /**
       * Load packages from specified manager(s)
       * Validates: Requirements 3.1, 4.1, 16.1, 16.2, 16.3, 16.4
       */
      loadPackages: async (manager = 'all') => {
        set({ packagesLoading: true, packagesError: null })
        
        try {
          if (manager === 'all' || manager === 'npm') {
            const npmPackages = await ipcClient.packages.listNpm()
            set({ npmPackages: validatePackageArray(npmPackages, 'npm') })
          }
          
          if (manager === 'all' || manager === 'pip') {
            const pipPackages = await ipcClient.packages.listPip()
            set({ pipPackages: validatePackageArray(pipPackages, 'pip') })
          }
          
          if (manager === 'all' || manager === 'composer') {
            const composerPackages = await ipcClient.packages.listComposer()
            set({ composerPackages: validatePackageArray(composerPackages, 'composer') })
          }
          
          set({ packagesLoading: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load packages'
          set({ packagesError: errorMessage, packagesLoading: false })
          console.error('Failed to load packages:', error)
        }
      },
      
      /**
       * Load running services
       * Validates: Requirements 11.1, 11.3
       */
      loadServices: async () => {
        set({ servicesLoading: true, servicesError: null })
        
        try {
          const runningServices = await ipcClient.services.list()
          set({ runningServices, servicesLoading: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load services'
          set({ servicesError: errorMessage, servicesLoading: false })
          console.error('Failed to load services:', error)
        }
      },
      
      /**
       * Load environment variables
       * Validates: Requirements 10.1, 10.3
       */
      loadEnvironment: async () => {
        set({ envLoading: true, envError: null })
        
        try {
          const [environmentVariables, pathEntries] = await Promise.all([
            ipcClient.env.getAll(),
            ipcClient.env.getPath(),
          ])
          set({ environmentVariables, pathEntries, envLoading: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load environment'
          set({ envError: errorMessage, envLoading: false })
          console.error('Failed to load environment:', error)
        }
      },
      
      /**
       * Refresh all data
       * Validates: Requirements 7.1, 7.2, 7.3
       */
      refreshAll: async () => {
        const { loadTools, loadPackages, loadServices, loadEnvironment } = get()
        
        // Run all loads in parallel for better performance
        await Promise.all([
          loadTools(),
          loadPackages('all'),
          loadServices(),
          loadEnvironment(),
        ])
      },
      
      // ========================================================================
      // Service Management Actions
      // ========================================================================
      
      /**
       * Kill a running service
       * Validates: Requirements 11.5, 11.7
       */
      killService: async (pid: number) => {
        try {
          const success = await ipcClient.services.kill(pid)
          
          if (success) {
            // Remove the service from the list
            const { runningServices } = get()
            set({
              runningServices: runningServices.filter(s => s.pid !== pid)
            })
          }
          
          return success
        } catch (error) {
          console.error('Failed to kill service:', error)
          return false
        }
      },
      
      // ========================================================================
      // Package Management Actions
      // ========================================================================
      
      /**
       * Uninstall a package
       * Validates: Requirements 6.4
       */
      uninstallPackage: async (name: string, manager: 'npm' | 'pip' | 'composer') => {
        try {
          const success = await ipcClient.packages.uninstall(name, manager)
          
          if (success) {
            // Remove the package from the appropriate list
            const state = get()
            
            if (manager === 'npm') {
              set({ npmPackages: state.npmPackages.filter(p => p.name !== name) })
            } else if (manager === 'pip') {
              set({ pipPackages: state.pipPackages.filter(p => p.name !== name) })
            } else if (manager === 'composer') {
              set({ composerPackages: state.composerPackages.filter(p => p.name !== name) })
            }
          }
          
          return success
        } catch (error) {
          console.error('Failed to uninstall package:', error)
          return false
        }
      },
      
      // ========================================================================
      // UI Actions
      // ========================================================================
      
      /**
       * Set the current view
       */
      setCurrentView: (view: ViewType) => {
        set({ currentView: view })
      },
      
      /**
       * Set the language and persist it
       * Validates: Requirements 13.4, 13.5
       */
      setLanguage: (lang: SupportedLanguage) => {
        set({ language: lang })
        
        // Update i18next language
        i18n.changeLanguage(lang)
      },

      /**
       * Set the theme mode (system/light/dark) and persist it
       */
      setThemeMode: (mode: ThemeMode) => {
        set({ themeMode: mode })
      },
      
      // ========================================================================
      // State Setters (for direct updates from IPC events)
      // ========================================================================
      
      setTools: (tools: ToolInfo[]) => set({ tools }),
      setToolsLoading: (loading: boolean) => set({ toolsLoading: loading }),
      setToolsError: (error: string | null) => set({ toolsError: error }),
      setNpmPackages: (packages: PackageInfo[]) => set({ npmPackages: validatePackageArray(packages, 'npm') }),
      setPipPackages: (packages: PackageInfo[]) => set({ pipPackages: validatePackageArray(packages, 'pip') }),
      setComposerPackages: (packages: PackageInfo[]) => set({ composerPackages: validatePackageArray(packages, 'composer') }),
      setPackagesLoading: (loading: boolean) => set({ packagesLoading: loading }),
      setPackagesError: (error: string | null) => set({ packagesError: error }),
      setPackageVersionCache: (cache: Record<string, VersionInfo>) => set({ packageVersionCache: cache }),
      updatePackageVersionInfo: (packageName: string, info: Partial<VersionInfo>) => {
        const { packageVersionCache } = get()
        set({
          packageVersionCache: {
            ...packageVersionCache,
            [packageName]: { ...packageVersionCache[packageName], ...info } as VersionInfo
          }
        })
      },
      setRunningServices: (services: RunningService[]) => set({ runningServices: services }),
      setServicesLoading: (loading: boolean) => set({ servicesLoading: loading }),
      setServicesError: (error: string | null) => set({ servicesError: error }),
      setEnvironmentVariables: (vars: EnvironmentVariable[]) => set({ environmentVariables: vars }),
      setPathEntries: (entries: string[]) => set({ pathEntries: entries }),
      setEnvLoading: (loading: boolean) => set({ envLoading: loading }),
      setEnvError: (error: string | null) => set({ envError: error }),
      setDetectionProgress: (progress: number) => set({ detectionProgress: progress }),
      
      // ========================================================================
      // Error Clearing
      // ========================================================================
      
      /**
       * Clear all error states
       */
      clearErrors: () => {
        set({
          toolsError: null,
          packagesError: null,
          servicesError: null,
          envError: null,
        })
      },
      
      // ========================================================================
      // Initialization
      // ========================================================================
      
      /**
       * Initialize language from persisted settings or system default
       * Validates: Requirements 13.5, 13.6
       */
      initializeLanguage: async () => {
        try {
          const persisted = localStorage.getItem('dev-tools-manager-storage')
          if (persisted) {
            const parsed = JSON.parse(persisted) as { state?: { language?: unknown } }
            const persistedLang = parsed.state?.language
            if (persistedLang === 'zh-CN' || persistedLang === 'en-US') {
              set({ language: persistedLang })
              i18n.changeLanguage(persistedLang)
              return
            }
          }
          
          // Fall back to system language detection
          const systemLang = detectSystemLanguage()
          set({ language: systemLang })
          i18n.changeLanguage(systemLang)
        } catch (error) {
          console.error('Failed to initialize language:', error)
          // Keep default language (en-US)
        }
      },
    }),
    {
      name: 'dev-tools-manager-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist UI preferences, not data
      partialize: (state) => ({
        language: state.language,
        currentView: state.currentView,
        themeMode: state.themeMode,
      }),
    }
  )
)

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate and sanitize package array data from IPC
 * Validates: Requirements 16.1, 16.2, 16.3, 16.4
 * 
 * @param data - The data returned from IPC call
 * @param managerName - The package manager name for logging
 * @returns A valid PackageInfo array (empty array if invalid)
 */
function validatePackageArray(data: unknown, managerName: string): PackageInfo[] {
  // Handle null or undefined - use empty array as default (Requirement 16.1)
  if (data === null || data === undefined) {
    console.warn(`[Store] ${managerName} packages returned null/undefined, using empty array`)
    return []
  }
  
  // Validate data type - must be an array (Requirement 16.2)
  if (!Array.isArray(data)) {
    console.warn(`[Store] ${managerName} packages returned unexpected type: ${typeof data}, using empty array`)
    return []
  }
  
  // Filter out invalid entries and validate each item (Requirement 16.3, 16.4)
  const validPackages: PackageInfo[] = []
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i]
    
    // Skip null/undefined items
    if (item === null || item === undefined) {
      console.warn(`[Store] ${managerName} package at index ${i} is null/undefined, skipping`)
      continue
    }
    
    // Validate item is an object
    if (typeof item !== 'object') {
      console.warn(`[Store] ${managerName} package at index ${i} is not an object (${typeof item}), skipping`)
      continue
    }
    
    // Validate required fields exist and have correct types
    const pkg = item as Record<string, unknown>
    
    if (typeof pkg.name !== 'string' || pkg.name.trim() === '') {
      console.warn(`[Store] ${managerName} package at index ${i} has invalid name, skipping`)
      continue
    }
    
    if (typeof pkg.version !== 'string') {
      console.warn(`[Store] ${managerName} package at index ${i} has invalid version, skipping`)
      continue
    }
    
    // Item is valid, add to result
    validPackages.push(item as PackageInfo)
  }
  
  // Log if some items were filtered out
  if (validPackages.length !== data.length) {
    console.warn(`[Store] ${managerName} packages: ${data.length - validPackages.length} invalid items filtered out`)
  }
  
  return validPackages
}

/**
 * Detect system language and return supported language code
 * Validates: Requirements 13.6
 */
function detectSystemLanguage(): SupportedLanguage {
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || 'en-US'
    
    // Check for Chinese variants
    if (lang.startsWith('zh')) {
      return 'zh-CN'
    }
  }
  
  return 'en-US'
}

// ============================================================================
// Store Hooks for Specific State Slices
// ============================================================================

/**
 * Hook for tools state
 */
export const useToolsState = () => useAppStore((state) => ({
  tools: state.tools,
  loading: state.toolsLoading,
  error: state.toolsError,
  loadTools: state.loadTools,
}))

/**
 * Hook for packages state
 */
export const usePackagesState = () => useAppStore((state) => ({
  npmPackages: state.npmPackages,
  pipPackages: state.pipPackages,
  composerPackages: state.composerPackages,
  loading: state.packagesLoading,
  error: state.packagesError,
  loadPackages: state.loadPackages,
  uninstallPackage: state.uninstallPackage,
}))

/**
 * Hook for services state
 */
export const useServicesState = () => useAppStore((state) => ({
  services: state.runningServices,
  loading: state.servicesLoading,
  error: state.servicesError,
  loadServices: state.loadServices,
  killService: state.killService,
}))

/**
 * Hook for environment state
 */
export const useEnvironmentState = () => useAppStore((state) => ({
  variables: state.environmentVariables,
  pathEntries: state.pathEntries,
  loading: state.envLoading,
  error: state.envError,
  loadEnvironment: state.loadEnvironment,
}))

/**
 * Hook for UI state
 */
export const useUIState = () => useAppStore((state) => ({
  currentView: state.currentView,
  language: state.language,
  setCurrentView: state.setCurrentView,
  setLanguage: state.setLanguage,
}))

/**
 * Hook for detection progress
 */
export const useDetectionProgress = () => useAppStore((state) => ({
  progress: state.detectionProgress,
  setProgress: state.setDetectionProgress,
}))

export default useAppStore
