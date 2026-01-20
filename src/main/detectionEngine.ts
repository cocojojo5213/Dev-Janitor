/**
 * Detection Engine Module
 * 
 * Provides functionality to detect installed development tools:
 * - Node.js, Python, PHP (runtimes)
 * - npm, pip, Composer (package managers)
 * - Custom tools via command detection
 * 
 * Validates: Requirements 1.2-1.9, 2.1-2.5
 */

import { ToolInfo, DetectionSummary, CommandResult } from '../shared/types'
import {
  CommandExecutor,
  commandExecutor,
  isWindows,
} from './commandExecutor'

/**
 * Cache entry for detection results
 * Validates: Requirement 7.1
 */
interface CacheEntry<T> {
  value: T
  timestamp: number
  ttl: number
}

/**
 * Detection cache for storing tool detection results
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4
 */
export class DetectionCache {
  private cache: Map<string, CacheEntry<ToolInfo>> = new Map()
  private defaultTtl: number

  /**
   * Create a new detection cache
   * @param ttl Time-to-live in milliseconds (default: 5 minutes)
   */
  constructor(ttl: number = 5 * 60 * 1000) {
    this.defaultTtl = ttl
  }

  /**
   * Get a cached detection result
   * @param toolName The tool name to look up
   * @returns The cached ToolInfo or null if not found/expired
   */
  get(toolName: string): ToolInfo | null {
    const entry = this.cache.get(toolName)
    if (!entry) return null

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(toolName)
      return null
    }

    return entry.value
  }

  /**
   * Set a cached detection result
   * @param toolName The tool name
   * @param value The detection result
   * @param ttl Optional custom TTL in milliseconds
   */
  set(toolName: string, value: ToolInfo, ttl?: number): void {
    this.cache.set(toolName, {
      value,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTtl,
    })
  }

  /**
   * Invalidate a specific cache entry
   * @param toolName The tool name to invalidate
   */
  invalidate(toolName: string): void {
    this.cache.delete(toolName)
  }

  /**
   * Invalidate all cache entries
   */
  invalidateAll(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // Could track hits/misses for actual hit rate
    }
  }

  /**
   * Check if a tool is cached and not expired
   * @param toolName The tool name to check
   */
  has(toolName: string): boolean {
    return this.get(toolName) !== null
  }
}

/**
 * Global detection cache instance
 */
export const detectionCache = new DetectionCache()

/**
 * Version parsing result
 */
interface ParsedVersion {
  version: string | null
  raw: string
}

/**
 * Platform-specific command variants configuration
 * Validates: Requirement 2.1, 2.2, 2.3, 2.4
 */
export const PlatformCommands = {
  python: {
    win32: ['py', 'python', 'python3'],
    darwin: ['python3', 'python'],
    linux: ['python3', 'python'],
  },
  pip: {
    // Windows: prioritize py -m pip (most reliable)
    win32: ['py -m pip', 'pip3', 'pip'],
    darwin: ['pip3', 'pip'],
    linux: ['pip3', 'pip'],
  },
} as const

/**
 * Windows fallback paths for common tools
 * Validates: Requirement 2.5
 */
export const WindowsFallbackPaths = {
  python: [
    '%LOCALAPPDATA%\\Programs\\Python',
    '%PROGRAMFILES%\\Python',
    '%PROGRAMFILES(x86)%\\Python',
    '%APPDATA%\\Python',
  ],
  node: [
    '%PROGRAMFILES%\\nodejs',
    '%APPDATA%\\nvm',
    '%LOCALAPPDATA%\\nvm',
  ],
  git: [
    '%PROGRAMFILES%\\Git',
    '%PROGRAMFILES(x86)%\\Git',
  ],
}

/**
 * Get command variants for a tool based on current platform
 * 
 * @param tool The tool name
 * @returns Array of command variants to try
 */
