/**
 * PackagesView Component
 * 
 * Main view for displaying packages from different package managers:
 * - Tabs for npm, pip, composer
 * - Package table with search
 * - Uninstall functionality
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 6.4
 * Property 5: Package Information Completeness
 * Property 6: Package List Parsing
 */

import React, { useState, useEffect, useMemo } from 'react'
import { Typography, Tabs, Input, Alert, Empty, Badge, message, Button } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import PackageTable from './PackageTable'
import type { PackageInfo } from '@shared/types'

const { Title, Text } = Typography

type PackageManager = 'npm' | 'pip' | 'composer'

const PackagesView: React.FC = () => {
  const { t } = useTranslation()
  const {
    npmPackages,
    pipPackages,
    composerPackages,
    packagesLoading,
    packagesError,
    loadPackages,
    uninstallPackage,
    tools,
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<PackageManager>('npm')
  const [searchText, setSearchText] = useState('')

  // Load packages on mount
  useEffect(() => {
    if (npmPackages.length === 0 && pipPackages.length === 0 && composerPackages.length === 0 && !packagesLoading) {
      loadPackages('all')
    }
  }, [npmPackages.length, pipPackages.length, composerPackages.length, packagesLoading, loadPackages])

  // Check if package managers are installed
  const isNpmInstalled = useMemo(() => {
    return tools.some(tool => tool.name.toLowerCase() === 'npm' && tool.isInstalled)
  }, [tools])

  const isPipInstalled = useMemo(() => {
    return tools.some(tool => tool.name.toLowerCase() === 'pip' && tool.isInstalled)
  }, [tools])

  const isComposerInstalled = useMemo(() => {
    return tools.some(tool => tool.name.toLowerCase() === 'composer' && tool.isInstalled)
  }, [tools])

  // Get packages for current tab
  const getCurrentPackages = (): PackageInfo[] => {
    switch (activeTab) {
      case 'npm':
        return npmPackages
      case 'pip':
        return pipPackages
      case 'composer':
        return composerPackages
      default:
        return []
    }
  }

  // Filter packages by search text
  const filteredPackages = useMemo(() => {
    const packages = getCurrentPackages()
    if (!searchText.trim()) {
      return packages
    }
    const lowerSearch = searchText.toLowerCase()
    return packages.filter(pkg =>
      pkg.name.toLowerCase().includes(lowerSearch) ||
      pkg.version.toLowerCase().includes(lowerSearch)
    )
  }, [activeTab, npmPackages, pipPackages, composerPackages, searchText])

  // Handle uninstall
  const handleUninstall = async (packageName: string) => {
    const success = await uninstallPackage(packageName, activeTab)
    if (success) {
      message.success(t('packages.uninstallSuccess'))
    } else {
      message.error(t('packages.uninstallFailed'))
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    loadPackages(activeTab)
  }

  // Check if current manager is installed
  const isCurrentManagerInstalled = (): boolean => {
    switch (activeTab) {
      case 'npm':
        return isNpmInstalled
      case 'pip':
        return isPipInstalled
      case 'composer':
        return isComposerInstalled
      default:
        return false
    }
  }

  // Tab items with package counts
  const tabItems = [
    {
      key: 'npm',
      label: (
        <Badge count={npmPackages.length} size="small" offset={[10, 0]}>
          <span>{t('packages.npm')}</span>
        </Badge>
      ),
      children: null,
    },
    {
      key: 'pip',
      label: (
        <Badge count={pipPackages.length} size="small" offset={[10, 0]}>
          <span>{t('packages.pip')}</span>
        </Badge>
      ),
      children: null,
    },
    {
      key: 'composer',
      label: (
        <Badge count={composerPackages.length} size="small" offset={[10, 0]}>
          <span>{t('packages.composer')}</span>
        </Badge>
      ),
      children: null,
    },
  ]

  // Render content based on manager installation status
  const renderContent = () => {
    // 优先显示加载状态，防止工具检测未完成导致的误判
    if (packagesLoading) {
      return (
        <PackageTable
          packages={filteredPackages}
          loading={true}
          onUninstall={handleUninstall}
          onRefresh={handleRefresh}
          manager={activeTab}
        />
      )
    }

    // 错误处理
    if (packagesError) {
      return (
        <Alert
          message={t('errors.loadFailed')}
          description={packagesError}
          type="error"
          showIcon
          action={
            <Button type="link" size="small" onClick={handleRefresh}>
              {t('common.retry')}
            </Button>
          }
        />
      )
    }

    // 只有在加载完成且明确未安装时显示 Empty
    // 增加 tools.length > 0 判断以确保环境数据已同步
    if (tools.length > 0 && !isCurrentManagerInstalled()) {
      const managerName = activeTab.toUpperCase()
      return (
        <Empty
          description={
            <div>
              <Text>{t('packages.managerNotInstalled', { manager: managerName })}</Text>
            </div>
          }
        />
      )
    }

    // Package table
    return (
      <PackageTable
        packages={filteredPackages}
        loading={false}
        onUninstall={handleUninstall}
        onRefresh={handleRefresh}
        manager={activeTab}
      />
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Title level={3} className="!mb-1">{t('packages.title')}</Title>
        <Text type="secondary">{t('packages.subtitle')}</Text>
      </div>

      {/* Tabs for package managers - Validates: Requirement 3.3, 4.3 */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key as PackageManager)
          setSearchText('')
        }}
        items={tabItems}
        tabBarExtraContent={
          <Input
            placeholder={t('common.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 250 }}
          />
        }
      />

      {/* Content */}
      <div className="mt-4">
        {renderContent()}
      </div>
    </div>
  )
}

export default PackagesView
