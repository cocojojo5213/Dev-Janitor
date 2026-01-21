/**
 * ToolCard Component
 * 
 * Displays individual tool information in a card format:
 * - Tool name and icon
 * - Version number
 * - Installation path
 * - Status (installed/not installed)
 * - Action menu (view details, update, uninstall)
 * 
 * Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 6.1, 6.2, 6.3, 6.4
 * Property 3: Complete Tool Information Display
 * Property 8: Action Menu Completeness
 */

import React, { useState, useEffect } from 'react'
import { Card, Tag, Button, Dropdown, Typography, Tooltip, message, Modal, Alert } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  MoreOutlined,
  EyeOutlined,
  SyncOutlined,
  CopyOutlined,
  DeleteOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { ToolInfo } from '@shared/types'

const { Text, Paragraph } = Typography
const { confirm } = Modal

export interface ToolCardProps {
  tool: ToolInfo
  onRefresh: () => void
  onViewDetails: () => void
}

/**
 * Get icon for tool based on name
 */
const getToolIcon = (toolName: string): string => {
  const iconMap: Record<string, string> = {
    'node': '🟢',
    'nodejs': '🟢',
    'python': '🐍',
    'php': '🐘',
    'npm': '📦',
    'pip': '📦',
    'composer': '🎼',
    'git': '🔀',
    'svn': '🔀',
    'docker': '🐳',
    'java': '☕',
    'go': '🔵',
    'rust': '🦀',
    'ruby': '💎',
  }
  
  const lowerName = toolName.toLowerCase()
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key)) {
      return icon
    }
  }
  return '🔧'
}

/**
 * Get category color for tag
 */