export function getCommandVariants(tool: keyof typeof PlatformCommands): string[] {
  const platform = process.platform as 'win32' | 'darwin' | 'linux'
  const variants = PlatformCommands[tool][platform] || PlatformCommands[tool].linux
  return [...variants] // Create mutable copy
}

/**
 * Parse version string from command output
 * Handles various version formats:
 * - v18.17.0 (Node.js style)
 * - Python 3.11.4
 * - PHP 8.2.0
 * - 9.8.1 (npm style)
 * 
 * @param output The command output to parse
 * @returns Parsed version information
 */
export function parseVersion(output: string): ParsedVersion {
  if (!output || typeof output !== 'string') {
    return { version: null, raw: '' }
  }

  const trimmed = output.trim()

  // Try to match common version patterns
  // Pattern 1: v followed by semver (v18.17.0)
  const vPattern = /v?(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?)/i
  const match = trimmed.match(vPattern)

  if (match) {
    return { version: match[1], raw: trimmed }
  }

  // Pattern 2: Just numbers with dots (9.8.1)
  const numPattern = /(\d+\.\d+(?:\.\d+)?)/
  const numMatch = trimmed.match(numPattern)

  if (numMatch) {
    return { version: numMatch[1], raw: trimmed }
  }

  return { version: null, raw: trimmed }
}

/**
 * Get version output from a command result.
 * Prefer stdout, fallback to stderr (some tools print version to stderr).
 */
function getVersionOutput(result: Pick<CommandResult, 'stdout' | 'stderr'>): string {
  if (result.stdout && result.stdout.trim()) {
    return result.stdout
  }
  if (result.stderr && result.stderr.trim()) {
    return result.stderr
  }
  return ''
}

/**
 * Determine the installation method based on the tool path
 * 
 * @param path The installation path of the tool
 * @returns The detected installation method
 */
export function detectInstallMethod(
  path: string | null
): ToolInfo['installMethod'] {
  if (!path) return 'manual'

  const lowerPath = path.toLowerCase()

  // Check for common package manager installation paths
  if (lowerPath.includes('homebrew') || lowerPath.includes('/opt/homebrew')) {
    return 'homebrew'
  }
  if (lowerPath.includes('chocolatey') || lowerPath.includes('choco')) {
    return 'chocolatey'
  }
  if (lowerPath.includes('/usr/bin') || lowerPath.includes('/usr/local/bin')) {
    // Could be apt or manual on Linux
    if (process.platform === 'linux') {
      return 'apt'
    }
  }
  if (lowerPath.includes('npm') || lowerPath.includes('node_modules')) {
    return 'npm'
  }
  if (lowerPath.includes('pip') || lowerPath.includes('site-packages')) {
    return 'pip'
  }

  return 'manual'
}

/**
 * Create an unavailable tool info object
 * 
 * Property 2: Unavailable Tool Handling
 * @param name Tool name
 * @param displayName Display name
 * @param category Tool category
 * @param errorReason Optional reason for detection failure
 * @returns ToolInfo with isInstalled: false
 */
function createUnavailableTool(
  name: string,
  displayName: string,
  category: ToolInfo['category'],
  errorReason?: string
): ToolInfo {
  return {
    name,
    displayName,
    version: null,
    path: null,
    isInstalled: false,
    category,
    errorReason: errorReason || 'Tool not found',
    detectionMethod: 'primary',
  }
}

/**
 * Detection Engine class for detecting installed development tools
 * 
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4
 */
export class DetectionEngine {
  private executor: CommandExecutor
  private cache: DetectionCache

  /**
   * Create a new DetectionEngine
   * @param executor Command executor to use
   * @param cache Optional custom cache instance
   */
  constructor(
    executor: CommandExecutor = commandExecutor,
    cache: DetectionCache = detectionCache
  ) {
    this.executor = executor
    this.cache = cache
  }

  /**
   * Invalidate all cached detection results
   * Validates: Requirement 7.4
   */
  invalidateCache(): void {
    this.cache.invalidateAll()
  }

