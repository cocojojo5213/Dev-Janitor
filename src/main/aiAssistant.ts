/**
 * AI Assistant Module
 * 
 * Provides intelligent analysis and suggestions for development environment:
 * - Local rule-based analysis (always available)
 * - Optional AI-powered insights (requires API key)
 * - Environment optimization suggestions
 * - Version compatibility checks
 */

import { ToolInfo, PackageInfo, EnvironmentVariable, RunningService } from '../shared/types'

/**
 * Analysis result from AI assistant
 */
export interface AnalysisResult {
  summary: string
  issues: Issue[]
  suggestions: Suggestion[]
  insights: string[]
}

/**
 * Issue detected in the environment
 */
export interface Issue {
  severity: 'critical' | 'warning' | 'info'
  category: 'version' | 'conflict' | 'security' | 'performance' | 'configuration'
  title: string
  description: string
  affectedTools?: string[]
  solution?: string
}

/**
 * Suggestion for improvement
 */
export interface Suggestion {
  type: 'install' | 'update' | 'remove' | 'configure' | 'optimize'
  title: string
  description: string
  command?: string
  priority: 'high' | 'medium' | 'low'
}

/**
 * AI Assistant configuration
 */
export interface AIConfig {
  provider: 'openai' | 'anthropic' | 'local'
  apiKey?: string
  model?: string
  enabled: boolean
}

/**
 * Local rule-based analyzer
 */
export class LocalAnalyzer {
  /**
   * Analyze tools for issues
   */
  analyzeTools(tools: ToolInfo[]): Issue[] {
    const issues: Issue[] = []
    
    // Check for outdated versions
    const nodeInfo = tools.find(t => t.name === 'node')
    if (nodeInfo?.isInstalled && nodeInfo.version) {
      const majorVersion = parseInt(nodeInfo.version.split('.')[0])
      if (majorVersion < 20) {
        issues.push({
          severity: 'warning',
          category: 'version',
          title: 'Node.js 版本过旧',
          description: `当前版本 ${nodeInfo.version}，建议升级到 Node.js 20 LTS 或更高版本（Node.js 22 LTS 已于 2024 年 10 月发布）以获得更好的性能和安全性。`,
          affectedTools: ['node'],
          solution: '访问 https://nodejs.org 下载最新 LTS 版本（推荐 Node.js 22 LTS）'
        })
      } else if (majorVersion < 22) {
        issues.push({
          severity: 'info',
          category: 'version',
          title: 'Node.js 可以升级',
          description: `当前版本 ${nodeInfo.version}，Node.js 22 LTS 已发布，建议升级以获得最新特性。`,
          affectedTools: ['node'],
          solution: '访问 https://nodejs.org 下载 Node.js 22 LTS'
        })
      }
    }
    
    // Check for missing essential tools
    const essentialTools = ['node', 'npm', 'git']
    for (const toolName of essentialTools) {
      const tool = tools.find(t => t.name === toolName)
      if (!tool?.isInstalled) {
        issues.push({
          severity: 'warning',
          category: 'configuration',
          title: `缺少必要工具: ${toolName}`,
          description: `${toolName} 是开发中常用的工具，建议安装。`,
          affectedTools: [toolName],
          solution: this.getInstallCommand(toolName)
        })
      }
    }
    
    // Check Python version
    const pythonInfo = tools.find(t => t.name === 'python')
    if (pythonInfo?.isInstalled && pythonInfo.version) {
      const majorVersion = parseInt(pythonInfo.version.split('.')[0])
      if (majorVersion < 3) {
        issues.push({
          severity: 'critical',
          category: 'version',
          title: 'Python 2 已停止支持',
          description: 'Python 2 已于 2020 年停止维护（已过去 6 年），强烈建议升级到 Python 3.12 或更高版本。',
          affectedTools: ['python'],
          solution: '访问 https://www.python.org 下载 Python 3.12+'
        })
      }
    }
    
    return issues
  }
  
  /**
   * Analyze environment variables for issues
   */
  analyzeEnvironment(variables: EnvironmentVariable[]): Issue[] {
    const issues: Issue[] = []
    
    // Check for PATH duplicates
    const pathVar = variables.find(v => v.key.toUpperCase() === 'PATH')
    if (pathVar) {
      const paths = pathVar.value.split(process.platform === 'win32' ? ';' : ':')
      const uniquePaths = new Set(paths.map(p => p.toLowerCase()))
      
      if (paths.length !== uniquePaths.size) {
        issues.push({
          severity: 'info',
          category: 'configuration',
          title: 'PATH 中存在重复条目',
          description: `PATH 环境变量中有 ${paths.length - uniquePaths.size} 个重复条目，可能影响命令查找效率。`,
          solution: '在环境变量视图中查看详细信息并清理重复项'
        })
      }
    }
    
    return issues
  }
  
