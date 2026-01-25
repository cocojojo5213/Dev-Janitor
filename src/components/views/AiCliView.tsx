import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getAiCliTools, installAiTool, updateAiTool, uninstallAiTool } from '../../ipc/commands';
import { useAppStore, AiCliToolStore } from '../../store';

export function AiCliView() {
    const { t } = useTranslation();

    // Use global store for data that should persist
    const tools = useAppStore((state) => state.aiCliToolsData);
    const setTools = useAppStore((state) => state.setAiCliToolsData);

    // Local state for transient UI
    const [isLoading, setIsLoading] = useState(false);
    const [isOperating, setIsOperating] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const getToolDisplayName = (tool: AiCliToolStore) =>
        t(`ai_cli.tools.${tool.id}.name`, { defaultValue: tool.name });
    const getToolDescription = (tool: AiCliToolStore) =>
        t(`ai_cli.tools.${tool.id}.description`, { defaultValue: tool.description });

    const handleRefresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await getAiCliTools();
            setTools(result);
        } catch (e) {
            setError(String(e));
        } finally {
            setIsLoading(false);
        }
    }, [setTools]);

    const handleInstall = async (tool: AiCliToolStore) => {
        if (tool.install_command.startsWith('Download')) {
            window.open(tool.docs_url, '_blank');
            return;
        }

        const toolName = getToolDisplayName(tool);
        if (!confirm(t('ai_cli.confirm_install', { name: toolName, command: tool.install_command }))) {
            return;
        }

        setIsOperating(`install-${tool.id}`);
        setError(null);
        setSuccess(null);

        try {
            const result = await installAiTool(tool.id);
            const message = t('ai_cli.success_install', { name: toolName });
            setSuccess(result.trim() ? `${message}\n${result}` : message);
            await handleRefresh();
        } catch (e) {
            setError(String(e));
        } finally {
            setIsOperating(null);
        }
    };

    const handleUpdate = async (tool: AiCliToolStore) => {
        const toolName = getToolDisplayName(tool);
        if (!confirm(t('ai_cli.confirm_update', { name: toolName }))) {
            return;
        }

        setIsOperating(`update-${tool.id}`);
        setError(null);
        setSuccess(null);

        try {
            const result = await updateAiTool(tool.id);
            const message = t('ai_cli.success_update', { name: toolName });
            setSuccess(result.trim() ? `${message}\n${result}` : message);
            await handleRefresh();
        } catch (e) {
            setError(String(e));
        } finally {
            setIsOperating(null);
        }
    };

    const handleUninstall = async (tool: AiCliToolStore) => {
        const toolName = getToolDisplayName(tool);
        if (!confirm(t('ai_cli.confirm_uninstall', { name: toolName }))) {
            return;
        }

        setIsOperating(`uninstall-${tool.id}`);
        setError(null);
        setSuccess(null);

        try {
            const result = await uninstallAiTool(tool.id);
            const message = t('ai_cli.success_uninstall', { name: toolName });
            setSuccess(result.trim() ? `${message}\n${result}` : message);
            await handleRefresh();
        } catch (e) {
            setError(String(e));
        } finally {
            setIsOperating(null);
        }
    };

    const installedCount = tools.filter(t => t.installed).length;

    return (
        <div className="view-container">
            <div className="view-header">
                <div>
                    <p className="text-secondary">{t('ai_cli.description')}</p>
                    {tools.length > 0 && (
                        <p className="text-tertiary" style={{ marginTop: 4 }}>
                            {t('ai_cli.installed_summary', { installed: installedCount, total: tools.length })}
                        </p>
                    )}
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleRefresh}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span className="spinner" style={{ width: 14, height: 14 }} />
                            {t('ai_cli.scanning')}
                        </>
                    ) : (
                        t('common.refresh')
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
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{success}</pre>
                </div>
            )}

            {tools.length > 0 && (
                <div className="tools-grid">
                    {tools.map((tool) => (
                        <div key={tool.id} className={`card tool-card ${tool.installed ? 'installed' : ''}`}>
                            <div className="tool-header">
                                <h4>{getToolDisplayName(tool)}</h4>
                                {tool.installed ? (
                                    <span className="status-badge installed">{t('ai_cli.status_installed')}</span>
                                ) : (
                                    <span className="status-badge not-installed">{t('ai_cli.status_not_installed')}</span>
                                )}
                            </div>
                            <p className="tool-description">{getToolDescription(tool)}</p>
                            {tool.version && (
                                <p className="tool-version">v{tool.version}</p>
                            )}
                            <div className="tool-actions">
                                {tool.installed ? (
                                    <>
                                        <button
                                            className="btn btn-primary btn-small"
                                            onClick={() => handleUpdate(tool)}
                                            disabled={isOperating !== null}
                                        >
                                            {isOperating === `update-${tool.id}` ? (
                                                <span className="spinner" style={{ width: 12, height: 12 }} />
                                            ) : (
                                                t('ai_cli.update')
                                            )}
                                        </button>
                                        <button
                                            className="btn btn-danger btn-small"
                                            onClick={() => handleUninstall(tool)}
                                            disabled={isOperating !== null}
                                        >
                                            {isOperating === `uninstall-${tool.id}` ? (
                                                <span className="spinner" style={{ width: 12, height: 12 }} />
                                            ) : (
                                                t('ai_cli.uninstall')
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className="btn btn-primary btn-small"
                                        onClick={() => handleInstall(tool)}
                                        disabled={isOperating !== null}
                                    >
                                        {isOperating === `install-${tool.id}` ? (
                                            <span className="spinner" style={{ width: 12, height: 12 }} />
                                        ) : (
                                            t('ai_cli.install')
                                        )}
                                    </button>
                                )}
                                <a
                                    href={tool.docs_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-secondary btn-small"
                                >
                                    {t('ai_cli.docs')}
                                </a>
                            </div>

                            {tool.config_paths && tool.config_paths.length > 0 && (
                                <div className="config-section">
                                    <h5>{t('ai_cli.config_files')}</h5>
                                    <div className="config-list">
                                        {tool.config_paths.map((config, idx) => (
                                            <div key={idx} className={`config-item ${config.exists ? 'exists' : 'missing'}`}>
                                                <span className="config-name">{config.name}</span>
                                                <span className="config-path" title={config.path}>
                                                    {config.path}
                                                </span>
                                                <span className={`config-status ${config.exists ? 'exists' : 'missing'}`}>
                                                    {config.exists ? t('ai_cli.config_exists') : t('ai_cli.config_missing')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {tools.length === 0 && !isLoading && (
                <div className="card empty-state">
                    <p>{t('ai_cli.empty')}</p>
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
        .tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--spacing-md);
        }
        .tool-card {
          padding: var(--spacing-md);
          transition: all 0.2s;
        }
        .tool-card.installed {
          border-color: var(--color-success);
        }
        .tool-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }
        .tool-header h4 {
          margin: 0;
          font-size: var(--font-size-md);
        }
        .status-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
        }
        .status-badge.installed {
          background: rgba(82, 196, 26, 0.2);
          color: #52c41a;
        }
        .status-badge.not-installed {
          background: var(--color-bg-tertiary);
          color: var(--color-text-tertiary);
        }
        .tool-description {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
          margin: 0 0 var(--spacing-sm) 0;
        }
        .tool-version {
          font-family: 'Consolas', monospace;
          font-size: 12px;
          color: var(--color-text-tertiary);
          margin: 0 0 var(--spacing-md) 0;
        }
        .tool-actions {
          display: flex;
          gap: var(--spacing-xs);
        }
        .btn-small {
          padding: 4px 12px;
          font-size: 12px;
        }
        .btn-danger {
          background: var(--color-danger);
          color: white;
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
        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 200px;
          color: var(--color-text-tertiary);
        }
        .config-section {
          margin-top: var(--spacing-md);
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--color-border);
        }
        .config-section h5 {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: 12px;
          color: var(--color-text-secondary);
        }
        .config-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .config-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 4px;
          background: var(--color-bg-secondary);
        }
        .config-item.exists {
          background: rgba(82, 196, 26, 0.1);
        }
        .config-item.missing {
          background: var(--color-bg-tertiary);
        }
        .config-name {
          font-weight: 500;
          min-width: 100px;
        }
        .config-path {
          flex: 1;
          font-family: 'Consolas', monospace;
          color: var(--color-text-tertiary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          cursor: pointer;
        }
        .config-path:hover {
          color: var(--color-primary);
        }
        .config-status.exists {
          color: #52c41a;
        }
        .config-status.missing {
          color: var(--color-text-tertiary);
        }
      `}</style>
        </div>
    );
}