  /**
   * Invalidate a specific tool's cached result
   * @param toolName The tool name to invalidate
   */
  invalidateCacheFor(toolName: string): void {
    this.cache.invalidate(toolName)
  }

  /**
   * Search Windows fallback paths for a tool
   * Validates: Requirement 2.5
   *
   * @param tool The tool to search for
   * @returns ToolInfo if found, null otherwise
   */
  private async searchWindowsFallbackPaths(tool: keyof typeof WindowsFallbackPaths): Promise<ToolInfo | null> {
    if (!isWindows()) return null

    const paths = WindowsFallbackPaths[tool]
    if (!paths) return null

    const fs = await import('fs')
    const fsPromises = fs.promises
    const path = await import('path')

    for (const pathTemplate of paths) {
      // Expand environment variables
      const expandedPath = pathTemplate.replace(/%([^%]+)%/g, (_, varName) => {
        return process.env[varName] || ''
      })

      if (!expandedPath) continue

      // Try to find executable in this path
      try {
        // Check if path exists using async
        try {
          await fsPromises.access(expandedPath)
        } catch {
          continue
        }

        const files = await fsPromises.readdir(expandedPath)
        for (const file of files) {
          const fullPath = path.join(expandedPath, file)
          const stat = await fsPromises.stat(fullPath)

          if (stat.isDirectory()) {
            // Check subdirectory for executable
            const exeName = tool === 'python' ? 'python.exe' : `${tool}.exe`
            const exePath = path.join(fullPath, exeName)

            // Check if executable exists
            try {
              await fsPromises.access(exePath)
            } catch {
              continue
            }

            // Found the executable, get version
            const versionResult = await this.executor.executeSafe(`"${exePath}" --version`)
            if (versionResult.success) {
              const { version } = parseVersion(getVersionOutput(versionResult))
              return {
                name: tool,
                displayName: tool.charAt(0).toUpperCase() + tool.slice(1),
                version,
                path: exePath,
                isInstalled: true,
                installMethod: 'manual',
                category: 'runtime',
              }
            }
          }
        }
      } catch {
        // Continue to next path
      }
    }

    return null
  }

  /**
   * Detect Node.js installation
   * 
   * Property 1: Tool Detection Consistency
   * Validates: Requirement 1.2
   */
  async detectNodeJS(): Promise<ToolInfo> {
    const name = 'node'
    const displayName = 'Node.js'
    const category: ToolInfo['category'] = 'runtime'

    try {
      // Get version
      const versionResult = await this.executor.executeSafe('node --version')

      if (!versionResult.success) {
        return createUnavailableTool(name, displayName, category)
      }

      const { version } = parseVersion(getVersionOutput(versionResult))

      // Get path
      const path = await this.executor.getToolPath('node')

      return {
        name,
        displayName,
        version,
        path,
        isInstalled: true,
        installMethod: detectInstallMethod(path),
        category,
      }
    } catch {
      return createUnavailableTool(name, displayName, category)
    }
  }

  /**
   * Detect npm installation
   * 
   * Property 1: Tool Detection Consistency
   * Validates: Requirement 1.3
   */
  async detectNpm(): Promise<ToolInfo> {
    const name = 'npm'
    const displayName = 'npm'
    const category: ToolInfo['category'] = 'package-manager'

    try {
      const versionResult = await this.executor.executeSafe('npm --version')

      if (!versionResult.success) {
        return createUnavailableTool(name, displayName, category)
      }

      const { version } = parseVersion(getVersionOutput(versionResult))
      const path = await this.executor.getToolPath('npm')

      return {
        name,
        displayName,
        version,
        path,
        isInstalled: true,
        installMethod: detectInstallMethod(path),
        category,
      }
    } catch {
      return createUnavailableTool(name, displayName, category)
    }
  }

