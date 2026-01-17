/**
 * SettingsView Component
 * 
 * Main settings page with language selection and about information.
 * 
 * Validates: Requirements 5.1, 13.3, 13.4, 13.5
 * - 5.1: Clean and intuitive layout
 * - 13.3: Provide language switcher in settings
 * - 13.4: Update all UI text immediately when language changes
 * - 13.5: Remember user's language preference
 */

import React from 'react'
import { Typography, Tabs, Space, Divider } from 'antd'
import {
  SettingOutlined,
  InfoCircleOutlined,
  RobotOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { LanguageCard } from './LanguageSelector'
import { ThemeCard } from './ThemeSelector'
import { AboutSection } from './AboutSection'
import { AIConfigSection } from './AIConfigSection'

const { Title, Text } = Typography

// ============================================================================
// Types
// ============================================================================

interface SettingsViewProps {
  className?: string
}

// ============================================================================
// General Settings Section
// ============================================================================

const GeneralSettings: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Language Settings */}
      <LanguageCard />

      {/* Theme Settings */}
      <ThemeCard />
    </div>
  )
}

// ============================================================================
// SettingsView Component
// ============================================================================

/**
 * SettingsView Component
 * 
 * Renders the settings page with tabs for different setting categories.
 */
export const SettingsView: React.FC<SettingsViewProps> = ({ className = '' }) => {
  const { t } = useTranslation()

  const tabItems = [
    {
      key: 'general',
      label: (
        <Space align="center">
          <SettingOutlined />
          {t('settings.general')}
        </Space>
      ),
      children: <GeneralSettings />,
    },
    {
      key: 'ai',
      label: (
        <Space align="center">
          <RobotOutlined />
          {t('settings.aiConfig', 'AI 助手')}
        </Space>
      ),
      children: <AIConfigSection />,
    },
    {
      key: 'about',
      label: (
        <Space align="center">
          <InfoCircleOutlined />
          {t('settings.about')}
        </Space>
      ),
      children: <AboutSection />,
    },
  ]

  return (
    <div className={`p-6 ${className}`}>
      {/* Page Header */}
      <div className="mb-6">
        <Space align="center" className="mb-2">
          <SettingOutlined className="text-2xl text-blue-500" />
          <Title level={2} className="!m-0">
            {t('settings.title')}
          </Title>
        </Space>
        <Text type="secondary">{t('settings.subtitle')}</Text>
      </div>

      <Divider className="!mt-0" />

      {/* Settings Tabs */}
      <Tabs
        defaultActiveKey="general"
        items={tabItems}
        tabPosition="left"
        className="settings-tabs"
        tabBarStyle={{ minWidth: 150 }}
      />
    </div>
  )
}

export default SettingsView