const getCategoryColor = (category: ToolInfo['category']): string => {
  const colorMap: Record<ToolInfo['category'], string> = {
    'runtime': 'blue',
    'package-manager': 'green',
    'tool': 'orange',
    'other': 'default',
  }
  return colorMap[category] || 'default'
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, onRefresh, onViewDetails }) => {
  const { t } = useTranslation()
  const [uninstallInfo, setUninstallInfo] = useState<{
    canUninstall: boolean
    command?: string
    warning?: string
    manualInstructions?: string
  } | null>(null)
  const [uninstalling, setUninstalling] = useState(false)

  // Fetch uninstall info when tool changes
  useEffect(() => {
    if (tool?.isInstalled) {
      window.electronAPI.tools.getUninstallInfo(tool.name).then(setUninstallInfo)
    } else {
      setUninstallInfo(null)
    }
  }, [tool])

  const handleCopyPath = () => {
    if (tool.path) {
      navigator.clipboard.writeText(tool.path)
        .then(() => {
          message.success(t('notifications.copySuccess'))
        })
        .catch(() => {
          message.error(t('notifications.copyFailed'))
        })
    }
  }

  const handleUninstall = () => {
    if (!uninstallInfo?.canUninstall) {
      // Show modal with manual instructions instead of toast
      Modal.info({
        title: t('tools.uninstallManualTitle', { name: tool.displayName }),
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <Paragraph>
              {uninstallInfo?.manualInstructions || t('tools.uninstallManual')}
            </Paragraph>
            <Alert
              type="info"
              showIcon
              message={t('tools.uninstallManualSteps')}
              description={
                <ol style={{ paddingLeft: 20, marginTop: 8 }}>
                  <li>{t('tools.uninstallStep1')}</li>
                  <li>{t('tools.uninstallStep2')}</li>
                  <li>{t('tools.uninstallStep3', { name: tool.displayName })}</li>
                </ol>
              }
            />
          </div>
        ),
        okText: t('common.ok'),
      })
      return
    }

    confirm({
      title: t('tools.uninstallConfirmTitle', { name: tool.displayName }),
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          {uninstallInfo.warning && (
            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              message={uninstallInfo.warning}
              style={{ marginBottom: 12 }}
            />
          )}
          <Paragraph>
            {t('tools.uninstallConfirmMessage')}
          </Paragraph>
          {uninstallInfo.command && (
            <Paragraph code style={{ fontSize: 12 }}>
              {uninstallInfo.command}
            </Paragraph>
          )}
          <Alert
            type="error"
            showIcon
            message={t('tools.uninstallIrreversible')}
            style={{ marginTop: 12 }}
          />
        </div>
      ),
      okText: t('tools.uninstallConfirm'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: async () => {
        setUninstalling(true)
        try {
          const result = await window.electronAPI.tools.uninstall(tool.name)
          if (result.success) {
            message.success(t('tools.uninstallSuccess', { name: tool.displayName }))
            onRefresh()
          } else {
            message.error(t('tools.uninstallFailed', { error: result.error }))
          }
        } catch (error) {
          message.error(t('tools.uninstallFailed', { error: String(error) }))
        } finally {
          setUninstalling(false)
        }
      },
    })
  }

  // Build action menu items - simplified, only safe operations
  const actionMenuItems = [
    {
      key: 'details',
      icon: <EyeOutlined />,
      label: t('tools.viewDetails'),
      onClick: onViewDetails,
    },
  ]

  // Add copy path if path is available
  if (tool.path) {
    actionMenuItems.push({
      key: 'copyPath',
      icon: <CopyOutlined />,
      label: t('tools.copyPath'),
      onClick: handleCopyPath,
    })
  }

  // Add uninstall option if tool is installed
  if (tool.isInstalled) {
    actionMenuItems.push({
      key: 'uninstall',
      icon: <DeleteOutlined />,
      label: t('tools.uninstall'),
      onClick: handleUninstall,
    })
  }

  return (
    <Card
      className="h-full hover:shadow-md transition-shadow duration-200"
      hoverable
      actions={[
        <Tooltip key="refresh" title={t('common.refresh')}>
          <Button type="text" icon={<SyncOutlined />} onClick={onRefresh} />
        </Tooltip>,
        <Tooltip key="details" title={t('tools.viewDetails')}>
          <Button type="text" icon={<EyeOutlined />} onClick={onViewDetails} />
        </Tooltip>,
        tool.isInstalled ? (
          <Tooltip key="uninstall" title={t('tools.uninstall')}>
            <Button 
              type="text" 
              danger
              icon={<DeleteOutlined />} 
              onClick={handleUninstall}
              loading={uninstalling}
            />
          </Tooltip>
        ) : (
          <Dropdown
            key="more"
            menu={{ items: actionMenuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        ),
      ]}
    >
      <div className="flex flex-col gap-3">
        {/* Header: Icon, Name, Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getToolIcon(tool.name)}</span>
            <div>
              {/* Validates: Requirement 2.2 - Tool Name */}
              <Text strong className="text-base block">
                {tool.displayName || tool.name}
              </Text>
              <Tag color={getCategoryColor(tool.category)} className="mt-1">
                {t(`tools.categories.${tool.category === 'package-manager' ? 'packageManager' : tool.category}`)}
              </Tag>
            </div>
          </div>
          
          {/* Status indicator - Validates: Requirement 2.5, 2.6 */}
          {tool.isInstalled ? (
            <Tag icon={<CheckCircleOutlined />} color="success">
              {t('tools.installed')}
            </Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="error">
              {t('tools.notInstalled')}
            </Tag>
          )}
        </div>

        {/* Version - Validates: Requirement 2.3 */}
        <div className="flex items-center gap-2">
          <Text type="secondary" className="text-sm">
            {t('tools.version')}:
          </Text>
          <Text className="text-sm font-mono">
            {tool.version || t('common.unknown')}
          </Text>
        </div>

        {/* Path - Validates: Requirement 2.4 */}
        <div className="flex flex-col gap-1">
          <Text type="secondary" className="text-sm">
            {t('tools.path')}:
          </Text>
          <Tooltip title={tool.path || t('common.unknown')}>
            <Paragraph
              code
              className="text-xs font-mono m-0"
              ellipsis={{ rows: 1 }}
              copyable={tool.path ? { text: tool.path } : false}
            >
              {tool.path || t('common.unknown')}
            </Paragraph>
          </Tooltip>
        </div>

        {/* Install Method (if available) */}
        {tool.installMethod && (
          <div className="flex items-center gap-2">
            <Text type="secondary" className="text-sm">
              {t('tools.installMethod')}:
            </Text>
            <Tag>
              {t(`tools.installMethods.${tool.installMethod}`)}
            </Tag>
          </div>
        )}
      </div>
    </Card>
  )
}

export default ToolCard