  /**
   * Detect Python installation
   * 
   * Property 1: Tool Detection Consistency
   * Validates: Requirement 1.4, 2.3
   */
  async detectPython(): Promise<ToolInfo> {
    const name = 'python'
    const displayName = 'Python'
    const category: ToolInfo['category'] = 'runtime'

    try {
      // Use platform-specific command variants
      // Windows: py (Python Launcher), python, python3
      // Unix: python3, python
      const commands = getCommandVariants('python')

      let versionResult = { success: false, stdout: '', stderr: '', exitCode: 1 }
      let pythonCmd = ''

      for (const cmd of commands) {
        versionResult = await this.executor.executeSafe(`${cmd} --version`)
        if (versionResult.success) {
          pythonCmd = cmd
          break
        }
      }

      if (!versionResult.success) {
        // Try Windows fallback paths if applicable
        if (isWindows()) {
          const fallbackResult = await this.searchWindowsFallbackPaths('python')
          if (fallbackResult) {
            return fallbackResult
          }
        }
        return createUnavailableTool(name, displayName, category)
      }

      const { version } = parseVersion(getVersionOutput(versionResult))
      const path = await this.executor.getToolPath(pythonCmd)

      return {
        name,
        displayName,
        version,
        path,
        isInstalled: true,
        installMethod: detectInstallMethod(path),
        category,
      }
    } catch {
      return createUnavailableTool(name, displayName, category)
    }
  }

  /**
   * Detect pip installation
   * 
   * Property 1: Tool Detection Consistency
   * Validates: Requirement 1.5, 2.4, 4.1
   */
  async detectPip(): Promise<ToolInfo> {
    const name = 'pip'
    const displayName = 'pip'
    const category: ToolInfo['category'] = 'package-manager'

    try {
      // Use platform-specific command variants
      // Windows: py -m pip (most reliable), pip3, pip
      // Unix: pip3, pip
      const commands = getCommandVariants('pip')

      let versionResult = { success: false, stdout: '', stderr: '', exitCode: 1 }
      let pipCmd = ''

      for (const cmd of commands) {
        versionResult = await this.executor.executeSafe(`${cmd} --version`)
        if (versionResult.success) {
          pipCmd = cmd
          break
        }
      }

      if (!versionResult.success) {
        return createUnavailableTool(name, displayName, category)
      }

      // pip version output: "pip 23.2.1 from /path/to/pip (python 3.11)"
      const { version } = parseVersion(getVersionOutput(versionResult))

      // For 'py -m pip', get the path of py instead
      const pathCmd = pipCmd === 'py -m pip' ? 'py' : pipCmd.split(' ')[0]
      const path = await this.executor.getToolPath(pathCmd)

      return {
        name,
        displayName,
        version,
        path,
        isInstalled: true,
        installMethod: detectInstallMethod(path),
        category,
      }
    } catch {
      return createUnavailableTool(name, displayName, category)
    }
  }

  /**
   * Detect PHP installation
   * 
   * Property 1: Tool Detection Consistency
   * Validates: Requirement 1.6
   */
  async detectPHP(): Promise<ToolInfo> {
    const name = 'php'
    const displayName = 'PHP'
    const category: ToolInfo['category'] = 'runtime'

    try {
      const versionResult = await this.executor.executeSafe('php --version')

      if (!versionResult.success) {
        return createUnavailableTool(name, displayName, category)
      }

      // PHP version output: "PHP 8.2.0 (cli) ..."
      const { version } = parseVersion(getVersionOutput(versionResult))
      const path = await this.executor.getToolPath('php')

      return {
        name,
        displayName,
        version,
        path,
        isInstalled: true,
        installMethod: detectInstallMethod(path),
        category,
      }
    } catch {
      return createUnavailableTool(name, displayName, category)
    }
  }

