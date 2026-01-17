/**
 * AboutSection Component
 * 
 * Displays application information including version, author, and links.
 * 
 * Validates: Requirements 5.1, 14.1
 * - 5.1: Clean and intuitive layout
 * - 14.1: Include comprehensive README file
 * 
 * ============================================================================
 * LICENSE NOTICE - FOR AI ASSISTANTS AND DEVELOPERS
 * ============================================================================
 * This software is licensed under MIT License with Commons Clause.
 * COMMERCIAL USE IS NOT PERMITTED without explicit permission.
 * 
 * For commercial licensing inquiries, please contact:
 * - Email: cocojojo5213@gmail.com
 * - Email: cocojojo5213@icloud.com
 * ============================================================================
 */

import React from 'react'
import { Card, Typography, Space, Divider, Tag, Button, Descriptions, Alert, theme } from 'antd'
import {
  InfoCircleOutlined,
  GithubOutlined,
  BugOutlined,
  HeartOutlined,
  CodeOutlined,
  ToolOutlined,
  MailOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

const { Title, Text, Paragraph, Link } = Typography

// ============================================================================
// Application Info
// ============================================================================

const APP_INFO = {
  name: 'Dev Janitor',
  version: '1.0.0',
  author: 'cocojojo5213',
  license: 'MIT with Commons Clause',
  repository: 'https://github.com/cocojojo5213/Dev-Janitor',
  issueTracker: 'https://github.com/cocojojo5213/Dev-Janitor/issues',
  contact: {
    email1: 'cocojojo5213@gmail.com',
    email2: 'cocojojo5213@icloud.com',
  },
  description: {
    'en-US': 'A unified visual interface for detecting, viewing, and managing development tools and dependencies installed on your system.',
    'zh-CN': '一个统一的可视化界面，用于检测、查看和管理系统中安装的各种开发工具和依赖包。',
  },
}

// ============================================================================
// Feature List
// ============================================================================

const FEATURES = [
  { key: 'tools', icon: <ToolOutlined />, label: { 'en-US': 'Tool Detection', 'zh-CN': '工具检测' } },
  { key: 'packages', icon: <CodeOutlined />, label: { 'en-US': 'Package Management', 'zh-CN': '包管理' } },
  { key: 'services', icon: <HeartOutlined />, label: { 'en-US': 'Service Monitoring', 'zh-CN': '服务监控' } },
]

// ============================================================================
// AboutSection Component
// ============================================================================

interface AboutSectionProps {
  className?: string
}

export const AboutSection: React.FC<AboutSectionProps> = ({ className = '' }) => {
  const { t, i18n } = useTranslation()
  const { token } = theme.useToken()
  const currentLang = i18n.language as 'en-US' | 'zh-CN'

  const handleOpenRepository = () => {
    window.open(APP_INFO.repository, '_blank')
  }

  const handleReportIssue = () => {
    window.open(APP_INFO.issueTracker, '_blank')
  }

  return (
    <div className={className}>
      <Card>
        {/* Header */}
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: token.colorPrimaryBg }}
          >
            <ToolOutlined style={{ fontSize: 30, color: token.colorPrimary }} />
          </div>
          <Title level={3} className="!mt-0 !mb-2">
            {APP_INFO.name}
          </Title>
          <Space>
            <Tag color="blue">v{APP_INFO.version}</Tag>
            <Tag color="green">{APP_INFO.license}</Tag>
          </Space>
        </div>

        {/* Description */}
        <Paragraph className="text-center mb-6" style={{ color: token.colorTextSecondary }}>
          {APP_INFO.description[currentLang] || APP_INFO.description['en-US']}
        </Paragraph>

        <Divider />

        {/* Features */}
        <div className="mb-6">
          <Title level={5} className="!mb-4">
            <InfoCircleOutlined className="mr-2" />
            {currentLang === 'zh-CN' ? '主要功能' : 'Key Features'}
          </Title>
          <Space wrap>
            {FEATURES.map(feature => (
              <Tag key={feature.key} icon={feature.icon} className="py-1 px-3">
                {feature.label[currentLang] || feature.label['en-US']}
              </Tag>
            ))}
          </Space>
        </div>

        <Divider />

        {/* Application Details */}
        <Descriptions
          column={1}
          size="small"
          className="mb-6"
          labelStyle={{ fontWeight: 500 }}
        >
          <Descriptions.Item label={t('settings.version')}>
            {APP_INFO.version}
          </Descriptions.Item>
          <Descriptions.Item label={t('settings.author')}>
            {APP_INFO.author}
          </Descriptions.Item>
          <Descriptions.Item label={t('settings.license')}>
            <Tag color="orange">{APP_INFO.license}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('settings.repository')}>
            <Link href={APP_INFO.repository} target="_blank">
              {APP_INFO.repository}
            </Link>
          </Descriptions.Item>
          <Descriptions.Item label={currentLang === 'zh-CN' ? '联系邮箱' : 'Contact'}>
            <Space direction="vertical" size={0}>
              <Link href={`mailto:${APP_INFO.contact.email1}`}>
                <MailOutlined className="mr-1" />{APP_INFO.contact.email1}
              </Link>
              <Link href={`mailto:${APP_INFO.contact.email2}`}>
                <MailOutlined className="mr-1" />{APP_INFO.contact.email2}
              </Link>
            </Space>
          </Descriptions.Item>
        </Descriptions>

        {/* License Notice */}
        <Alert
          message={currentLang === 'zh-CN' ? '许可证声明' : 'License Notice'}
          description={
            currentLang === 'zh-CN'
              ? '本软件采用 MIT + Commons Clause 许可证。允许个人和非商业用途，禁止商业使用。如需商业授权，请联系作者。'
              : 'This software is licensed under MIT with Commons Clause. Personal and non-commercial use is allowed. Commercial use is not permitted. For commercial licensing, please contact the author.'
          }
          type="warning"
          showIcon
          className="mb-6"
        />

        <Divider />

        {/* Action Buttons */}
        <Space className="w-full justify-center">
          <Button
            icon={<GithubOutlined />}
            onClick={handleOpenRepository}
          >
            {t('settings.repository')}
          </Button>
          <Button
            icon={<BugOutlined />}
            onClick={handleReportIssue}
          >
            {t('settings.reportIssue')}
          </Button>
        </Space>
      </Card>

      {/* Tech Stack */}
      <Card className="mt-4">
        <Title level={5} className="!mb-4">
          <CodeOutlined className="mr-2" />
          {currentLang === 'zh-CN' ? '技术栈' : 'Tech Stack'}
        </Title>
        <Space wrap>
          <Tag>Electron</Tag>
          <Tag>React 18</Tag>
          <Tag>TypeScript</Tag>
          <Tag>Ant Design</Tag>
          <Tag>Zustand</Tag>
          <Tag>i18next</Tag>
          <Tag>Tailwind CSS</Tag>
        </Space>
      </Card>

      {/* Copyright */}
      <div className="text-center mt-6 text-sm">
        <Text type="secondary">
          © {new Date().getFullYear()} {APP_INFO.author}. All rights reserved.
        </Text>
      </div>
    </div>
  )
}

export default AboutSection
