import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';

// Types matching Rust backend
interface SecurityFinding {
    tool_id: string;
    tool_name: string;
    issue: string;
    description: string;
    risk_level: 'Critical' | 'High' | 'Medium' | 'Low';
    remediation: string;
    details: string;
}

interface SecuritySummary {
    total_findings: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
}

interface SecurityScanResult {
    scan_time: string;
    tools_scanned: string[];
    findings: SecurityFinding[];
    summary: SecuritySummary;
}

interface SecurityToolInfo {
    id: string;
    name: string;
    description: string;
    docs_url: string;
    port_count: number;
    config_check_count: number;
}

export function SecurityScanView() {
    const { t } = useTranslation();

    const [isLoading, setIsLoading] = useState(false);
    const [scanResult, setScanResult] = useState<SecurityScanResult | null>(null);
    const [tools, setTools] = useState<SecurityToolInfo[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'scan' | 'tools'>('scan');
    const [filterRisk, setFilterRisk] = useState<string>('all');

    // Load supported tools on mount
    useEffect(() => {
        invoke<SecurityToolInfo[]>('get_security_tools_cmd')
            .then(setTools)
            .catch(console.error);
    }, []);

    const handleScan = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await invoke<SecurityScanResult>('scan_security_cmd');
            setScanResult(result);
        } catch (e) {
            setError(String(e));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleScanTool = useCallback(async (toolId: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await invoke<SecurityScanResult | null>('scan_tool_security_cmd', {
                toolId,
            });
            if (result) {
                setScanResult(result);
                setActiveTab('scan');
            }
        } catch (e) {
            setError(String(e));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const riskColors: Record<string, string> = {
        Critical: '#ff4d4f',
        High: '#fa8c16',
        Medium: '#fadb14',
        Low: '#1890ff',
    };

    const riskEmojis: Record<string, string> = {
        Critical: '🔴',
        High: '🟠',
        Medium: '🟡',
        Low: '🔵',
    };

    const filteredFindings = scanResult?.findings.filter(
        (f) => filterRisk === 'all' || f.risk_level === filterRisk
    ) || [];

    return (
        <div className="view-container">
            <div className="view-header">
                <div>
                    <p className="text-secondary">{t('security.description')}</p>
                    {scanResult && (
                        <p className="text-tertiary" style={{ marginTop: 4 }}>
                            {t('security.last_scan')}: {scanResult.scan_time}
                        </p>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'scan' ? 'active' : ''}`}
                    onClick={() => setActiveTab('scan')}
                >
                    {t('security.tab_scan')}
                </button>
                <button
                    className={`tab ${activeTab === 'tools' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tools')}
                >
                    {t('security.tab_tools')} ({tools.length})
                </button>
            </div>

            {error && (
                <div className="card message-card error-card">
                    <p>{error}</p>
                </div>
            )}

            {/* Scan Tab */}
            {activeTab === 'scan' && (
                <div className="tab-content">
                    <div className="action-bar">
                        <button
                            className="btn btn-primary"
                            onClick={handleScan}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="spinner" style={{ width: 14, height: 14 }} />
                            ) : (
                                t('security.scan_all')
                            )}
                        </button>
                        {scanResult && scanResult.findings.length > 0 && (
                            <select
                                className="filter-select"
                                value={filterRisk}
                                onChange={(e) => setFilterRisk(e.target.value)}
                            >
                                <option value="all">
                                    {t('security.filter_all')} ({scanResult.findings.length})
                                </option>
                                {scanResult.summary.critical > 0 && (
                                    <option value="Critical">
                                        🔴 Critical ({scanResult.summary.critical})
                                    </option>
                                )}
                                {scanResult.summary.high > 0 && (
                                    <option value="High">
                                        🟠 High ({scanResult.summary.high})
                                    </option>
                                )}
                                {scanResult.summary.medium > 0 && (
                                    <option value="Medium">
                                        🟡 Medium ({scanResult.summary.medium})
                                    </option>
                                )}
                                {scanResult.summary.low > 0 && (
                                    <option value="Low">
                                        🔵 Low ({scanResult.summary.low})
                                    </option>
                                )}
                            </select>
                        )}
                    </div>

                    {/* Summary Cards */}
                    {scanResult && (
                        <div className="summary-grid">
                            <div className="summary-card" style={{ borderColor: riskColors.Critical }}>
                                <span className="summary-count" style={{ color: riskColors.Critical }}>
                                    {scanResult.summary.critical}
                                </span>
                                <span className="summary-label">Critical</span>
                            </div>
                            <div className="summary-card" style={{ borderColor: riskColors.High }}>
                                <span className="summary-count" style={{ color: riskColors.High }}>
                                    {scanResult.summary.high}
                                </span>
                                <span className="summary-label">High</span>
                            </div>
                            <div className="summary-card" style={{ borderColor: riskColors.Medium }}>
                                <span className="summary-count" style={{ color: riskColors.Medium }}>
                                    {scanResult.summary.medium}
                                </span>
                                <span className="summary-label">Medium</span>
                            </div>
                            <div className="summary-card" style={{ borderColor: riskColors.Low }}>
                                <span className="summary-count" style={{ color: riskColors.Low }}>
                                    {scanResult.summary.low}
                                </span>
                                <span className="summary-label">Low</span>
                            </div>
                        </div>
                    )}

                    {/* No issues found */}
                    {scanResult && scanResult.findings.length === 0 && (
                        <div className="card success-card" style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
                            <span style={{ fontSize: 48 }}>✅</span>
                            <h3>{t('security.no_issues')}</h3>
                            <p className="text-secondary">{t('security.no_issues_desc')}</p>
                        </div>
                    )}

                    {/* Findings List */}
                    {filteredFindings.length > 0 && (
                        <div className="findings-list">
                            {filteredFindings.map((finding, idx) => (
                                <div
                                    key={`${finding.tool_id}-${idx}`}
                                    className="finding-card"
                                    style={{ borderLeftColor: riskColors[finding.risk_level] }}
                                >
                                    <div className="finding-header">
                                        <span className="risk-badge" style={{ backgroundColor: riskColors[finding.risk_level] }}>
                                            {riskEmojis[finding.risk_level]} {finding.risk_level}
                                        </span>
                                        <span className="tool-name">{finding.tool_name}</span>
                                    </div>
                                    <h4 className="finding-issue">{finding.issue}</h4>
                                    <p className="finding-description">{finding.description}</p>
                                    <div className="finding-details">
                                        <code>{finding.details}</code>
                                    </div>
                                    <div className="finding-remediation">
                                        <strong>💡 {t('security.remediation')}:</strong>
                                        <span>{finding.remediation}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tools Tab */}
            {activeTab === 'tools' && (
                <div className="tab-content">
                    <p className="text-secondary" style={{ marginBottom: 'var(--spacing-md)' }}>
                        {t('security.tools_description')}
                    </p>
                    <div className="tools-grid">
                        {tools.map((tool) => (
                            <div key={tool.id} className="tool-card">
                                <h4>{tool.name}</h4>
                                <p className="text-secondary">{tool.description}</p>
                                <div className="tool-meta">
                                    <span>🔌 {tool.port_count} {t('security.ports')}</span>
                                    <span>📝 {tool.config_check_count} {t('security.checks')}</span>
                                </div>
                                <div className="tool-actions">
                                    <button
                                        className="btn btn-secondary btn-small"
                                        onClick={() => handleScanTool(tool.id)}
                                        disabled={isLoading}
                                    >
                                        {t('security.scan_tool')}
                                    </button>
                                    <a
                                        href={tool.docs_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-ghost btn-small"
                                    >
                                        📖 {t('security.docs')}
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
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
        .action-bar {
          display: flex;
          gap: var(--spacing-md);
          align-items: center;
        }
        .filter-select {
          padding: var(--spacing-sm) var(--spacing-md);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius-sm);
          background: var(--color-bg-primary);
          color: var(--color-text-primary);
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--spacing-md);
        }
        .summary-card {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-left-width: 4px;
          border-radius: var(--border-radius-md);
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .summary-count {
          font-size: 2rem;
          font-weight: 700;
        }
        .summary-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }
        .findings-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        .finding-card {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-left-width: 4px;
          border-radius: var(--border-radius-md);
          padding: var(--spacing-md);
        }
        .finding-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-sm);
        }
        .risk-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          color: white;
          font-weight: 600;
        }
        .tool-name {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }
        .finding-issue {
          margin: 0 0 var(--spacing-xs) 0;
          color: var(--color-text-primary);
        }
        .finding-description {
          margin: 0 0 var(--spacing-sm) 0;
          color: var(--color-text-secondary);
          font-size: var(--font-size-sm);
        }
        .finding-details {
          background: var(--color-bg-tertiary);
          padding: var(--spacing-sm);
          border-radius: var(--border-radius-sm);
          margin-bottom: var(--spacing-sm);
        }
        .finding-details code {
          font-size: 12px;
          color: var(--color-text-secondary);
          word-break: break-all;
        }
        .finding-remediation {
          display: flex;
          gap: var(--spacing-sm);
          font-size: var(--font-size-sm);
          color: var(--color-success);
        }
        .tools-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--spacing-md);
        }
        .tool-card {
          background: var(--color-bg-secondary);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius-md);
          padding: var(--spacing-md);
        }
        .tool-card h4 {
          margin: 0 0 var(--spacing-xs) 0;
        }
        .tool-card p {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: var(--font-size-sm);
        }
        .tool-meta {
          display: flex;
          gap: var(--spacing-md);
          font-size: var(--font-size-sm);
          color: var(--color-text-tertiary);
          margin-bottom: var(--spacing-sm);
        }
        .tool-actions {
          display: flex;
          gap: var(--spacing-sm);
        }
        .btn-small {
          padding: 4px 8px;
          font-size: 12px;
        }
        .btn-secondary {
          background: var(--color-bg-tertiary);
          color: var(--color-text-primary);
          border: 1px solid var(--color-border);
        }
        .btn-ghost {
          background: transparent;
          color: var(--color-text-secondary);
          text-decoration: none;
        }
        .btn-ghost:hover {
          color: var(--color-primary);
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
