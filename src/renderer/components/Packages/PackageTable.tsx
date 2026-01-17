/**
 * PackageTable Component
 * 
 * Table component for displaying packages from a package manager:
 * - Package name and version
 * - Latest version check
 * - Location
 * - Copy and link actions only (safe operations)
 */

import React, { useState, useEffect } from 'react'
import { Table, Button, Typography, Tooltip, message, Tag, Space } from 'antd'
import {
  LinkOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  LoadingOutlined,
  SyncOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
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

interface VersionInfo {
  latest: string
  checking: boolean
  checked: boolean
  updating?: boolean
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
  const [versionCache, setVersionCache] = useState<Record<string, VersionInfo>>({})
  const [checkingAll, setCheckingAll] = useState(false)

  // Reset cache when packages change
  useEffect(() => {
    setVersionCache({})
  }, [packages])

  const handleCopyLocation = (location: string) => {
    navigator.clipboard.writeText(location)
      .then(() => {
        message.success(t('notifications.copySuccess'))
      })
      .catch(() => {
        message.error(t('notifications.copyFailed'))
      })
  }

  const handleCopyUpdateCommand = (packageName: string) => {
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
  }

  // Update a single package
  const handleUpdatePackage = async (packageName: string) => {
    if (manager !== 'npm' && manager !== 'pip') {
      message.info(t('packages.updateNotSupported', 'Update only supports npm and pip'))
      return
    }

    setVersionCache(prev => ({
      ...prev,
      [packageName]: { ...prev[packageName], updating: true }
    }))

    try {
      const result = await window.electronAPI.packages.update(packageName, manager)
      
      if (result.success) {
        message.success(t('packages.updateSuccess', 'Package updated successfully'))
        // Update the version cache to show as latest
        setVersionCache(prev => ({
          ...prev,
          [packageName]: { 
            latest: result.newVersion || prev[packageName]?.latest || '', 
            checking: false, 
            checked: true,
            updating: false 
          }
        }))
        // Trigger a refresh to update the package list
        onRefresh()
      } else {
        message.error(result.error || t('packages.updateFailed', 'Failed to update package'))
        setVersionCache(prev => ({
          ...prev,
          [packageName]: { ...prev[packageName], updating: false }
        }))
      }
    } catch (error) {
      message.error(t('packages.updateFailed', 'Failed to update package'))
      setVersionCache(prev => ({
        ...prev,
        [packageName]: { ...prev[packageName], updating: false }
      }))
    }
  }

  const handleOpenExternal = (packageName: string) => {
    const url = getPackageUrl(packageName, manager)
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  // Check single package version
  const checkVersion = async (packageName: string) => {
    if (manager !== 'npm' && manager !== 'pip') {
      message.info(t('packages.versionCheckNotSupported', 'Version check only supports npm and pip'))
      return
    }

    setVersionCache(prev => ({
      ...prev,
      [packageName]: { latest: '', checking: true, checked: false }
    }))

    try {
      let result = null
      if (manager === 'npm') {
        result = await window.electronAPI.packages.checkNpmLatestVersion(packageName)
      } else if (manager === 'pip') {
        result = await window.electronAPI.packages.checkPipLatestVersion(packageName)
      }
      
      if (result) {
        setVersionCache(prev => ({
          ...prev,
          [packageName]: { latest: result.latest, checking: false, checked: true }
        }))
      } else {
        setVersionCache(prev => ({
          ...prev,
          [packageName]: { latest: t('common.unknown', 'Unknown'), checking: false, checked: true }
        }))
      }
    } catch (error) {
      setVersionCache(prev => ({
        ...prev,
        [packageName]: { latest: t('packages.checkFailed', 'Check failed'), checking: false, checked: true }
      }))
    }
  }

  // Check all packages versions
  const checkAllVersions = async () => {
    if (manager !== 'npm' && manager !== 'pip') {
      message.info(t('packages.versionCheckNotSupported', 'Version check only supports npm and pip'))
      return
    }

    setCheckingAll(true)
    
    for (const pkg of packages) {
      await checkVersion(pkg.name)
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    setCheckingAll(false)
    message.success(t('packages.versionCheckComplete', 'Version check complete'))
  }

  // Render version status
  const renderVersionStatus = (record: PackageInfo) => {
    const info = versionCache[record.name]
    const supportsCheck = manager === 'npm' || manager === 'pip'
    
    if (!supportsCheck) {
      return <Text type="secondary">-</Text>
    }
    
    if (!info || !info.checked) {
      return (
        <Button
          type="link"
          size="small"
          icon={info?.checking ? <LoadingOutlined /> : <SyncOutlined />}
          onClick={() => checkVersion(record.name)}
          disabled={info?.checking}
        >
          {info?.checking ? t('packages.checking', 'Checking...') : t('packages.checkUpdate', 'Check Update')}
        </Button>
      )
    }

    const comparison = compareVersions(record.version, info.latest)
    
    if (comparison >= 0) {
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          {t('packages.latest', 'Latest')}
        </Tag>
      )
    } else {
      const isUpdating = info.updating
      return (
        <Space>
          <Tooltip title={`${t('packages.latestVersion', 'Latest version')}: ${info.latest}`}>
            <Tag 
              icon={<ArrowUpOutlined />} 
              color="warning"
              style={{ cursor: 'pointer' }}
              onClick={() => handleCopyUpdateCommand(record.name)}
            >
              {info.latest}
            </Tag>
          </Tooltip>
          <Tooltip title={t('packages.clickToUpdate', 'Click to update')}>
            <Button
              type="primary"
              size="small"
              icon={isUpdating ? <LoadingOutlined /> : <DownloadOutlined />}
              onClick={() => handleUpdatePackage(record.name)}
              disabled={isUpdating}
            >
              {isUpdating ? t('packages.updating', 'Updating...') : t('packages.update', 'Update')}
            </Button>
          </Tooltip>
        </Space>
      )
    }
  }

  // Table columns
  const columns: ColumnsType<PackageInfo> = [
    {
      title: t('packages.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => (
        <div className="flex items-center gap-2">
          <Text strong className="font-mono">{name}</Text>
          <Tooltip title={t('tooltips.openExternal', 'Open in browser')}>
            <Button
              type="text"
              size="small"
              icon={<LinkOutlined />}
              onClick={() => handleOpenExternal(name)}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: t('packages.version'),
      dataIndex: 'version',
      key: 'version',
      width: 120,
      sorter: (a, b) => a.version.localeCompare(b.version),
      render: (version: string) => (
        <Tag color="blue" className="font-mono">{version}</Tag>
      ),
    },
    {
      title: t('packages.versionStatus', 'Version Status'),
      key: 'versionStatus',
      width: 150,
      render: (_, record) => renderVersionStatus(record),
    },
    {
      title: t('packages.location'),
      dataIndex: 'location',
      key: 'location',
      ellipsis: true,
      render: (location: string) => (
        <div className="flex items-center gap-2">
          <Tooltip title={location}>
            <Paragraph
              className="font-mono text-xs m-0 flex-1"
              ellipsis={{ rows: 1 }}
            >
              {location}
            </Paragraph>
          </Tooltip>
          <Tooltip title={t('common.copy')}>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyLocation(location)}
            />
          </Tooltip>
        </div>
      ),
    },
  ]

  return (
    <div>
      {(manager === 'npm' || manager === 'pip') && packages.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Button
            icon={checkingAll ? <LoadingOutlined /> : <SyncOutlined />}
            onClick={checkAllVersions}
            disabled={checkingAll}
          >
            {checkingAll ? t('packages.checking', 'Checking...') : t('packages.checkAllUpdates', 'Check All Updates')}
          </Button>
        </div>
      )}
      <Table
        columns={columns}
        dataSource={packages}
        loading={loading}
        rowKey="name"
        size="middle"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `${total} ${t('packages.title').toLowerCase()}`,
        }}
        locale={{
          emptyText: t('packages.noPackages'),
        }}
      />
    </div>
  )
}

export default PackageTable