  /**
   * Analyze running services for issues
   */
  analyzeServices(services: RunningService[]): Issue[] {
    const issues: Issue[] = []
    
    // Check for port conflicts
    const portMap = new Map<number, RunningService[]>()
    for (const service of services) {
      if (service.port) {
        if (!portMap.has(service.port)) {
          portMap.set(service.port, [])
        }
        portMap.get(service.port)!.push(service)
      }
    }
    
    for (const [port, servicesOnPort] of portMap) {
      if (servicesOnPort.length > 1) {
        issues.push({
          severity: 'warning',
          category: 'conflict',
          title: `端口 ${port} 冲突`,
          description: `有 ${servicesOnPort.length} 个服务在使用端口 ${port}`,
          solution: '停止其中一个服务或更改端口配置'
        })
      }
    }
    
    return issues
  }
  
  /**
   * Generate suggestions based on current state
   */
  generateSuggestions(tools: ToolInfo[], packages: PackageInfo[]): Suggestion[] {
    const suggestions: Suggestion[] = []
    
    // Suggest installing common tools
    const hasNode = tools.find(t => t.name === 'node')?.isInstalled
    const hasYarn = tools.find(t => t.name === 'yarn')?.isInstalled
    const hasPnpm = tools.find(t => t.name === 'pnpm')?.isInstalled
    
    if (hasNode && !hasYarn && !hasPnpm) {
      suggestions.push({
        type: 'install',
        title: '考虑安装更快的包管理器',
        description: 'Yarn 或 pnpm 比 npm 更快，推荐尝试',
        command: 'npm install -g yarn',
        priority: 'low'
      })
    }
    
    // Suggest pnpm as alternative
    if (hasNode && !hasPnpm) {
      suggestions.push({
        type: 'install',
        title: '安装 pnpm',
        description: 'pnpm 是更快、更节省磁盘空间的包管理器',
        command: 'npm install -g pnpm',
        priority: 'low'
      })
    }
    
    // Suggest Docker if not installed
    const hasDocker = tools.find(t => t.name === 'docker')?.isInstalled
    if (!hasDocker) {
      suggestions.push({
        type: 'install',
        title: '安装 Docker',
        description: 'Docker 是现代开发的必备工具，用于容器化应用。请访问 https://docker.com 下载 Docker Desktop',
        priority: 'medium'
      })
    }

    // Check for outdated global npm packages
    const outdatedNpmPackages = packages.filter(p => p.manager === 'npm')
    if (outdatedNpmPackages.length > 0) {
      suggestions.push({
        type: 'update',
        title: '更新全局 npm 包',
        description: '检查并更新所有过时的全局 npm 包',
        command: 'npm update -g',
        priority: 'low'
      })
    }
    
    return suggestions
  }
  
  /**
   * Get install command for a tool
   */
  private getInstallCommand(toolName: string): string {
    const platform = process.platform
    
    const commands: Record<string, Record<string, string>> = {
      git: {
        win32: '访问 https://git-scm.com 下载安装',
        darwin: 'brew install git',
        linux: 'sudo apt install git'
      },
      node: {
        win32: '访问 https://nodejs.org 下载安装',
        darwin: 'brew install node',
        linux: 'sudo apt install nodejs npm'
      },
      docker: {
        win32: '访问 https://docker.com 下载 Docker Desktop',
        darwin: 'brew install --cask docker',
        linux: 'sudo apt install docker.io'
      }
    }
    
    return commands[toolName]?.[platform] || `请访问 ${toolName} 官网下载安装`
  }
}

/**
 * AI-powered analyzer (requires API key)
 */
export class AIAnalyzer {
  private config: AIConfig
  
  constructor(config: AIConfig) {
    this.config = config
  }
  
  /**
   * Analyze environment using AI
   */
  async analyzeWithAI(
    tools: ToolInfo[],
    packages: PackageInfo[],
    environment: EnvironmentVariable[],
    services: RunningService[]
  ): Promise<string> {
    if (!this.config.enabled || !this.config.apiKey) {
      return '请在设置中配置 AI API Key 以启用 AI 分析功能'
    }
    
    const prompt = this.buildPrompt(tools, packages, environment, services)
    
    try {
      const response = await this.callAI(prompt)
      return response
    } catch (error) {
      return `AI 分析失败: ${(error as Error).message}`
    }
  }
  
