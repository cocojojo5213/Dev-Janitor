/**
 * ToolDetailModal Component
 * 
 * Modal dialog displaying detailed information about a tool:
 * - Full tool information (name, version, path, status)
 * - Installation method
 * - Category
 * - Copy path button only (safe operation)
 * - Uninstall button (with warning for destructive operation)
 */

import React, { useState, useEffect } from 'react'
import { Modal, Descriptions, Tag, Button, Space, Typography, Alert, message } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  DeleteOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { ToolInfo } from '@shared/types'

const { Text, Paragraph } = Typography
const { confirm } = Modal

export interface ToolDetailModalProps {
  tool: ToolInfo | null
  open: boolean
  onClose: () => void
  onRefresh?: () => void
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

const ToolDetailModal: React.FC<ToolDetailModalProps> = ({
  tool,
  open,
  onClose,
  onRefresh,
}) => {
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

  if (!tool) {
    return null
  }

  const handleUninstall = () => {
    if (!uninstallInfo?.canUninstall) {
      message.info(uninstallInfo?.manualInstructions || t('tools.uninstallManual'))
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
            onClose()
            onRefresh?.()
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

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getToolIcon(tool.name)}</span>
          <span>{tool.displayName || tool.name}</span>
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
      }
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>{t('common.close')}</Button>
          {onRefresh && (
            <Button icon={<SyncOutlined />} onClick={onRefresh}>
              {t('common.refresh')}
            </Button>
          )}
          {tool.isInstalled && (
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={handleUninstall}
              loading={uninstalling}
            >
              {t('tools.uninstall')}
            </Button>
          )}
        </Space>
      }
      width={600}
    >
      {/* Tool Information */}
      <Descriptions
        bordered
        column={1}
        size="small"
        className="mb-4"
      >
        {/* Name */}
        <Descriptions.Item label={<Text strong>{t('tools.name')}</Text>}>
          <Text>{tool.displayName || tool.name}</Text>
        </Descriptions.Item>

        {/* Version */}
        <Descriptions.Item label={<Text strong>{t('tools.version')}</Text>}>
          <Text className="font-mono">
            {tool.version || t('common.unknown')}
          </Text>
        </Descriptions.Item>

        {/* Path */}
        <Descriptions.Item label={<Text strong>{t('tools.path')}</Text>}>
          <div className="flex items-center justify-between">
            <Paragraph
              className="font-mono text-sm m-0 flex-1"
              ellipsis={{ rows: 2, expandable: true }}
              copyable={tool.path ? { text: tool.path } : false}
            >
              {tool.path || t('common.unknown')}
            </Paragraph>
          </div>
        </Descriptions.Item>

        {/* Category */}
        <Descriptions.Item label={<Text strong>{t('tools.category')}</Text>}>
          <Tag color={getCategoryColor(tool.category)}>
            {t(`tools.categories.${tool.category === 'package-manager' ? 'packageManager' : tool.category}`)}
          </Tag>
        </Descriptions.Item>

        {/* Install Method */}
        {tool.installMethod && (
          <Descriptions.Item label={<Text strong>{t('tools.installMethod')}</Text>}>
            <Tag>{t(`tools.installMethods.${tool.installMethod}`)}</Tag>
          </Descriptions.Item>
        )}

        {/* Status */}
        <Descriptions.Item label={<Text strong>{t('tools.status')}</Text>}>
          {tool.isInstalled ? (
            <Tag icon={<CheckCircleOutlined />} color="success">
              {t('tools.installed')}
            </Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="error">
              {t('tools.notInstalled')}
            </Tag>
          )}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  )
}

export default ToolDetailModal
