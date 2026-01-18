/**
 * PathAnalyzer Component
 * 
 * Analyzes PATH environment variable:
 * - Lists all PATH entries
 * - Detects and highlights duplicate entries
 * 
 * Validates: Requirements 10.5, 10.6
 * Property 18: Duplicate PATH Detection
 */

import React, { useMemo } from 'react'
import { Card, List, Typography, Tag, Alert, Empty, Tooltip, Button, message, theme } from 'antd'
import {
  WarningOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  FolderOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

const { Paragraph } = Typography

export interface PathAnalyzerProps {
  pathEntries: string[]
}

interface PathEntryInfo {
  path: string
  index: number
  isDuplicate: boolean
  duplicateIndices: number[]
}

const PathAnalyzer: React.FC<PathAnalyzerProps> = ({ pathEntries }) => {
  const { t } = useTranslation()
  const { token } = theme.useToken()

  // Analyze PATH entries for duplicates - Validates: Property 18
  const analyzedEntries = useMemo((): PathEntryInfo[] => {
    const pathMap = new Map<string, number[]>()
    
    // First pass: collect all indices for each path
    pathEntries.forEach((path, index) => {
      const normalizedPath = path.toLowerCase().trim()
      const indices = pathMap.get(normalizedPath) || []
      indices.push(index)
      pathMap.set(normalizedPath, indices)
    })

    // Second pass: create entry info with duplicate detection
    return pathEntries.map((path, index) => {
      const normalizedPath = path.toLowerCase().trim()
      const indices = pathMap.get(normalizedPath) || []
      const isDuplicate = indices.length > 1
      
      return {
        path,
        index,
        isDuplicate,
        duplicateIndices: isDuplicate ? indices.filter(i => i !== index) : [],
      }
    })
  }, [pathEntries])

  // Count duplicates
  const duplicateCount = useMemo(() => {
    const seen = new Set<string>()
    let count = 0
    
    pathEntries.forEach(path => {
      const normalizedPath = path.toLowerCase().trim()
      if (seen.has(normalizedPath)) {
        count++
      } else {
        seen.add(normalizedPath)
      }
    })
    
    return count
  }, [pathEntries])

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path)
      .then(() => {
        message.success(t('notifications.copySuccess'))
      })
      .catch(() => {
        message.error(t('notifications.copyFailed'))
      })
  }

  const handleCopyAllPaths = () => {
    const allPaths = pathEntries.join('\n')
    navigator.clipboard.writeText(allPaths)
      .then(() => {
        message.success(t('notifications.copySuccess'))
      })
      .catch(() => {
        message.error(t('notifications.copyFailed'))
      })
  }

  if (pathEntries.length === 0) {
    return (
      <Card title={t('environment.pathAnalysis')}>
        <Empty description={t('common.noData')} />
      </Card>
    )
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <FolderOutlined />
          <span>{t('environment.pathAnalysis')}</span>
          <Tag color="blue">
            {t('environment.pathEntryCount', { count: pathEntries.length })}
          </Tag>
        </div>
      }
      extra={
        <Button
          type="text"
          icon={<CopyOutlined />}
          onClick={handleCopyAllPaths}
        >
          {t('common.copy')} {t('common.all')}
        </Button>
      }
    >
      {/* Duplicate warning - Validates: Requirement 10.6 */}
      {duplicateCount > 0 ? (
        <Alert
          message={t('environment.duplicates')}
          description={t('environment.duplicatesFound', { count: duplicateCount })}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          className="mb-4"
        />
      ) : (
        <Alert
          message={t('environment.noDuplicates')}
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          className="mb-4"
        />
      )}

      {/* PATH entries list */}
      <List
        size="small"
        dataSource={analyzedEntries}
        renderItem={(entry) => (
          <List.Item
            style={entry.isDuplicate ? { background: token.colorWarningBg } : undefined}
            actions={[
              <Tooltip key="copy" title={t('common.copy')}>
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyPath(entry.path)}
                />
              </Tooltip>,
            ]}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Tag color="default" className="shrink-0">
                {entry.index + 1}
              </Tag>
              
              <Tooltip title={entry.path}>
                <Paragraph
                  className="font-mono text-xs m-0 flex-1"
                  ellipsis={{ rows: 1 }}
                >
                  {entry.path}
                </Paragraph>
              </Tooltip>

              {entry.isDuplicate && (
                <Tooltip
                  title={`Duplicate of entry ${entry.duplicateIndices.map(i => i + 1).join(', ')}`}
                >
                  <Tag color="warning" icon={<WarningOutlined />}>
                    {t('environment.duplicates')}
                  </Tag>
                </Tooltip>
              )}
            </div>
          </List.Item>
        )}
        style={{ maxHeight: 400, overflow: 'auto' }}
      />
    </Card>
  )
}

export default PathAnalyzer