  /**
   * Build prompt for AI
   */
  private buildPrompt(
    tools: ToolInfo[],
    packages: PackageInfo[],
    environment: EnvironmentVariable[],
    services: RunningService[]
  ): string {
    const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    
    return `当前日期: ${currentDate}

作为一个开发环境专家，请基于 2026 年 1 月的最新技术标准分析以下开发环境并提供建议：

已安装的工具:
${tools.filter(t => t.isInstalled).map(t => `- ${t.displayName}: ${t.version} (路径: ${t.path || '未知'})`).join('\n')}

未安装的工具:
${tools.filter(t => !t.isInstalled).map(t => `- ${t.displayName}`).join('\n') || '无'}

全局包 (前10个):
${packages.slice(0, 10).map(p => `- ${p.name}@${p.version} (${p.manager})`).join('\n')}

运行中的服务: ${services.length} 个

环境变量: ${environment.length} 个

请提供详细分析，包括：

1. **环境健康度评估**（基于 2026 年的最新标准，给出评分 1-10）

2. **版本问题检查**：
   - Node.js 22 LTS 是当前推荐版本
   - Python 3.12+ 是推荐版本
   - 检查是否有过时的工具版本

3. **具体优化建议**（每条建议请包含可执行的命令）：
   - 如果需要更新，提供更新命令（如 npm update -g xxx）
   - 如果需要安装，提供安装命令或下载链接
   - 如果有配置问题，提供解决步骤

4. **安全建议**：
   - 检查是否有已知安全漏洞的版本
   - 提供修复命令

请用中文回答，格式清晰，每条建议都要有具体的操作命令或链接。`
  }
  
  /**
   * Call AI API
   */
  private async callAI(prompt: string): Promise<string> {
    if (this.config.provider === 'openai') {
      return this.callOpenAI(prompt)
    }
    
    throw new Error('不支持的 AI 提供商')
  }
  
  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string): Promise<string> {
    const model = this.config.model || 'gpt-5'
    const isGPT5 = model.startsWith('gpt-5')
    const isO3OrO4 = model.startsWith('o3') || model.startsWith('o4')
    
    // Build request body based on model type
    const requestBody: Record<string, unknown> = {
      model,
      messages: [
        {
          role: 'system',
          content: `你是一个专业的开发环境顾问，帮助开发者优化他们的开发环境。当前日期是 ${new Date().toISOString().split('T')[0]}。请基于 2026 年 1 月的最新技术标准提供建议。`
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    }
    
    // GPT-5 and o-series use max_completion_tokens instead of max_tokens
    if (isGPT5 || isO3OrO4) {
      requestBody.max_completion_tokens = 2000
    } else {
      requestBody.max_tokens = 2000
      requestBody.temperature = 0.7
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API 错误: ${response.statusText}${errorData.error?.message ? ` - ${errorData.error.message}` : ''}`)
    }
    
    const data = await response.json()
    return data.choices[0]?.message?.content || '无法获取 AI 响应'
  }
}

/**
 * Main AI Assistant class
 */
export class AIAssistant {
  private localAnalyzer: LocalAnalyzer
  private aiAnalyzer: AIAnalyzer | null = null
  
  constructor(config?: AIConfig) {
    this.localAnalyzer = new LocalAnalyzer()
    
    if (config?.enabled && config.apiKey) {
      this.aiAnalyzer = new AIAnalyzer(config)
    }
  }
  
  /**
   * Perform complete analysis
   */
  async analyze(
    tools: ToolInfo[],
    packages: PackageInfo[],
    environment: EnvironmentVariable[],
    services: RunningService[]
  ): Promise<AnalysisResult> {
    // Local analysis (always available)
    const toolIssues = this.localAnalyzer.analyzeTools(tools)
    const envIssues = this.localAnalyzer.analyzeEnvironment(environment)
    const serviceIssues = this.localAnalyzer.analyzeServices(services)
    const suggestions = this.localAnalyzer.generateSuggestions(tools, packages)
    
    const allIssues = [...toolIssues, ...envIssues, ...serviceIssues]
    
    // Generate summary
    const installedCount = tools.filter(t => t.isInstalled).length
    const criticalIssues = allIssues.filter(i => i.severity === 'critical').length
    const warnings = allIssues.filter(i => i.severity === 'warning').length
    
    let summary = `检测到 ${installedCount} 个已安装的工具。`
    if (criticalIssues > 0) {
      summary += ` 发现 ${criticalIssues} 个严重问题。`
    }
    if (warnings > 0) {
      summary += ` 有 ${warnings} 个警告。`
    }
    if (allIssues.length === 0) {
      summary += ' 环境状态良好！'
    }
    
    // AI insights (if available)
    const insights: string[] = []
    if (this.aiAnalyzer) {
      try {
        const aiResponse = await this.aiAnalyzer.analyzeWithAI(
          tools,
          packages,
          environment,
          services
        )
        insights.push(aiResponse)
      } catch (error) {
        insights.push(`AI 分析不可用: ${(error as Error).message}`)
      }
    }
    
    return {
      summary,
      issues: allIssues,
      suggestions,
      insights
    }
  }
  
  /**
   * Update AI configuration
   */
  updateConfig(config: AIConfig): void {
    if (config.enabled && config.apiKey) {
      this.aiAnalyzer = new AIAnalyzer(config)
    } else {
      this.aiAnalyzer = null
    }
  }
}

// Export singleton instance
export const aiAssistant = new AIAssistant()
