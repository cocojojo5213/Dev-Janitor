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
        message.success('更新命令已复制到剪贴板')
      })
      .catch(() => {
        message.error('复制失败')
      })
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
      message.info('目前仅支持 npm 和 pip 包版本检查')
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
          [packageName]: { latest: '未知', checking: false, checked: true }
        }))
      }
    } catch (error) {
      setVersionCache(prev => ({
        ...prev,
        [packageName]: { latest: '检查失败', checking: false, checked: true }
      }))
    }
  }

  // Check all packages versions
  const checkAllVersions = async () => {
    if (manager !== 'npm' && manager !== 'pip') {
      message.info('目前仅支持 npm 和 pip 包版本检查')
      return
    }

    setCheckingAll(true)
    
    for (const pkg of packages) {
      await checkVersion(pkg.name)
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    setCheckingAll(false)
    message.success('版本检查完成')
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
          {info?.checking ? '检查中...' : '检查更新'}
        </Button>
      )
    }

    const comparison = compareVersions(record.version, info.latest)
    
    if (comparison >= 0) {
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          最新
        </Tag>
      )
    } else {
      return (
        <Space>
          <Tooltip title={`最新版本: ${info.latest}，点击复制更新命令`}>
            <Tag 
              icon={<ArrowUpOutlined />} 
              color="warning"
              style={{ cursor: 'pointer' }}
              onClick={() => handleCopyUpdateCommand(record.name)}
            >
              可更新 → {info.latest}
            </Tag>
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
          <Tooltip title="在浏览器中查看">
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
      title: '版本状态',
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
            {checkingAll ? '检查中...' : '检查所有包的更新'}
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
