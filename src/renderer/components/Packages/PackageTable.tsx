/**
 * PackageTable Component
 * 
 * Table component for displaying packages from a package manager:
 * - Package name and version
 * - Latest version check
 * - Location
 * - Copy and link actions only (safe operations)
 */

import React, { useState, useMemo, useCallback, useRef } from 'react'
import { Table, Button, Typography, Tooltip, message, Tag, Space, Progress } from 'antd'
import {
  LinkOutlined,
  CopyOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  LoadingOutlined,
  SyncOutlined,
  DownloadOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import type { PackageInfo } from '@shared/types'
import type { ColumnsType } from 'antd/es/table'

const { Text, Paragraph } = Typography

export interface PackageTableProps {
  packages: PackageInfo[]
  loading: boolean
  onUninstall: (packageName: string) => void
  onRefresh: () => void
  manager: 'npm' | 'pip' | 'composer'
}

/**
 * Get external link URL for package based on manager
 */
const getPackageUrl = (packageName: string, manager: 'npm' | 'pip' | 'composer'): string => {
  switch (manager) {
    case 'npm':
      return `https://www.npmjs.com/package/${packageName}`
    case 'pip':
      return `https://pypi.org/project/${packageName}`
    case 'composer':
      return `https://packagist.org/packages/${packageName}`
    default:
      return ''
  }
}

/**
 * Compare two semver versions
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1.replace(/^[^\d]*/, '').split('.').map(n => parseInt(n) || 0)
  const parts2 = v2.replace(/^[^\d]*/, '').split('.').map(n => parseInt(n) || 0)
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0
    const p2 = parts2[i] || 0
    if (p1 < p2) return -1
    if (p1 > p2) return 1
  }
  return 0
}

