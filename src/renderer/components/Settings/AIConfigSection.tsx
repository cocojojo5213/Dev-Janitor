/**
 * AI Configuration Section Component
 *
 * Allows users to configure AI assistant settings:
 * - Enable/disable AI features
 * - Configure API provider (OpenAI, Anthropic)
 * - Set API key
 * - Select model
 * 
 * Responsive Design:
 * - Breakpoint at 768px for mobile/tablet layouts
 * - Vertical button stacking on small screens
 * - Full-width form controls on mobile
 */

import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Select, Switch, Button, Alert, Space, Typography, Divider, message, Grid } from 'antd'
import { RobotOutlined, KeyOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { AIConfig } from '../../../shared/types'

const { Text, Paragraph } = Typography
const { Option } = Select
const { Password } = Input
const { useBreakpoint } = Grid

export const AIConfigSection: React.FC = () => {
  // Use Ant Design's responsive breakpoint hook
  const screens = useBreakpoint()
  // Consider small screen if md breakpoint is not reached (< 768px)
  const isSmallScreen = !screens.md
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [fetchingModels, setFetchingModels] = useState(false)
  const [fetchedModels, setFetchedModels] = useState<string[]>([])
  const [provider, setProvider] = useState<string>('openai')
  const [testing, setTesting] = useState(false)

  // Load saved config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('aiConfig')
    if (savedConfig) {
      try {
        const config: AIConfig = JSON.parse(savedConfig)
        form.setFieldsValue(config)
        setProvider(config.provider || 'openai')
      } catch (error) {
        console.error('Failed to load AI config:', error)
      }
    }
  }, [form])

  const handleFetchModels = async () => {
    try {
      setFetchingModels(true)
      const values = await form.validateFields(['provider', 'apiKey', 'baseUrl'].filter(f => f !== 'baseUrl' || provider === 'custom'))

      const config: AIConfig = { ...values, enabled: true }
      
      // 防御性检查：确保 electronAPI.ai 存在
      if (!window.electronAPI?.ai) {
        throw new Error('AI API not available')
      }
      
      await window.electronAPI.ai.updateConfig(config)

      const models = await window.electronAPI.ai.fetchModels()
      if (models?.length > 0) {
        setFetchedModels(models)
        message.success(t('settings.modelsFetched', '成功获取模型列表'))
      } else {
        message.warning(t('settings.noModelsFound', '未发现可用模型'))
      }
    } catch (error) {
      console.error('Failed to fetch models:', error)
      message.error(t('settings.fetchModelsError', '获取模型列表失败，请检查配置'))
    } finally {
      setFetchingModels(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setTesting(true)
      const values = await form.validateFields(['provider', 'apiKey', 'baseUrl', 'model'].filter(f => f !== 'baseUrl' || provider === 'custom'))
      
      const config: AIConfig = { ...values, enabled: true }

      if (config.provider === 'custom' && (config.model === 'gpt-5' || !config.model)) {
        message.info(t('settings.modelWarning', '提示：检测到您正在使用自定义模型，请确保模型名称已正确填写'), 5)
      }

      // 防御性检查：确保 electronAPI.ai 存在
      if (!window.electronAPI?.ai) {
        throw new Error('AI API not available')
      }

      const result = await window.electronAPI.ai.testConnection(config)
      message[result.success ? 'success' : 'error'](result.message)
    } catch (error) {
      console.error('Test connection failed:', error)
      message.error(t('settings.testConnectionError', '测试连接失败，请检查配置'))
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const values = await form.validateFields()

      const config: AIConfig = {
        provider: values.provider || 'openai',
        apiKey: values.apiKey,
        baseUrl: values.baseUrl,
        model: values.model,
        enabled: values.enabled || false
      }

      // Save to localStorage
      localStorage.setItem('aiConfig', JSON.stringify(config))

      // 防御性检查：确保 electronAPI.ai 存在
      if (!window.electronAPI?.ai) {
        throw new Error('AI API not available')
      }

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

  const recommendedOptions = [
    { value: 'gpt-5', label: t('settings.aiModelLabel.gpt-5') },
    { value: 'gpt-5-mini', label: t('settings.aiModelLabel.gpt-5-mini') },
    { value: 'gpt-5-nano', label: t('settings.aiModelLabel.gpt-5-nano') },
    { value: 'o3', label: t('settings.aiModelLabel.o3') },
    { value: 'o4-mini', label: t('settings.aiModelLabel.o4-mini') },
    { value: 'gpt-4.1', label: t('settings.aiModelLabel.gpt-4.1') },
  ]

  const modelOptions = fetchedModels.length > 0
    ? Array.from(new Set(fetchedModels)).map(m => {
        const recommended = recommendedOptions.find(r => r.value === m)
        return recommended || { value: m, label: m }
      })
    : recommendedOptions

  return (
    <Card
      title={
        <Space align="center">
          <RobotOutlined />
          <span>{t('settings.aiConfig', 'AI 助手配置')}</span>
        </Space>
      }
      extra={
        // Responsive button group: vertical on small screens, horizontal on larger screens
        <Space 
          direction={isSmallScreen ? 'vertical' : 'horizontal'}
          size="small"
          style={isSmallScreen ? { width: '100%' } : undefined}
        >
          <Button 
            onClick={handleReset}
            block={isSmallScreen}
          >
            {t('common.reset', '重置')}
          </Button>
          <Button
            onClick={handleTestConnection}
            loading={testing}
            block={isSmallScreen}
          >
            {t('settings.testConnection', '测试连接')}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            block={isSmallScreen}
          >
            {t('common.save', '保存')}
          </Button>
        </Space>
      }
      // On small screens, move extra buttons below title
      styles={isSmallScreen ? { 
        header: { 
          flexDirection: 'column', 
          alignItems: 'flex-start',
          gap: '12px'
        } 
      } : undefined}
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
            model: 'gpt-5'
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
            <Select onChange={(val) => setProvider(val)}>
              <Option value="openai">{t('settings.aiProviderLabel.openai')}</Option>
              <Option value="custom">{t('settings.aiProviderLabel.custom')}</Option>
              <Option value="anthropic" disabled>{t('settings.aiProviderLabel.anthropic')}</Option>
              <Option value="local" disabled>{t('settings.aiProviderLabel.local')}</Option>
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

          {/* Base URL */}
          {provider === 'custom' && (
            <Form.Item
              name="baseUrl"
              label={t('settings.baseUrl', 'API 基础 URL')}
              tooltip={t('settings.baseUrlTooltip', '自定义 API 请求的基础地址 (例如: https://api.openai.com/v1)')}
              rules={[{ required: true, message: t('settings.baseUrlRequired', '使用自定义提供商时需要配置的基础 URL') }]}
            >
              <Input
                placeholder="https://api.openai.com/v1"
                allowClear
              />
            </Form.Item>
          )}

          {/* Model */}
          <Form.Item
            label={t('settings.aiModel', 'AI 模型')}
            tooltip={t('settings.aiModelTooltip', '选择或输入使用的 AI 模型')}
            required
          >
            {/* Responsive layout: vertical on small screens, horizontal compact on larger screens */}
            {isSmallScreen ? (
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Form.Item
                  name="model"
                  noStyle
                >
                  <Select
                    showSearch
                    allowClear
                    style={{ width: '100%' }}
                    placeholder={t('settings.selectOrInputModel', '选择或输入模型')}
                    filterOption={(input, option) =>
                      (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase()) ||
                      (option?.value as string ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={modelOptions}
                  />
                </Form.Item>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleFetchModels}
                  loading={fetchingModels}
                  block
                >
                  {t('settings.fetchModels', '获取模型列表')}
                </Button>
              </Space>
            ) : (
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item
                  name="model"
                  noStyle
                >
                  <Select
                    showSearch
                    allowClear
                    style={{ width: '100%' }}
                    placeholder={t('settings.selectOrInputModel', '选择或输入模型')}
                    filterOption={(input, option) =>
                      (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase()) ||
                      (option?.value as string ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={modelOptions}
                  />
                </Form.Item>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleFetchModels}
                  loading={fetchingModels}
                  title={t('settings.fetchModels', '获取模型列表')}
                />
              </Space.Compact>
            )}
          </Form.Item>

          {/* Model Info Alert */}
          <Form.Item>
            <Alert
              message={t('settings.modelDescription.title')}
              description={
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  <li>{t('settings.modelDescription.item.0')}</li>
                  <li>{t('settings.modelDescription.item.1')}</li>
                  <li>{t('settings.modelDescription.item.2')}</li>
                </ul>
              }
              type="info"
              showIcon
            />
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
