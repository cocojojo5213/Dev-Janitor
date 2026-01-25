import { useState, useCallback, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { scanTools, uninstallTool } from '../../ipc/commands';
import { useAppStore } from '../../store';

export function ToolsView() {
    const { t } = useTranslation();

    // Use global store for data that should persist
    const tools = useAppStore((state) => state.toolsData);
    const setTools = useAppStore((state) => state.setToolsData);

    // Local state for transient UI
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [expandedTool, setExpandedTool] = useState<string | null>(null);
    const [uninstallingTool, setUninstallingTool] = useState<string | null>(null);

    const handleScan = useCallback(async () => {
        setIsScanning(true);
        setError(null);
        setSuccess(null);

        try {
            const detected = await scanTools();
            setTools(detected);
        } catch (e) {
            setError(String(e));
        } finally {
            setIsScanning(false);
        }
    }, [setTools]);

    const handleUninstall = async (toolId: string, toolName: string, path: string) => {
        if (!confirm(t('tools.confirm_uninstall', { name: toolName }))) {
            return;
        }

        setUninstallingTool(toolId);
        setError(null);
        setSuccess(null);

        try {
            await uninstallTool(toolId, path);
            setSuccess(t('tools.success_uninstall', { name: toolName }));
            await handleScan();
        } catch (e) {
            setError(String(e));
        } finally {
            setUninstallingTool(null);
        }
    };

    const toggleExpand = (toolId: string) => {
        setExpandedTool(expandedTool === toolId ? null : toolId);
    };

    const copyPath = async (path: string) => {
        try {
            await navigator.clipboard.writeText(path);
        } catch (e) {
            console.error('Failed to copy:', e);
        }
    };

    // Group tools by category
    const groupedTools = tools.reduce((acc, tool) => {
        if (!acc[tool.category]) {
            acc[tool.category] = [];
        }
        acc[tool.category].push(tool);
        return acc;
    }, {} as Record<string, typeof tools>);

    const categoryNames: Record<string, string> = {
        runtime: t('tools.categories.runtime'),
        package_manager: t('tools.categories.package_manager'),
        version_manager: t('tools.categories.version_manager'),
        build_tool: t('tools.categories.build_tool'),
        version_control: t('tools.categories.version_control'),
        container: t('tools.categories.container'),
        ai_cli: t('tools.categories.ai_cli'),
    };

    return (
        <div className="view-container">
            <div className="view-header">
                <div>
                    <p className="text-secondary">{t('tools.description')}</p>
                    {tools.length > 0 && (
                        <p className="text-tertiary" style={{ marginTop: 4 }}>
                            {t('tools.total_found', { count: tools.length })}
                        </p>
                    )}
                </div>
                <button className="btn btn-primary" onClick={handleScan} disabled={isScanning}>
                    {isScanning ? (
                        <>
                            <span className="spinner" style={{ width: 14, height: 14 }} />
                            {t('tools.scanning')}
                        </>
                    ) : (
                        t('tools.scan')
                    )}
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

            {tools.length === 0 && !isScanning ? (
                <div className="card">
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                        </svg>
                        <p>{t('tools.no_tools')}</p>
                        <button className="btn btn-secondary" onClick={handleScan}>
                            {t('tools.scan')}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="tools-grid">
                    {Object.entries(groupedTools).map(([category, categoryTools]) => (
                        <div key={category} className="card tools-category">
                            <h3 className="category-title">{categoryNames[category] || category}</h3>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '25%' }}>{t('tools.name')}</th>
                                            <th style={{ width: '20%' }}>{t('tools.version')}</th>
                                            <th style={{ width: '30%' }}>{t('tools.path')}</th>
                                            <th style={{ width: '10%' }}>{t('tools.status')}</th>
                                            <th style={{ width: '15%' }}>{t('tools.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categoryTools.map((tool) => (
                                            <Fragment key={tool.id}>
                                                <tr key={tool.id} onClick={() => tool.versions.length > 1 && toggleExpand(tool.id)} style={{ cursor: tool.versions.length > 1 ? 'pointer' : 'default' }}>
                                                    <td>
                                                        <strong>{tool.name}</strong>
                                                        {tool.versions.length > 1 && (
                                                            <span className="expand-icon">{expandedTool === tool.id ? '-' : '+'}</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {tool.versions.length > 1 ? (
                                                            <span className="badge badge-warning">
                                                                {t('tools.versions', { count: tool.versions.length })}
                                                            </span>
                                                        ) : (
                                                            tool.versions[0]?.version || '-'
                                                        )}
                                                    </td>
                                                    <td className="path-cell" onClick={(e) => { e.stopPropagation(); copyPath(tool.versions[0]?.path || ''); }}>
                                                        {tool.versions[0]?.path || '-'}
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${tool.status === 'installed' ? 'badge-success' : tool.status === 'multiple_versions' ? 'badge-warning' : 'badge-danger'}`}>
                                                            {t(`tools.${tool.status}`)}
                                                        </span>
                                                    </td>
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            className="btn btn-secondary btn-small"
                                                            onClick={() => handleUninstall(tool.id, tool.name, tool.versions[0]?.path || '')}
                                                            disabled={uninstallingTool === tool.id}
                                                        >
                                                            {uninstallingTool === tool.id ? (
                                                                <span className="spinner" style={{ width: 12, height: 12 }} />
                                                            ) : (
                                                                t('tools.uninstall')
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expandedTool === tool.id && tool.versions.length > 1 && tool.versions.map((ver, idx) => (
                                                    <tr key={`${tool.id}-${idx}`} className="version-row">
                                                        <td></td>
                                                        <td>
                                                            {ver.version}
                                                            {ver.is_active && (
                                                                <span className="badge badge-success" style={{ marginLeft: 8 }}>
                                                                    {t('tools.active')}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="path-cell" onClick={() => copyPath(ver.path)}>
                                                            {ver.path}
                                                        </td>
                                                        <td></td>
                                                        <td>
                                                            <button
                                                                className="btn btn-secondary btn-small"
                                                                onClick={() => handleUninstall(tool.id, `${tool.name} ${ver.version}`, ver.path)}
                                                                disabled={uninstallingTool === tool.id}
                                                            >
                                                                {t('tools.uninstall')}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </Fragment>
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
        .tools-grid {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        .tools-category {
          padding: var(--spacing-md);
        }
        .category-title {
          font-size: var(--font-size-md);
          font-weight: 600;
          margin-bottom: var(--spacing-md);
          color: var(--color-primary);
        }
        .path-cell {
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 12px;
          color: var(--color-text-secondary);
          cursor: pointer;
          max-width: 250px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .path-cell:hover {
          color: var(--color-primary);
        }
        .expand-icon {
          margin-left: 8px;
          font-size: 10px;
          color: var(--color-text-tertiary);
        }
        .version-row {
          background-color: var(--color-bg-tertiary) !important;
        }
        .version-row td {
          padding-left: var(--spacing-lg) !important;
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