  /**
   * Detect Composer installation
   * 
   * Property 1: Tool Detection Consistency
   * Validates: Requirement 1.7
   */
  async detectComposer(): Promise<ToolInfo> {
    const name = 'composer'
    const displayName = 'Composer'
    const category: ToolInfo['category'] = 'package-manager'

    try {
      const versionResult = await this.executor.executeSafe('composer --version')

      if (!versionResult.success) {
        return createUnavailableTool(name, displayName, category)
      }

      // Composer version output: "Composer version 2.5.8 2023-06-09 17:13:21"
      const { version } = parseVersion(getVersionOutput(versionResult))
      const path = await this.executor.getToolPath('composer')

      return {
        name,
        displayName,
        version,
        path,
        isInstalled: true,
        installMethod: detectInstallMethod(path),
        category,
      }
    } catch {
      return createUnavailableTool(name, displayName, category)
    }
  }

  /**
   * Detect a custom tool by command name
   * 
   * @param command The command name to detect
   * @param displayName Optional display name (defaults to command)
   * @param versionFlag Optional version flag (defaults to --version)
   * @returns Promise resolving to ToolInfo
   */
  async detectCustomTool(
    command: string,
    displayName?: string,
    versionFlag: string = '--version'
  ): Promise<ToolInfo> {
    const name = command
    const display = displayName || command
    const category: ToolInfo['category'] = 'tool'

    try {
      const versionResult = await this.executor.executeSafe(
        `${command} ${versionFlag}`
      )

      if (!versionResult.success) {
        return createUnavailableTool(name, display, category)
      }

      const { version } = parseVersion(getVersionOutput(versionResult))
      const path = await this.executor.getToolPath(command)

      return {
        name,
        displayName: display,
        version,
        path,
        isInstalled: true,
        installMethod: detectInstallMethod(path),
        category,
      }
    } catch {
      return createUnavailableTool(name, display, category)
    }
  }

  /**
   * Detect a single tool by name
   * 
   * Validates: Requirements 7.2, 7.3
   * @param toolName The name of the tool to detect
   * @param forceRefresh If true, bypass cache and force fresh detection
   * @returns Promise resolving to ToolInfo
   */
  async detectTool(toolName: string, forceRefresh: boolean = false): Promise<ToolInfo> {
    const lowerName = toolName.toLowerCase()

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.cache.get(lowerName)
      if (cached) {
        return cached
      }
    }

    // Perform detection
    let result: ToolInfo

    switch (lowerName) {
      case 'node':
      case 'nodejs':
      case 'node.js':
        result = await this.detectNodeJS()
        break
      case 'npm':
        result = await this.detectNpm()
        break
      case 'python':
      case 'python3':
        result = await this.detectPython()
        break
      case 'pip':
      case 'pip3':
        result = await this.detectPip()
        break
      case 'php':
        result = await this.detectPHP()
        break
      case 'composer':
        result = await this.detectComposer()
        break
      case 'mvn':
        result = await this.detectCustomTool('mvn', 'Maven', '-version')
        break
      default:
        result = await this.detectCustomTool(toolName)
    }

    // Cache the result
    this.cache.set(lowerName, result)

