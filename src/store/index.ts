import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============ Types ============

export type Theme = 'light' | 'dark' | 'system';
export type NavView = 'tools' | 'packages' | 'cache' | 'ai_cleanup' | 'chat_history' | 'services' | 'security_scan' | 'config' | 'ai_cli' | 'settings';

export interface ToolInfo {
    id: string;
    name: string;
    versions: ToolVersion[];
    path: string;
    status: 'installed' | 'not_in_path' | 'multiple_versions';
}

export interface ToolVersion {
    version: string;
    path: string;
    isActive: boolean;
}

export interface PackageInfo {
    name: string;
    version: string;
    latest?: string;
    manager: string;
    isOutdated: boolean;
}

export interface CacheInfo {
    manager: string;
    path: string;
    size: number;
}

export interface JunkFile {
    path: string;
    name: string;
    size: number;
    reason: string;
}

export interface PortInfo {
    port: number;
    pid: number;
    process: string;
}

export interface AiCliTool {
    id: string;
    name: string;
    installed: boolean;
    version?: string;
}

// ============ App Store ============

export interface AiJunkFileStore {
    id: string;
    name: string;
    path: string;
    size: number;
    size_display: string;
    junk_type: string;
    reason: string;
}

interface AppState {
    // Navigation
    currentView: NavView;
    setCurrentView: (view: NavView) => void;

    // Theme
    theme: Theme;
    setTheme: (theme: Theme) => void;

    // Settings
    aiEndpoint: string;
    setAiEndpoint: (endpoint: string) => void;

    // Loading states
    isScanning: boolean;
    setIsScanning: (scanning: boolean) => void;

    // Tools data
    tools: ToolInfo[];
    setTools: (tools: ToolInfo[]) => void;

    // Packages data
    packages: PackageInfo[];
    setPackages: (packages: PackageInfo[]) => void;

    // Caches data
    caches: CacheInfo[];
    setCaches: (caches: CacheInfo[]) => void;

    // AI Junk files
    junkFiles: JunkFile[];
    setJunkFiles: (files: JunkFile[]) => void;

    // Services
    ports: PortInfo[];
    setPorts: (ports: PortInfo[]) => void;

    // AI CLI Tools
    aiCliTools: AiCliTool[];
    setAiCliTools: (tools: AiCliTool[]) => void;

    // AI Cleanup View State (persisted across page switches)
    aiCleanupJunkFiles: AiJunkFileStore[];
    setAiCleanupJunkFiles: (files: AiJunkFileStore[]) => void;
    aiCleanupSelectedFiles: string[];
    setAiCleanupSelectedFiles: (files: string[]) => void;
    aiCleanupScanPath: string;
    setAiCleanupScanPath: (path: string) => void;
    aiCleanupScanDepth: number;
    setAiCleanupScanDepth: (depth: number) => void;
    aiCleanupFilterType: string;
    setAiCleanupFilterType: (type: string) => void;

    // Packages View State (persisted across page switches)
    packagesData: PackageInfoStore[];
    setPackagesData: (packages: PackageInfoStore[]) => void;
    packagesFilterManager: string;
    setPackagesFilterManager: (manager: string) => void;
    packagesFilterOutdated: boolean;
    setPackagesFilterOutdated: (outdated: boolean) => void;

    // Tools View State
    toolsData: ToolInfoStore[];
    setToolsData: (tools: ToolInfoStore[]) => void;

    // Cache View State
    cachePackageData: CacheInfoStore[];
    setCachePackageData: (caches: CacheInfoStore[]) => void;
    cacheProjectData: CacheInfoStore[];
    setCacheProjectData: (caches: CacheInfoStore[]) => void;
    cacheProjectPath: string;
    setCacheProjectPath: (path: string) => void;

    // Services View State
    servicesProcesses: ProcessInfoStore[];
    setServicesProcesses: (processes: ProcessInfoStore[]) => void;
    servicesPorts: PortInfoStore[];
    setServicesPorts: (ports: PortInfoStore[]) => void;

    // AI CLI View State
    aiCliToolsData: AiCliToolStore[];
    setAiCliToolsData: (tools: AiCliToolStore[]) => void;
}

export interface PackageInfoStore {
    name: string;
    version: string;
    latest: string | null;
    manager: string;
    is_outdated: boolean;
    description: string | null;
}

export interface ToolInfoStore {
    id: string;
    name: string;
    category: string;
    status: string;
    versions: Array<{ version: string; path: string; is_active: boolean }>;
}

export interface CacheInfoStore {
    id: string;
    name: string;
    path: string;
    size: number;
    size_display: string;
    cache_type: string;
}

