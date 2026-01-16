/**
 * AI Configuration Section Component
 * 
 * Allows users to configure AI assistant settings:
 * - Enable/disable AI features
 * - Configure API provider (OpenAI, Anthropic)
 * - Set API key
 * - Select model
 */

import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Select, Switch, Button, Alert, Space, Typography, Divider } from 'antd'
import { RobotOutlined, KeyOutlined, SaveOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { AIConfig } from '../../../shared/types'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { Password } = Input

export const AIConfigSection: React.FC = () => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load saved config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('aiConfig')
    if (savedConfig) {
      try {
        const config: AIConfig = JSON.parse(savedConfig)
        form.setFieldsValue(config)
      } catch (error) {
        console.error('Failed to load AI config:', error)
      }
    }
  }, [form])

  const handleSave = async () => {
    try {
      setSaving(true)
      const values = await form.validateFields()
      
      const config: AIConfig = {
        provider: values.provider || 'openai',
        apiKey: values.apiKey,
        model: values.model,
        enabled: values.enabled || false
      }

      // Save to localStorage
      localStorage.setItem('aiConfig', JSON.stringify(config))

      // Update AI assistant config via IPC
      await window.electronAPI.ai.updateConfig(config)

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Failed to save AI config:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    form.resetFields()
    localStorage.removeItem('aiConfig')
    setSaved(false)
  }

  return (
    <Card
      title={
        <Space>
          <RobotOutlined />
          <span>{t('settings.aiConfig', 'AI 助手配置')}</span>
        </Space>
      }
      extra={
        <Space>
          <Button onClick={handleReset}>
            {t('common.reset', '重置')}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
          >
            {t('common.save', '保存')}
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Info Alert */}
        <Alert
          message={t('settings.aiConfigInfo', 'AI 功能说明')}
          description={
            <div>
              <Paragraph>
                {t('settings.aiConfigDesc1', '本地分析功能永久免费，无需配置 API Key。')}
              </Paragraph>
              <Paragraph>
                {t('settings.aiConfigDesc2', '配置 API Key 后可启用 AI 深度分析功能，获得更智能的建议。')}
              </Paragraph>
            </div>
          }
          type="info"
          showIcon
        />

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            enabled: false,
            provider: 'openai',
            model: 'gpt-3.5-turbo'
          }}
        >
          {/* Enable AI */}
          <Form.Item
            name="enabled"
            label={t('settings.enableAI', '启用 AI 增强功能')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider />

          {/* Provider */}
          <Form.Item
            name="provider"
            label={t('settings.aiProvider', 'AI 提供商')}
            tooltip={t('settings.aiProviderTooltip', '选择 AI 服务提供商')}
          >
            <Select>
              <Option value="openai">OpenAI</Option>
              <Option value="anthropic" disabled>Anthropic (即将支持)</Option>
              <Option value="local" disabled>本地模型 (即将支持)</Option>
            </Select>
          </Form.Item>

          {/* API Key */}
          <Form.Item
            name="apiKey"
            label={
              <Space>
                <KeyOutlined />
                <span>{t('settings.apiKey', 'API Key')}</span>
              </Space>
            }
            tooltip={t('settings.apiKeyTooltip', '从 OpenAI 官网获取 API Key')}
            rules={[
              {
                validator: (_, value) => {
                  const enabled = form.getFieldValue('enabled')
                  if (enabled && !value) {
                    return Promise.reject(new Error(t('settings.apiKeyRequired', '启用 AI 功能需要配置 API Key')))
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <Password
              placeholder="sk-..."
              prefix={<KeyOutlined />}
            />
          </Form.Item>

          {/* Model */}
          <Form.Item
            name="model"
            label={t('settings.aiModel', 'AI 模型')}
            tooltip={t('settings.aiModelTooltip', '选择使用的 AI 模型')}
          >
            <Select>
              <Option value="gpt-3.5-turbo">GPT-3.5 Turbo (推荐)</Option>
              <Option value="gpt-4">GPT-4 (更智能，更贵)</Option>
              <Option value="gpt-4-turbo-preview">GPT-4 Turbo</Option>
            </Select>
          </Form.Item>
        </Form>

        {/* Success Message */}
        {saved && (
          <Alert
            message={t('settings.aiConfigSaved', '配置已保存')}
            description={t('settings.aiConfigSavedDesc', 'AI 助手配置已更新，现在可以使用 AI 增强功能了。')}
            type="success"
            showIcon
            closable
          />
        )}

        {/* Help Links */}
        <Card size="small" type="inner">
          <Space direction="vertical">
            <Text strong>{t('settings.helpLinks', '帮助链接')}</Text>
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
              {t('settings.getOpenAIKey', '获取 OpenAI API Key')}
            </a>
            <a href="https://platform.openai.com/docs/models" target="_blank" rel="noopener noreferrer">
              {t('settings.viewModels', '查看可用模型')}
            </a>
          </Space>
        </Card>
      </Space>
    </Card>
  )
}