    return result
  }

  /**
   * Detect all supported tools with controlled concurrency
   * 
   * Property 11: Partial Failure Resilience
   * Validates: Requirement 1.8 (retrieve version and path)
   * 
   * @returns Promise resolving to array of ToolInfo
   */
  async detectAllTools(): Promise<ToolInfo[]> {
    const results: ToolInfo[] = []

    // Define all tools to detect
    const toolDetectors = [
      // Runtimes (Requirement 5.1)
      () => this.detectNodeJS(),
      () => this.detectPython(),
      () => this.detectPHP(),
      () => this.detectCustomTool('java', 'Java', '-version'),
      () => this.detectCustomTool('go', 'Go', 'version'),
      () => this.detectCustomTool('rustc', 'Rust', '--version'),
      () => this.detectCustomTool('ruby', 'Ruby', '--version'),
      () => this.detectCustomTool('dotnet', '.NET', '--version'),
      // Additional runtimes (Task 6, Requirement 5.1)
      () => this.detectCustomTool('deno', 'Deno', '--version'),
      () => this.detectCustomTool('bun', 'Bun', '--version'),
      () => this.detectCustomTool('perl', 'Perl', '--version'),
      () => this.detectCustomTool('lua', 'Lua', '-v'),

      // Package Managers
      () => this.detectNpm(),
      () => this.detectPip(),
      () => this.detectComposer(),
      () => this.detectCustomTool('yarn', 'Yarn', '--version'),
      () => this.detectCustomTool('pnpm', 'pnpm', '--version'),
      () => this.detectCustomTool('cargo', 'Cargo', '--version'),
      () => this.detectCustomTool('gem', 'RubyGems', '--version'),
      // System Package Managers (Task 7, Requirement 5.2)
      () => this.detectCustomTool('brew', 'Homebrew', '--version'),
      () => this.detectCustomTool('choco', 'Chocolatey', '--version'),
      () => this.detectCustomTool('scoop', 'Scoop', '--version'),
      () => this.detectCustomTool('winget', 'winget', '--version'),

      // Version Control & Dev Tools
      () => this.detectCustomTool('git', 'Git', '--version'),
      () => this.detectCustomTool('docker', 'Docker', '--version'),
      () => this.detectCustomTool('kubectl', 'Kubernetes CLI', 'version --client'),
      () => this.detectCustomTool('terraform', 'Terraform', '--version'),
      () => this.detectCustomTool('mvn', 'Maven', '-version'),

      // Cloud Tools (Task 8, Requirement 5.3)
      () => this.detectCustomTool('aws', 'AWS CLI', '--version'),
      () => this.detectCustomTool('az', 'Azure CLI', '--version'),
      () => this.detectCustomTool('gcloud', 'Google Cloud SDK', '--version'),
      () => this.detectCustomTool('helm', 'Helm', 'version'),
      () => this.detectCustomTool('ansible', 'Ansible', '--version'),

      // Version Managers (Task 9, Requirement 5.4)
      () => this.detectCustomTool('nvm', 'nvm', '--version'),
      () => this.detectCustomTool('pyenv', 'pyenv', '--version'),
      () => this.detectCustomTool('rbenv', 'rbenv', '--version'),
      () => this.detectCustomTool('sdk', 'SDKMAN', 'version'),
    ]

    // Run with controlled concurrency (3 at a time) to avoid system overload
    const concurrency = 3
    for (let i = 0; i < toolDetectors.length; i += concurrency) {
      const batch = toolDetectors.slice(i, i + concurrency)
      const batchResults = await Promise.all(batch.map(fn => fn().catch(() => null)))
      for (const result of batchResults) {
        if (result !== null) {
          results.push(result)
        }
      }
    }

    return results
  }

  /**
   * Detect all supported tools with detailed summary
   * 
   * Property 11: Partial Failure Resilience
   * Validates: Requirements 6.3, 6.4, 6.5
   * 
   * @returns Promise resolving to tools array and summary information
   */
  async detectAllToolsWithSummary(): Promise<{
    tools: ToolInfo[]
    summary: DetectionSummary
  }> {
    const startTime = Date.now()
    const errors: Array<{ toolName: string; errorReason: string }> = []

    // Get all tools with timing information
    const tools = await this.detectAllTools()

    // Calculate summary
    const successCount = tools.filter(t => t.isInstalled).length
    const failureCount = tools.filter(t => !t.isInstalled).length

    // Collect error information from tools that failed
    for (const tool of tools) {
      if (!tool.isInstalled && tool.errorReason) {
        errors.push({
          toolName: tool.name,
          errorReason: tool.errorReason,
        })
      }
    }

    const summary: DetectionSummary = {
      totalTools: tools.length,
      successCount,
      failureCount,
      totalTime: Date.now() - startTime,
      errors,
    }

    return { tools, summary }
  }
}

// Export a default instance
export const detectionEngine = new DetectionEngine()