export interface ProcessInfoStore {
    pid: number;
    name: string;
    category: string;
    status: string;
    memory: number;
    memory_display: string;
    cpu: number;
    exe_path: string;
}

export interface PortInfoStore {
    port: number;
    protocol: string;
    pid: number;
    process_name: string;
    state: string;
}

export interface AiCliToolStore {
    id: string;
    name: string;
    description: string;
    installed: boolean;
    version: string | null;
    install_command: string;
    docs_url: string;
    config_paths: Array<{ name: string; path: string; exists: boolean }> | null;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            // Navigation
            currentView: 'tools',
            setCurrentView: (view: NavView) => set({ currentView: view }),

            // Theme
            theme: 'system',
            setTheme: (theme: Theme) => {
                set({ theme });
                applyTheme(theme);
            },

            // Settings
            aiEndpoint: '',
            setAiEndpoint: (endpoint: string) => set({ aiEndpoint: endpoint }),

            // Loading
            isScanning: false,
            setIsScanning: (scanning: boolean) => set({ isScanning: scanning }),

            // Data
            tools: [],
            setTools: (tools: ToolInfo[]) => set({ tools }),
            packages: [],
            setPackages: (packages: PackageInfo[]) => set({ packages }),
            caches: [],
            setCaches: (caches: CacheInfo[]) => set({ caches }),
            junkFiles: [],
            setJunkFiles: (files: JunkFile[]) => set({ junkFiles: files }),
            ports: [],
            setPorts: (ports: PortInfo[]) => set({ ports }),
            aiCliTools: [],
            setAiCliTools: (tools: AiCliTool[]) => set({ aiCliTools: tools }),

            // AI Cleanup View State
            aiCleanupJunkFiles: [],
            setAiCleanupJunkFiles: (files: AiJunkFileStore[]) => set({ aiCleanupJunkFiles: files }),
            aiCleanupSelectedFiles: [],
            setAiCleanupSelectedFiles: (files: string[]) => set({ aiCleanupSelectedFiles: files }),
            aiCleanupScanPath: '',
            setAiCleanupScanPath: (path: string) => set({ aiCleanupScanPath: path }),
            aiCleanupScanDepth: 5,
            setAiCleanupScanDepth: (depth: number) => set({ aiCleanupScanDepth: depth }),
            aiCleanupFilterType: 'all',
            setAiCleanupFilterType: (type: string) => set({ aiCleanupFilterType: type }),

            // Packages View State
            packagesData: [],
            setPackagesData: (packages: PackageInfoStore[]) => set({ packagesData: packages }),
            packagesFilterManager: 'all',
            setPackagesFilterManager: (manager: string) => set({ packagesFilterManager: manager }),
            packagesFilterOutdated: false,
            setPackagesFilterOutdated: (outdated: boolean) => set({ packagesFilterOutdated: outdated }),

            // Tools View State
            toolsData: [],
            setToolsData: (tools: ToolInfoStore[]) => set({ toolsData: tools }),

            // Cache View State
            cachePackageData: [],
            setCachePackageData: (caches: CacheInfoStore[]) => set({ cachePackageData: caches }),
            cacheProjectData: [],
            setCacheProjectData: (caches: CacheInfoStore[]) => set({ cacheProjectData: caches }),
            cacheProjectPath: '',
            setCacheProjectPath: (path: string) => set({ cacheProjectPath: path }),

            // Services View State
            servicesProcesses: [],
            setServicesProcesses: (processes: ProcessInfoStore[]) => set({ servicesProcesses: processes }),
            servicesPorts: [],
            setServicesPorts: (ports: PortInfoStore[]) => set({ servicesPorts: ports }),

            // AI CLI View State
            aiCliToolsData: [],
            setAiCliToolsData: (tools: AiCliToolStore[]) => set({ aiCliToolsData: tools }),
        }),
        {
            name: 'dev-janitor-storage',
            partialize: (state: AppState) => ({
                theme: state.theme,
                aiEndpoint: state.aiEndpoint,
            }),
        }
    )
);

// ============ Theme Helper ============

export const applyTheme = (theme: Theme) => {
    const root = document.documentElement;

    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        root.setAttribute('data-theme', theme);
    }
};

// Initialize theme on load
const savedTheme = localStorage.getItem('dev-janitor-storage');
if (savedTheme) {
    try {
        const parsed = JSON.parse(savedTheme);
        if (parsed.state?.theme) {
            applyTheme(parsed.state.theme);
        }
    } catch {
        applyTheme('system');
    }
} else {
    applyTheme('system');
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const state = useAppStore.getState();
    if (state.theme === 'system') {
        applyTheme('system');
    }
});
