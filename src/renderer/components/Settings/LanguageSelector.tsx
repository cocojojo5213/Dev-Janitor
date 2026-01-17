/**
 * LanguageSelector Component
 * 
 * Provides language selection UI for switching between supported languages.
 * 
 * Validates: Requirements 13.3, 13.4, 13.5
 * - 13.3: Provide language switcher in settings
 * - 13.4: Update all UI text immediately when language changes
 * - 13.5: Remember user's language preference
 */

import React from 'react'
import { Select, Space, Typography, Card } from 'antd'
import { GlobalOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n'

const { Text, Title } = Typography

// ============================================================================
// Types
// ============================================================================

interface LanguageSelectorProps {
  showLabel?: boolean
  showDescription?: boolean
  size?: 'small' | 'middle' | 'large'
  className?: string
}

// ============================================================================
// Language Options
// ============================================================================

const languageOptions = SUPPORTED_LANGUAGES.map(lang => ({
  value: lang,
  label: (
    <Space align="center">
      <span>{getLanguageFlag(lang)}</span>
      <span>{LANGUAGE_NAMES[lang]}</span>
    </Space>
  ),
}))

/**
 * Get flag emoji for language
 */
function getLanguageFlag(lang: SupportedLanguage): string {
  switch (lang) {
    case 'en-US':
      return '🇺🇸'
    case 'zh-CN':
      return '🇨🇳'
    default:
      return '🌐'
  }
}

// ============================================================================
// LanguageSelector Component
// ============================================================================

/**
 * LanguageSelector Component
 * 
 * Renders a dropdown for selecting the application language.
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  showLabel = true,
  showDescription = true,
  size = 'middle',
  className = '',
}) => {
  const { t } = useTranslation()
  const { language, setLanguage } = useAppStore()

  const handleLanguageChange = (value: SupportedLanguage) => {
    setLanguage(value)
  }

  return (
    <div className={className}>
      {showLabel && (
        <Space direction="vertical" size="small" className="mb-2">
          <Space align="center">
            <GlobalOutlined className="text-blue-500" />
            <Title level={5} className="!m-0">
              {t('settings.language')}
            </Title>
          </Space>
          {showDescription && (
            <Text type="secondary">{t('settings.languageDescription')}</Text>
          )}
        </Space>
      )}
      <Select
        value={language}
        onChange={handleLanguageChange}
        options={languageOptions}
        size={size}
        style={{ width: showLabel ? 200 : 120 }}
        className="language-selector"
      />
    </div>
  )
}

// ============================================================================
// Compact Language Selector
// ============================================================================

/**
 * CompactLanguageSelector - Minimal language selector for header
 */
export const CompactLanguageSelector: React.FC = () => {
  const { language, setLanguage } = useAppStore()

  return (
    <Select
      value={language}
      onChange={setLanguage}
      options={languageOptions}
      size="small"
      bordered={false}
      style={{ width: 100 }}
      dropdownStyle={{ minWidth: 120 }}
    />
  )
}

// ============================================================================
// Language Card
// ============================================================================

/**
 * LanguageCard - Card-style language selector for settings page
 */
export const LanguageCard: React.FC = () => {
  const { t } = useTranslation()
  const { language, setLanguage } = useAppStore()

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between">
        <Space direction="vertical" size="small">
          <Space align="center">
            <GlobalOutlined className="text-blue-500 text-lg" />
            <Title level={5} className="!m-0">
              {t('settings.language')}
            </Title>
          </Space>
          <Text type="secondary">{t('settings.languageDescription')}</Text>
        </Space>
        <Select
          value={language}
          onChange={setLanguage}
          options={languageOptions}
          size="large"
          style={{ width: 160 }}
        />
      </div>
    </Card>
  )
}

export default LanguageSelector
