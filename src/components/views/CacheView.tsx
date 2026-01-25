import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { scanCaches, scanProjectCaches, cleanCache, cleanMultipleCaches } from '../../ipc/commands';
import { useAppStore, CacheInfoStore } from '../../store';

export function CacheView() {
    const { t } = useTranslation();

    // Use global store for data that should persist
    const packageCaches = useAppStore((state) => state.cachePackageData);
    const setPackageCaches = useAppStore((state) => state.setCachePackageData);
    const projectCaches = useAppStore((state) => state.cacheProjectData);
    const setProjectCaches = useAppStore((state) => state.setCacheProjectData);
    const projectPath = useAppStore((state) => state.cacheProjectPath);
    const setProjectPath = useAppStore((state) => state.setCacheProjectPath);

    // Local state for transient UI
    const [isScanning, setIsScanning] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedPackageCaches, setSelectedPackageCaches] = useState<Set<string>>(new Set());
    const [selectedProjectCaches, setSelectedProjectCaches] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'package' | 'project'>('package');

    const handleScanPackageCaches = useCallback(async () => {
        setIsScanning(true);
        setError(null);
        setSuccess(null);

        try {
            const caches = await scanCaches();
            setPackageCaches(caches);
        } catch (e) {
            setError(String(e));
        } finally {
            setIsScanning(false);
        }
    }, [setPackageCaches]);

    const handleScanProjectCaches = useCallback(async () => {
        if (!projectPath.trim()) {
            setError(t('cache.error_no_project_path'));
            return;
        }

        setIsScanning(true);
        setError(null);
        setSuccess(null);

        try {
            const caches = await scanProjectCaches(projectPath, 5);
            setProjectCaches(caches);
        } catch (e) {
            setError(String(e));
        } finally {
            setIsScanning(false);
        }
    }, [projectPath, setProjectCaches, t]);

    const toggleCacheSelection = (path: string) => {
        const selectedCaches = activeTab === 'package' ? selectedPackageCaches : selectedProjectCaches;
        const setSelectedCaches = activeTab === 'package' ? setSelectedPackageCaches : setSelectedProjectCaches;
        const newSelected = new Set(selectedCaches);
        if (newSelected.has(path)) {
            newSelected.delete(path);
        } else {
            newSelected.add(path);
        }
        setSelectedCaches(newSelected);
    };

    const selectAllCaches = (
        caches: CacheInfoStore[],
        selected: Set<string>,
        setSelected: (next: Set<string>) => void
    ) => {
        const newSelected = new Set(selected);
        caches.forEach(c => newSelected.add(c.path));
        setSelected(newSelected);
    };

    const deselectAllCaches = (
        caches: CacheInfoStore[],
        selected: Set<string>,
        setSelected: (next: Set<string>) => void
    ) => {
        const newSelected = new Set(selected);
        caches.forEach(c => newSelected.delete(c.path));
        setSelected(newSelected);
    };

    const handleCleanSelected = async () => {
        const selectedCaches = activeTab === 'package' ? selectedPackageCaches : selectedProjectCaches;
        if (selectedCaches.size === 0) {
            setError(t('cache.error_no_selection'));
            return;
        }

        const totalSize = currentCaches
            .filter(c => selectedCaches.has(c.path))
            .reduce((sum, c) => sum + c.size, 0);

        const sizeDisplay = formatSize(totalSize);

        const selectedPaths = [...selectedCaches];

        if (!confirm(t('cache.confirm_clean', { count: selectedPaths.length, size: sizeDisplay }))) {
            return;
        }

        setIsCleaning(true);
        setError(null);
        setSuccess(null);

        try {
            const results = await cleanMultipleCaches(selectedPaths);
            const successCount = results.filter(r => r.Ok).length;
            const failCount = results.filter(r => r.Err).length;

            if (failCount > 0) {
                const errors = results.filter(r => r.Err).map(r => r.Err).join('\n');
                setError(t('cache.partial_failed', { count: failCount, errors }));
            }

            if (successCount > 0) {
                setSuccess(t('cache.success_cleaned', { count: successCount }));
            }

            // Refresh
            if (activeTab === 'package') {
                setSelectedPackageCaches(new Set());
                await handleScanPackageCaches();
            } else {
                setSelectedProjectCaches(new Set());
                await handleScanProjectCaches();
            }
        } catch (e) {
            setError(String(e));
        } finally {
            setIsCleaning(false);
        }
    };

    const handleCleanSingle = async (cache: CacheInfoStore) => {
        const displayName = getCacheDisplayName(cache);
        if (!confirm(t('cache.confirm_clean_single', { name: displayName, size: cache.size_display }))) {
            return;
        }

        setIsCleaning(true);
        setError(null);
        setSuccess(null);

        try {
            await cleanCache(cache.path);
            setSuccess(t('cache.success_clean_single', { name: displayName, size: cache.size_display }));

            // Refresh
            if (activeTab === 'package') {
                await handleScanPackageCaches();
            } else {
                await handleScanProjectCaches();
            }
        } catch (e) {
            setError(String(e));
        } finally {
            setIsCleaning(false);
        }
    };

    const formatSize = (bytes: number): string => {
        const KB = 1024;
        const MB = KB * 1024;
        const GB = MB * 1024;

        if (bytes >= GB) return `${(bytes / GB).toFixed(2)} GB`;
        if (bytes >= MB) return `${(bytes / MB).toFixed(2)} MB`;
        if (bytes >= KB) return `${(bytes / KB).toFixed(2)} KB`;
        return `${bytes} B`;
    };

    const currentCaches = activeTab === 'package' ? packageCaches : projectCaches;
    const selectedCaches = activeTab === 'package' ? selectedPackageCaches : selectedProjectCaches;
    const totalSize = currentCaches.reduce((sum, c) => sum + c.size, 0);
    const selectedSize = currentCaches
        .filter(c => selectedCaches.has(c.path))
        .reduce((sum, c) => sum + c.size, 0);

    const cacheNameMap: Record<string, string> = {
        'npm Cache': t('cache.names.npm'),
        'Yarn Cache': t('cache.names.yarn'),
        'pnpm Cache': t('cache.names.pnpm'),
        'pip Cache': t('cache.names.pip'),
        'Conda Cache': t('cache.names.conda'),
        'Cargo Cache': t('cache.names.cargo'),
        'Composer Cache': t('cache.names.composer'),
        'Maven Cache': t('cache.names.maven'),
        'Gradle Cache': t('cache.names.gradle'),
        'Homebrew Cache': t('cache.names.homebrew'),
        'Go Modules Cache': t('cache.names.go_modules'),
        'Node Modules': t('cache.names.node_modules'),
        'Rust Target': t('cache.names.rust_target'),
        'Python Cache': t('cache.names.python_cache'),
        'Gradle Build': t('cache.names.gradle_build'),
        'Build Output': t('cache.names.build_output'),
        'Dist Output': t('cache.names.dist_output'),
        'Next.js Cache': t('cache.names.next_cache'),
        'Nuxt.js Cache': t('cache.names.nuxt_cache'),
        'Turbo Cache': t('cache.names.turbo_cache'),
        'Python Venv': t('cache.names.python_venv'),
        'Vendor Directory': t('cache.names.vendor_directory'),
    };

    const getCacheDisplayName = (cache: CacheInfoStore) => cacheNameMap[cache.name] || cache.name;

    return (
        <div className="view-container">
            <div className="view-header">
                <div>
                    <p className="text-secondary">{t('cache.description')}</p>
                    {currentCaches.length > 0 && (
                        <p className="text-tertiary" style={{ marginTop: 4 }}>
                            {t('cache.total_size', { size: formatSize(totalSize) })}
                            {selectedCaches.size > 0 && (
                                <span className="badge badge-primary" style={{ marginLeft: 8 }}>
                                    {t('cache.selected_summary', {
                                        count: selectedCaches.size,
                                        size: formatSize(selectedSize),
                                    })}
                                </span>
                            )}
                        </p>
                    )}
                </div>
                <div className="header-actions">
                    {selectedCaches.size > 0 && (
                        <button
                            className="btn btn-danger"
                            onClick={handleCleanSelected}
                            disabled={isCleaning}
                        >
                            {isCleaning ? (
                                <span className="spinner" style={{ width: 14, height: 14 }} />
                            ) : (
                                t('cache.clean_selected')
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'package' ? 'active' : ''}`}
                    onClick={() => setActiveTab('package')}
                >
                    {t('cache.package_caches')}
                </button>
                <button
                    className={`tab ${activeTab === 'project' ? 'active' : ''}`}
                    onClick={() => setActiveTab('project')}
                >
                    {t('cache.project_caches')}
                </button>
            </div>

            {error && (
                <div className="card message-card error-card">
                    <p>{error}</p>
                </div>
            )}

            {success && (
                <div className="card message-card success-card">
                    <p>{success}</p>
                </div>
            )}

            {/* Package Manager Caches Tab */}
            {activeTab === 'package' && (
                <div className="tab-content">
                    <div className="scan-bar">
                        <button
                            className="btn btn-primary"
                            onClick={handleScanPackageCaches}
                            disabled={isScanning}
                        >
                            {isScanning ? (
                                <>
                                    <span className="spinner" style={{ width: 14, height: 14 }} />
                                    {t('common.loading')}
                                </>
                            ) : (
                                t('cache.scan_package_caches')
                            )}
                        </button>
                        {packageCaches.length > 0 && (
                            <div className="select-actions">
                                <button className="btn btn-secondary btn-small" onClick={() => selectAllCaches(packageCaches, selectedPackageCaches, setSelectedPackageCaches)}>
                                    {t('common.select_all')}
                                </button>
                                <button className="btn btn-secondary btn-small" onClick={() => deselectAllCaches(packageCaches, selectedPackageCaches, setSelectedPackageCaches)}>
                                    {t('common.deselect_all')}
                                </button>
                            </div>
                        )}
                    </div>

                    {packageCaches.length > 0 && (
                        <div className="card">
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '5%' }}></th>
                                            <th style={{ width: '20%' }}>{t('cache.name')}</th>
                                            <th style={{ width: '50%' }}>{t('cache.path')}</th>
                                            <th style={{ width: '15%' }}>{t('cache.size')}</th>
                                            <th style={{ width: '10%' }}>{t('tools.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {packageCaches.map((cache) => (
                                            <tr key={cache.id}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPackageCaches.has(cache.path)}
                                                        onChange={() => toggleCacheSelection(cache.path)}
                                                    />
                                                </td>
                                                <td><strong>{getCacheDisplayName(cache)}</strong></td>
                                                <td className="path-cell">{cache.path}</td>
                                                <td className="size-cell">{cache.size_display}</td>
                                                <td>
                                                    <button
                                                        className="btn btn-danger btn-small"
                                                        onClick={() => handleCleanSingle(cache)}
                                                        disabled={isCleaning}
                                                    >
                                                        {t('cache.clean')}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Project Caches Tab */}
            {activeTab === 'project' && (
                <div className="tab-content">
                    <div className="scan-bar project-scan">
                        <input
                            type="text"
                            className="path-input"
                            placeholder={t('cache.project_path_placeholder')}
                            value={projectPath}
                            onChange={(e) => setProjectPath(e.target.value)}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleScanProjectCaches}
                            disabled={isScanning || !projectPath.trim()}
                        >
                            {isScanning ? (
                                <>
                                    <span className="spinner" style={{ width: 14, height: 14 }} />
                                    {t('common.loading')}
                                </>
                            ) : (
                                t('cache.scan_project_caches')
                            )}
                        </button>
                    </div>

                    {projectCaches.length > 0 && (
                        <>
                            <div className="select-actions">
                                <button className="btn btn-secondary btn-small" onClick={() => selectAllCaches(projectCaches, selectedProjectCaches, setSelectedProjectCaches)}>
                                    {t('common.select_all')}
                                </button>
                                <button className="btn btn-secondary btn-small" onClick={() => deselectAllCaches(projectCaches, selectedProjectCaches, setSelectedProjectCaches)}>
                                    {t('common.deselect_all')}
                                </button>
                            </div>
                            <div className="card">
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '5%' }}></th>
                                                <th style={{ width: '15%' }}>{t('cache.name')}</th>
                                                <th style={{ width: '55%' }}>{t('cache.path')}</th>
                                                <th style={{ width: '15%' }}>{t('cache.size')}</th>
                                                <th style={{ width: '10%' }}>{t('tools.actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {projectCaches.map((cache) => (
                                                <tr key={cache.id}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedProjectCaches.has(cache.path)}
                                                            onChange={() => toggleCacheSelection(cache.path)}
                                                        />
                                                    </td>
                                                    <td><strong>{getCacheDisplayName(cache)}</strong></td>
                                                    <td className="path-cell">{cache.path}</td>
                                                    <td className="size-cell">{cache.size_display}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-danger btn-small"
                                                            onClick={() => handleCleanSingle(cache)}
                                                            disabled={isCleaning}
                                                        >
                                                            {t('cache.clean')}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            <style>{`
        .view-container {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        .view-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .header-actions {
          display: flex;
          gap: var(--spacing-sm);
        }
        .tabs {
          display: flex;
          border-bottom: 1px solid var(--color-border);
        }
        .tab {
          padding: var(--spacing-sm) var(--spacing-lg);
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .tab:hover {
          color: var(--color-primary);
        }
        .tab.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }
        .tab-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        .scan-bar {
          display: flex;
          gap: var(--spacing-md);
          align-items: center;
        }
        .project-scan {
          flex-wrap: wrap;
        }
        .path-input {
          flex: 1;
          min-width: 300px;
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius-sm);
          background: var(--color-bg-primary);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
        }
        .select-actions {
          display: flex;
          gap: var(--spacing-sm);
        }
        .path-cell {
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 12px;
          color: var(--color-text-secondary);
          max-width: 400px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .size-cell {
          font-weight: 600;
          color: var(--color-warning);
        }
        .btn-small {
          padding: 4px 8px;
          font-size: 12px;
        }
        .btn-danger {
          background: var(--color-danger);
          color: white;
        }
        .btn-danger:hover {
          background: #ff6b6b;
        }
        .message-card {
          padding: var(--spacing-md);
        }
        .error-card {
          border-color: var(--color-danger);
          background-color: rgba(255, 77, 79, 0.1);
          color: var(--color-danger);
        }
        .success-card {
          border-color: var(--color-success);
          background-color: rgba(82, 196, 26, 0.1);
          color: var(--color-success);
        }
      `}</style>
        </div>
    );
}