const PackageTable: React.FC<PackageTableProps> = ({
  packages,
  loading,
  onRefresh,
  manager,
}) => {
  const { t } = useTranslation()
  const { packageVersionCache, updatePackageVersionInfo } = useAppStore()
  const [checkingAll, setCheckingAll] = useState(false)

  // Progress state for version check - Validates: Requirements 8.1, 8.2, 8.4
  const [checkProgress, setCheckProgress] = useState<{
    total: number;
    completed: number;
    cancelled: boolean;
  } | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Memoize version comparison results to avoid recalculation on every render
  // Validates: Requirement 7.1
  const memoizedVersionComparison = useMemo(() => {
    return packages.reduce<Record<string, number>>((acc, pkg) => {
      const cached = packageVersionCache[pkg.name];
      if (cached?.checked && cached.latest) {
        acc[pkg.name] = compareVersions(pkg.version, cached.latest);
      }
      return acc;
    }, {});
  }, [packages, packageVersionCache]);

  // Validates: Requirement 7.2
  const handleCopyLocation = useCallback((location: string) => {
    navigator.clipboard.writeText(location)
      .then(() => {
        message.success(t('notifications.copySuccess'))
      })
      .catch(() => {
        message.error(t('notifications.copyFailed'))
      })
  }, [t])

  // Validates: Requirement 7.2
  const handleCopyUpdateCommand = useCallback((packageName: string) => {
    let command = ''
    switch (manager) {
      case 'npm':
        command = `npm update -g ${packageName}`
        break
      case 'pip':
        command = `pip install --upgrade ${packageName}`
        break
      case 'composer':
        command = `composer global update ${packageName}`
        break
    }
    navigator.clipboard.writeText(command)
      .then(() => {
        message.success(t('notifications.copySuccess', 'Copied to clipboard'))
      })
      .catch(() => {
        message.error(t('notifications.copyFailed', 'Copy failed'))
      })
  }, [manager, t])

  // Validates: Requirement 7.2
  // Update a single package
  const checkVersion = useCallback(async (packageName: string) => {
    if (manager !== 'npm' && manager !== 'pip') return;
    
    // 标记为“检查中”
    updatePackageVersionInfo(packageName, { latest: '', checking: true, checked: false })
    
    try {
      const result = manager === 'npm' 
        ? await window.electronAPI.packages.checkNpmLatestVersion(packageName) 
        : await window.electronAPI.packages.checkPipLatestVersion(packageName);
      
      updatePackageVersionInfo(packageName, { 
        latest: result?.latest || t('common.unknown'), 
        checking: false, 
        checked: true 
      })
    } catch {
      updatePackageVersionInfo(packageName, { latest: 'error', checking: false, checked: true })
    }
  }, [manager, t, updatePackageVersionInfo])


  const handleUpdatePackage = useCallback(async (packageName: string) => {
    if (manager !== 'npm' && manager !== 'pip') return;
    
    updatePackageVersionInfo(packageName, { updating: true })
    try {
      const result = await window.electronAPI.packages.update(packageName, manager)
      if (result.success) {
        message.success(t('packages.updateSuccess'))
        onRefresh()
        await checkVersion(packageName) // 刷新最新版本状态
      } else {
        message.error(result.error || t('packages.updateFailed'))
      }
    } catch {
      message.error(t('packages.updateFailed'))
    } finally {
      updatePackageVersionInfo(packageName, { updating: false })
    }
  }, [manager, t, onRefresh, checkVersion, updatePackageVersionInfo])

  /**
   * 异步并行全量检查
   */
  const checkAllVersions = useCallback(async () => {
    if (manager !== 'npm' && manager !== 'pip') return;
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setCheckingAll(true);
    setCheckProgress({ total: packages.length, completed: 0, cancelled: false });

    const CONCURRENCY_LIMIT = 5; // 设置并发数为 5
    const queue = [...packages];
    let completedCount = 0;

    // 工作单元：不断从队列中取出任务执行
    const worker = async () => {
      while (queue.length > 0 && !signal.aborted) {
        const pkg = queue.shift();
        if (!pkg) break;
        try {
          await checkVersion(pkg.name);
        } finally {
          completedCount++;
          setCheckProgress(prev => prev ? { ...prev, completed: completedCount } : null);
        }
      }
    };

    // 启动多个 Worker 并行工作
    const workers = Array(Math.min(CONCURRENCY_LIMIT, packages.length))
      .fill(null)
      .map(() => worker());

    try {
      await Promise.all(workers);
    } catch (err) {
      console.error("Parallel check failed", err);
    } finally {
      setCheckingAll(false);
      if (signal.aborted) {
        setCheckProgress(prev => prev ? { ...prev, cancelled: true } : null);
      }
      // 任务结束后 1 秒自动隐藏进度条
      setTimeout(() => setCheckProgress(null), 1000);
      abortControllerRef.current = null;
    }
  }, [manager, packages, checkVersion]);

  const columns: ColumnsType<PackageInfo> = [
    {
      title: t('packages.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name) => (
        <Space>
          <Text strong className="font-mono">{name}</Text>
          <Button type="text" size="small" icon={<LinkOutlined />} onClick={() => window.open(getPackageUrl(name, manager), '_blank')} />
        </Space>
      ),
    },
    {
      title: t('packages.version'),
      key: 'version',
      width: 250,
      render: (_, record) => {
        const info = packageVersionCache[record.name];
        const comparison = memoizedVersionComparison[record.name];
        const hasUpdate = comparison !== undefined && comparison < 0;
        const isLatest = comparison !== undefined && comparison >= 0;

        return (
          <Space size="small" wrap>
            <Tag color="blue" className="font-mono m-0">{record.version}</Tag>
            {/* 如果有更新，显示箭头及最新版本号 Tag */}
            {hasUpdate && info ? (
              <>
                <ArrowRightOutlined style={{ fontSize: 10, color: "#bfbfbf" }} />
                <Tooltip title={t('packages.clickToCopyCommand')}>
                  <Tag 
                    color="orange" 
                    className="font-mono m-0 cursor-pointer" 
                    icon={<ArrowUpOutlined />} 
                    onClick={() => handleCopyUpdateCommand(record.name)}
                  >
                    {info.latest}
                  </Tag>
                </Tooltip>
              </>
            ) : isLatest ? (
              /* 已是最新状态，显示绿色 Tag */
              <Tag color="success" className="m-0">{t('packages.latest')}</Tag>
            ) : null}
          </Space>
        );
      },
    },
    {
      title: t('packages.location'),
      dataIndex: 'location',
      key: 'location',
      ellipsis: true,
      render: (location) => (
        <div className="flex items-center gap-2">
          <Tooltip title={location}>
            <Paragraph className="font-mono text-xs m-0 flex-1" ellipsis={{ rows: 1 }}>{location}</Paragraph>
          </Tooltip>
          <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleCopyLocation(location)} />
        </div>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 130,
      align: 'right',
      render: (_, record) => {
        const info = packageVersionCache[record.name];
        if (manager !== 'npm' && manager !== 'pip') return null;

        const comparison = memoizedVersionComparison[record.name] ?? 0;

        // 已经检查过且发现新版本 -> 显示“更新”按钮
        if (info?.checked && comparison < 0) {
          return (
            <Button
              type="primary" size="small" ghost
              icon={info.updating ? <LoadingOutlined /> : <DownloadOutlined />}
              onClick={() => handleUpdatePackage(record.name)}
              disabled={info.updating}
            >
              {info.updating ? t('packages.updating') : t('packages.update')}
            </Button>
          );
        }

        // 默认显示“检查更新”按钮。如果是“检查中”，则切换为 Loading。
        return (
          <Button
            type="link" size="small"
            icon={info?.checking ? <LoadingOutlined /> : <SyncOutlined />}
            onClick={() => checkVersion(record.name)}
            disabled={info?.checking}
          >
            {info?.checking ? "" : t('packages.checkUpdate')}
          </Button>
        );
      },
    },
  ]

  return (
    <div className="package-table">
      {/* 顶部操作区：全量检查及进度展示 */}
      {(manager === 'npm' || manager === 'pip') && (
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button 
              icon={checkingAll ? <LoadingOutlined /> : <SyncOutlined />} 
              onClick={checkAllVersions} 
              disabled={checkingAll || packages.length === 0}
            >
              {checkingAll ? t('packages.checking') : t('packages.checkAllUpdates')}
            </Button>
            {checkingAll && (
              <Button icon={<StopOutlined />} onClick={() => abortControllerRef.current?.abort()} danger>
                {t('common.cancel')}
              </Button>
            )}
          </Space>
          {checkProgress && (
            <div style={{ marginTop: 8 }}>
              <Progress 
                percent={Math.round((checkProgress.completed / checkProgress.total) * 100)} 
                size="small" 
                status={checkProgress.cancelled ? 'exception' : 'active'} 
                format={() => `${checkProgress.completed}/${checkProgress.total}`} 
              />
            </div>
          )}
        </div>
      )}

      <Table 
        columns={columns} 
        dataSource={packages} 
        loading={loading} 
        rowKey="name" 
        size="middle" 
        pagination={{ pageSize: 20, showSizeChanger: true }} 
      />
    </div>
  )
}

export default PackageTable
