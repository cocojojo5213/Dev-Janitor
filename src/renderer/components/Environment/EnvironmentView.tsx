/**
 * EnvironmentView Component
 * 
 * Main view for displaying environment variables:
 * - Environment variable table with search/filter
 * - Category filtering
 * - PATH analyzer
 * 
 * Validates: Requirements 10.1, 10.3, 10.4, 10.5, 10.6
 * Property 15: Environment Variable Completeness
 * Property 16: Environment Variable Display
 * Property 17: Environment Variable Filtering
 * Property 18: Duplicate PATH Detection
 */

import React, { useState, useEffect, useMemo } from 'react'
import {
  Typography,
  Table,
  Input,
  Segmented,
  Alert,
  Empty,
  Tag,
  Tooltip,
  Button,
  message,
  Row,
  Col,
  Card,
} from 'antd'
import { SearchOutlined, CopyOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import PathAnalyzer from './PathAnalyzer'
import type { EnvironmentVariable } from '@shared/types'
import type { ColumnsType } from 'antd/es/table'

const { Title, Text, Paragraph } = Typography

type CategoryFilter = 'all' | 'path' | 'java' | 'python' | 'node' | 'other'

/**
 * Get color for category tag
 */
const getCategoryColor = (category: EnvironmentVariable['category']): string => {
  const colorMap: Record<EnvironmentVariable['category'], string> = {
    'path': 'blue',
    'java': 'orange',
    'python': 'green',
    'node': 'lime',
    'other': 'default',
  }
  return colorMap[category] || 'default'
}

const EnvironmentView: React.FC = () => {
  const { t } = useTranslation()
  const {
    environmentVariables,
    pathEntries,
    envLoading,
    envError,
    loadEnvironment,
  } = useAppStore()

  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')

  // Load environment on mount
  useEffect(() => {
    if (environmentVariables.length === 0 && !envLoading) {
      loadEnvironment()
    }
  }, [environmentVariables.length, envLoading, loadEnvironment])

  // Filter variables by search and category - Validates: Property 17
  const filteredVariables = useMemo(() => {
    let filtered = environmentVariables

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(v => v.category === categoryFilter)
    }

    // Filter by search text
    if (searchText.trim()) {
      const lowerSearch = searchText.toLowerCase()
      filtered = filtered.filter(v =>
        v.key.toLowerCase().includes(lowerSearch) ||
        v.value.toLowerCase().includes(lowerSearch)
      )
    }

    return filtered
  }, [environmentVariables, categoryFilter, searchText])

  // Category counts for filter badges
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      all: environmentVariables.length,
      path: 0,
      java: 0,
      python: 0,
      node: 0,
      other: 0,
    }

    environmentVariables.forEach(v => {
      counts[v.category]++
    })

    return counts
  }, [environmentVariables])

  const handleCopyValue = (value: string) => {
    navigator.clipboard.writeText(value)
      .then(() => {
        message.success(t('notifications.copySuccess'))
      })
      .catch(() => {
        message.error(t('notifications.copyFailed'))
      })
  }

  // Category filter options
  const categoryOptions = [
    { label: `${t('common.all')} (${categoryCounts.all})`, value: 'all' },
    { label: `${t('environment.categories.path')} (${categoryCounts.path})`, value: 'path' },
    { label: `${t('environment.categories.java')} (${categoryCounts.java})`, value: 'java' },
    { label: `${t('environment.categories.python')} (${categoryCounts.python})`, value: 'python' },
    { label: `${t('environment.categories.node')} (${categoryCounts.node})`, value: 'node' },
    { label: `${t('environment.categories.other')} (${categoryCounts.other})`, value: 'other' },
  ]

  // Table columns - Validates: Property 16 (Environment Variable Display)
  const columns: ColumnsType<EnvironmentVariable> = [
    {
      title: t('environment.key'),
      dataIndex: 'key',
      key: 'key',
      width: 250,
      sorter: (a, b) => a.key.localeCompare(b.key),
      render: (key: string) => (
        <Text strong className="font-mono">{key}</Text>
      ),
    },
    {
      title: t('environment.value'),
      dataIndex: 'value',
      key: 'value',
      ellipsis: true,
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Tooltip title={value}>
            <Paragraph
              className="font-mono text-xs m-0 flex-1"
              ellipsis={{ rows: 1 }}
            >
              {value}
            </Paragraph>
          </Tooltip>
          <Tooltip title={t('environment.copyValue')}>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyValue(value)}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: t('environment.category'),
      dataIndex: 'category',
      key: 'category',
      width: 120,
      filters: [
        { text: t('environment.categories.path'), value: 'path' },
        { text: t('environment.categories.java'), value: 'java' },
        { text: t('environment.categories.python'), value: 'python' },
        { text: t('environment.categories.node'), value: 'node' },
        { text: t('environment.categories.other'), value: 'other' },
      ],
      onFilter: (value, record) => record.category === value,
      render: (category: EnvironmentVariable['category']) => (
        <Tag color={getCategoryColor(category)}>
          {t(`environment.categories.${category}`)}
        </Tag>
      ),
    },
    {
      title: t('environment.type'),
      dataIndex: 'isSystemVariable',
      key: 'type',
      width: 100,
      filters: [
        { text: t('environment.systemVariable'), value: true },
        { text: t('environment.userVariable'), value: false },
      ],
      onFilter: (value, record) => record.isSystemVariable === value,
      render: (isSystem: boolean) => (
        <Tag color={isSystem ? 'purple' : 'cyan'}>
          {isSystem ? t('environment.systemVariable') : t('environment.userVariable')}
        </Tag>
      ),
    },
  ]

  // Error state
  if (envError) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Title level={3}>{t('environment.title')}</Title>
        </div>
        <Alert
          message={t('errors.loadFailed')}
          description={envError}
          type="error"
          showIcon
          action={
            <Button type="link" size="small" onClick={loadEnvironment}>
              {t('common.retry')}
            </Button>
          }
        />
      </div>
    )
  }

  // Empty state
  if (environmentVariables.length === 0 && !envLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Title level={3}>{t('environment.title')}</Title>
          <Text type="secondary">{t('environment.subtitle')}</Text>
        </div>
        <Empty
          description={
            <div>
              <Text>{t('empty.environment')}</Text>
              <br />
              <Text type="secondary">{t('empty.environmentDescription')}</Text>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Title level={3} className="!mb-1">{t('environment.title')}</Title>
        <Text type="secondary">{t('environment.subtitle')}</Text>
      </div>

      <Row gutter={[16, 16]}>
        {/* Environment Variables Table */}
        <Col xs={24} xl={16}>
          <Card
            title={
              <div className="flex items-center gap-2">
                <span>{t('environment.title')}</span>
                <Tag color="blue">
                  {t('environment.variableCount', { count: filteredVariables.length })}
                </Tag>
              </div>
            }
          >
            {/* Filters */}
            <div className="mb-4 flex flex-wrap gap-4 items-center">
              {/* Category filter - Validates: Requirement 10.5 */}
              <Segmented
                options={categoryOptions}
                value={categoryFilter}
                onChange={(value) => setCategoryFilter(value as CategoryFilter)}
                size="small"
              />

              {/* Search */}
              <Input
                placeholder={t('common.searchPlaceholder')}
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{ width: 250 }}
              />
            </div>

            {/* Table - Validates: Property 15, Property 16 */}
            <Table
              columns={columns}
              dataSource={filteredVariables}
              loading={envLoading}
              rowKey="key"
              size="small"
              pagination={{
                pageSize: 15,
                showSizeChanger: true,
                showTotal: (total) => `${total} ${t('environment.title').toLowerCase()}`,
              }}
              locale={{
                emptyText: t('environment.noVariables'),
              }}
            />
          </Card>
        </Col>

        {/* PATH Analyzer - Validates: Requirement 10.6, Property 18 */}
        <Col xs={24} xl={8}>
          <PathAnalyzer pathEntries={pathEntries} />
        </Col>
      </Row>
    </div>
  )
}

export default EnvironmentView
