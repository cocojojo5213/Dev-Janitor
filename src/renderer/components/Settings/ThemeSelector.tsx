/**
 * ThemeSelector Component
 *
 * Provides theme mode selection UI:
 * - System (follow OS)
 * - Light
 * - Dark
 */

import React from 'react'
import { Select, Space, Typography, Card } from 'antd'
import { BgColorsOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import type { ThemeMode } from '@shared/types'

const { Text, Title } = Typography

const themeOptions: Array<{ value: ThemeMode; labelKey: string }> = [
  { value: 'system', labelKey: 'settings.themes.system' },
  { value: 'light', labelKey: 'settings.themes.light' },
  { value: 'dark', labelKey: 'settings.themes.dark' },
]

/**
 * ThemeCard - Card-style theme selector for settings page
 */
export const ThemeCard: React.FC = () => {
  const { t } = useTranslation()
  const { themeMode, setThemeMode } = useAppStore()

  const options = themeOptions.map(({ value, labelKey }) => ({
    value,
    label: t(labelKey),
  }))

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between">
        <Space direction="vertical" size="small">
          <Space align="center">
            <BgColorsOutlined className="text-purple-500 text-lg" />
            <Title level={5} className="!m-0">
              {t('settings.theme')}
            </Title>
          </Space>
          <Text type="secondary">{t('settings.themeDescription')}</Text>
        </Space>
        <Select
          value={themeMode}
          onChange={(value: ThemeMode) => setThemeMode(value)}
          options={options}
          size="large"
          style={{ width: 160 }}
        />
      </div>
    </Card>
  )
}

export default ThemeCard
