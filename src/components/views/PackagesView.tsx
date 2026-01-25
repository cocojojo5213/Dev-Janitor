import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { scanPackages, updatePackage, uninstallPackage } from '../../ipc/commands';
import { useAppStore, PackageInfoStore } from '../../store';

export function PackagesView() {
    const { t } = useTranslation();

    // Use global store for state that should persist across page switches
    const packages = useAppStore((state) => state.packagesData);
    const setPackages = useAppStore((state) => state.setPackagesData);
    const filterManager = useAppStore((state) => state.packagesFilterManager);
    const setFilterManager = useAppStore((state) => state.setPackagesFilterManager);
    const filterOutdated = useAppStore((state) => state.packagesFilterOutdated);
    const setFilterOutdated = useAppStore((state) => state.setPackagesFilterOutdated);

    // Local state for transient UI states
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [operatingPackage, setOperatingPackage] = useState<string | null>(null);

    const handleScan = useCallback(async () => {
        setIsScanning(true);
        setError(null);
        setSuccess(null);

        try {
            const detected = await scanPackages();
            setPackages(detected);
        } catch (e) {
            setError(String(e));
        } finally {
            setIsScanning(false);
        }
    }, [setPackages]);

    const handleUpdate = async (manager: string, name: string) => {
        setOperatingPackage(`update-${manager}-${name}`);
        setError(null);
        setSuccess(null);

        try {
            await updatePackage(manager, name);
            setSuccess(t('packages.success_update', { name }));
            await handleScan();
        } catch (e) {
            setError(String(e));
        } finally {
            setOperatingPackage(null);
        }
    };

    const handleUninstall = async (manager: string, name: string) => {
        if (!confirm(t('packages.confirm_uninstall', { name }))) {
            return;
        }

        setOperatingPackage(`uninstall-${manager}-${name}`);
        setError(null);
        setSuccess(null);

        try {
            await uninstallPackage(manager, name);
            setSuccess(t('packages.success_uninstall', { name }));
            await handleScan();
        } catch (e) {
            setError(String(e));
        } finally {
            setOperatingPackage(null);
        }
    };

    // Get unique managers for filter
    const managers = [...new Set(packages.map(p => p.manager))];

    // Filter packages
    const filteredPackages = packages.filter(pkg => {
        if (filterManager !== 'all' && pkg.manager !== filterManager) return false;
        if (filterOutdated && !pkg.is_outdated) return false;
        return true;
    });

    // Group by manager
    const groupedPackages = filteredPackages.reduce((acc, pkg) => {
        if (!acc[pkg.manager]) {
            acc[pkg.manager] = [];
        }
        acc[pkg.manager].push(pkg);
        return acc;
    }, {} as Record<string, PackageInfoStore[]>);

    const managerDisplayNames: Record<string, string> = {
        npm: t('packages.managers.npm'),
        pip: t('packages.managers.pip'),
        cargo: t('packages.managers.cargo'),
        composer: t('packages.managers.composer'),
        homebrew: t('packages.managers.homebrew'),
        conda: t('packages.managers.conda'),
    };

    const outdatedCount = packages.filter(p => p.is_outdated).length;

    return (
        <div className="view-container">
            <div className="view-header">
                <div>
                    <p className="text-secondary">{t('packages.description')}</p>
                    {packages.length > 0 && (
                        <p className="text-tertiary" style={{ marginTop: 4 }}>
                            {t('packages.summary', { packages: packages.length, managers: managers.length })}
                            {outdatedCount > 0 && (
                                <span className="badge badge-warning" style={{ marginLeft: 8 }}>
                                    {outdatedCount} {t('packages.outdated')}
                                </span>
                            )}
                        </p>
                    )}
                </div>
                <button className="btn btn-primary" onClick={handleScan} disabled={isScanning}>
                    {isScanning ? (
                        <>
                            <span className="spinner" style={{ width: 14, height: 14 }} />
                            {t('common.loading')}
                        </>
                    ) : (
                        t('packages.refresh')
                    )}
                </button>
            </div>

            {/* Filters */}
            {packages.length > 0 && (
                <div className="filter-bar">
                    <select
                        className="filter-select"
                        value={filterManager}
                        onChange={(e) => setFilterManager(e.target.value)}
                    >
                        <option value="all">{t('packages.filter_all_managers')}</option>
                        {managers.map(m => (
                            <option key={m} value={m}>{managerDisplayNames[m] || m}</option>
                        ))}
                    </select>
                    <label className="filter-checkbox">
                        <input
                            type="checkbox"
                            checked={filterOutdated}
                            onChange={(e) => setFilterOutdated(e.target.checked)}
                        />
                        {t('packages.filter_outdated_only')}
                    </label>
                </div>
            )}

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

            {packages.length === 0 && !isScanning ? (
                <div className="card">
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                        <p>{t('packages.empty')}</p>
                        <button className="btn btn-secondary" onClick={handleScan}>
                            {t('packages.refresh')}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="packages-grid">
                    {Object.entries(groupedPackages).map(([manager, managerPackages]) => (
                        <div key={manager} className="card packages-category">
                            <h3 className="category-title">
                                {managerDisplayNames[manager] || manager}
                                <span className="category-count">{managerPackages.length}</span>
                            </h3>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '35%' }}>{t('packages.name')}</th>
                                            <th style={{ width: '15%' }}>{t('packages.version')}</th>
                                            <th style={{ width: '15%' }}>{t('packages.latest')}</th>
                                            <th style={{ width: '15%' }}>{t('packages.status')}</th>
                                            <th style={{ width: '20%' }}>{t('tools.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {managerPackages.map((pkg) => (
                                            <tr key={`${pkg.manager}-${pkg.name}`}>
                                                <td>
                                                    <strong>{pkg.name}</strong>
                                                    {pkg.description && (
                                                        <span className="pkg-description">{pkg.description}</span>
                                                    )}
                                                </td>
                                                <td>{pkg.version}</td>
                                                <td>{pkg.latest || '-'}</td>
                                                <td>
                                                    {pkg.is_outdated ? (
                                                        <span className="badge badge-warning">{t('packages.outdated')}</span>
                                                    ) : (
                                                        <span className="badge badge-success">{t('packages.up_to_date')}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        {pkg.is_outdated && (
                                                            <button
                                                                className="btn btn-primary btn-small"
                                                                onClick={() => handleUpdate(pkg.manager, pkg.name)}
                                                                disabled={operatingPackage !== null}
                                                            >
                                                                {operatingPackage === `update-${pkg.manager}-${pkg.name}` ? (
                                                                    <span className="spinner" style={{ width: 12, height: 12 }} />
                                                                ) : (
                                                                    t('packages.update')
                                                                )}
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn btn-secondary btn-small"
                                                            onClick={() => handleUninstall(pkg.manager, pkg.name)}
                                                            disabled={operatingPackage !== null}
                                                        >
                                                            {operatingPackage === `uninstall-${pkg.manager}-${pkg.name}` ? (
                                                                <span className="spinner" style={{ width: 12, height: 12 }} />
                                                            ) : (
                                                                t('packages.uninstall')
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
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
          margin-bottom: var(--spacing-sm);
        }
        .filter-bar {
          display: flex;
          gap: var(--spacing-md);
          align-items: center;
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-bg-secondary);
          border-radius: var(--border-radius-md);
        }
        .filter-select {
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius-sm);
          background: var(--color-bg-primary);
          color: var(--color-text-primary);
          font-size: var(--font-size-sm);
        }
        .filter-checkbox {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          cursor: pointer;
        }
        .packages-grid {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        .packages-category {
          padding: var(--spacing-md);
        }
        .category-title {
          font-size: var(--font-size-md);
          font-weight: 600;
          margin-bottom: var(--spacing-md);
          color: var(--color-primary);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        .category-count {
          background: var(--color-bg-tertiary);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
        }
        .pkg-description {
          display: block;
          font-size: 11px;
          color: var(--color-text-tertiary);
          margin-top: 2px;
        }
        .action-buttons {
          display: flex;
          gap: var(--spacing-xs);
        }
        .btn-small {
          padding: 4px 8px;
          font-size: 12px;
        }
        .message-card {
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-sm);
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
