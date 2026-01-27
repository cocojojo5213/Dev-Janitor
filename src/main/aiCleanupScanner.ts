/**
 * AI Cleanup Scanner Module
 * 
 * Scans and cleans junk files created by AI coding assistants.
 * Supports: Claude, Cursor, Aider, Copilot, Windsurf, and other AI tools.
 * 
 * Common junk files include:
 * - nul/NUL files (Windows device name accidentally created)
 * - .aider* temporary files
 * - .claude_* cache files
 * - Files with invalid characters in names (created by AI bugs)
 */

import { promises as fs } from 'fs'
import * as path from 'path'
import * as os from 'os'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export interface AIJunkFile {
  id: string                    // Unique identifier
  name: string                  // File/folder name
  path: string                  // Full path
  size: number                  // Size in bytes
  sizeFormatted: string         // Human-readable size
  type: 'file' | 'directory'    // Type
  source: string                // Which AI tool likely created it
  description: string           // Description
  riskLevel: 'low' | 'medium'   // Risk level for deletion
  lastModified?: Date           // Last modification time
}

export interface AICleanupResult {
  id: string
  success: boolean
  freedSpace: number
  freedSpaceFormatted: string
  error?: string
}

export interface AICleanupScanResult {
  files: AIJunkFile[]
  totalSize: number
  totalSizeFormatted: string
  scanTime: number
  scannedPaths: string[]
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Get file/directory size
 */
async function getSize(itemPath: string): Promise<number> {
  try {
    const stats = await fs.stat(itemPath)
    if (stats.isFile()) {
      return stats.size
    }
    if (stats.isDirectory()) {
      let size = 0
      const entries = await fs.readdir(itemPath, { withFileTypes: true })
      for (const entry of entries) {
        size += await getSize(path.join(itemPath, entry.name))
      }
      return size
    }
  } catch {
    return 0
  }
  return 0
}

/**
 * AI junk file patterns to scan for
 */
interface JunkPattern {
  pattern: RegExp | string
  source: string
  description: string
  descriptionZh: string
  riskLevel: 'low' | 'medium'
  isExactMatch?: boolean
}

type JunkMatchInfo = Pick<JunkPattern, 'source' | 'description' | 'descriptionZh' | 'riskLevel'>

const AI_TOOL_KEYWORDS = [
  'aider',
  'claude',
  'cursor',
  'windsurf',
  'codeium',
  'copilot',
  'continue',
  'kiro',
  'openai',
  'anthropic',
  'tabnine',
  'codex',
  'gemini',
]
const AI_TOOL_KEYWORD_SET = new Set(AI_TOOL_KEYWORDS)

const AI_TOOL_SOURCE_MAP: Record<string, string> = {
  aider: 'Aider',
  claude: 'Claude',
  cursor: 'Cursor',
  windsurf: 'Codeium/Windsurf',
  codeium: 'Codeium/Windsurf',
  copilot: 'GitHub Copilot',
  continue: 'Continue',
  kiro: 'Kiro',
  anthropic: 'Claude',
}

const AI_TEMP_EXTENSION_PATTERN = /\.(tmp|temp|bak|backup|old|orig|swp|swo|swpx)$/i
const AI_TEMP_NAME_PATTERN = /(?:^|[._-])(tmp|temp|cache|draft|backup|bak|old|orig|swap|swp|swo|swpx)(?:$|[._-])/i
const STALE_FILE_AGE_MS = 7 * 24 * 60 * 60 * 1000
const TINY_FILE_SIZE_BYTES = 1024

// Characters that are invalid or very unusual in filenames
// These are often created by AI tools due to bugs
const SUSPICIOUS_FILENAME_CHARS = /[`{}[\]<>|]/
const INVISIBLE_FILENAME_CHARS = /[\u200B-\u200D\uFEFF]/
const UNUSUAL_FILENAME_CHARS = /[^a-zA-Z0-9._-]/
const ZERO_BYTE_SHORT_NAME_MAX_LENGTH = 3
const FULL_DISK_SCAN_DEPTH = 6
const CUSTOM_PATH_SCAN_DEPTH = 8

const WINDOWS_RESERVED_DEVICE_NAMES = new Set([
  'con',
  'prn',
  'aux',
  'nul',
  'com1',
  'com2',
  'com3',
  'com4',
  'com5',
  'com6',
  'com7',
  'com8',
  'com9',
  'lpt1',
  'lpt2',
  'lpt3',
  'lpt4',
  'lpt5',
  'lpt6',
  'lpt7',
  'lpt8',
  'lpt9',
])

// Pattern for files that look like AI-generated garbage
// Must have NO extension and contain unusual characters
const AI_GARBAGE_PATTERN = /^[^.]+$/  // No extension

const JUNK_PATTERNS: JunkPattern[] = [
  // Aider specific files (in project directories, not config)
  {
    pattern: /^\.aider\.(tags|chat|history|input).*$/,
    source: 'Aider',
    description: 'Aider session/history files - usually safe to delete after session ends',
    descriptionZh: 'Aider 会话/历史文件 - 会话结束后通常可安全删除',
    riskLevel: 'low',
  },
  // Claude Code specific backup files
  {
    pattern: /^\.claude\.json\.backup$/,
    source: 'Claude',
    description: 'Claude Code backup file - safe to delete if main config exists',
    descriptionZh: 'Claude Code 备份文件 - 如主配置存在则可安全删除',
    riskLevel: 'low',
  },
  // AI tool temp/draft files with specific naming patterns
  {
    pattern: /^(ai_temp_|_ai_draft_|\.ai_tmp_)/i,
    source: 'AI Tool',
    description: 'AI temporary working files - safe to delete',
    descriptionZh: 'AI 临时工作文件 - 可安全删除',
    riskLevel: 'low',
  },
]

// Known safe file extensions that should never be flagged
const SAFE_EXTENSIONS = new Set([
  // Audio
  '.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma',
  // Video
  '.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm',
  // Images
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.ico', '.webp', '.tiff',
  // Documents
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf',
  // Archives
  '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2',
  // Code
  '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.cs',
  '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala', '.vue', '.svelte',
  // Config
  '.json', '.yaml', '.yml', '.xml', '.toml', '.ini', '.env', '.config',
  // Web
  '.html', '.htm', '.css', '.scss', '.sass', '.less',
  // Data
  '.csv', '.sql', '.db', '.sqlite',
  // Other common
  '.md', '.markdown', '.log', '.lock', '.map', '.d.ts',
])

// Known safe filenames without extensions
const SAFE_FILENAMES = new Set([
  'README', 'LICENSE', 'CHANGELOG', 'CONTRIBUTING', 'AUTHORS', 'HISTORY',
  'Makefile', 'Dockerfile', 'Vagrantfile', 'Gemfile', 'Rakefile', 'Procfile',
  'CODEOWNERS', 'SECURITY', 'FUNDING', 'SUPPORT',
  '.gitignore', '.gitattributes', '.gitmodules', '.gitkeep',
  '.npmignore', '.npmrc', '.nvmrc', '.node-version',
  '.editorconfig', '.prettierrc', '.eslintrc', '.babelrc',
  '.dockerignore', '.env', '.env.local', '.env.example',
])

const QUICK_SKIP_DIRS = [
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'vendor',
  '__pycache__',
  'venv',
  '.venv',
  'dist',
  'build',
  'target',
  '.next',
  '.nuxt',
  '.cache',
  '.local',
  '.npm',
  '.pnpm-store',
  '.pnpm',
  '.yarn',
  '.cargo',
  '.rustup',
  '.gradle',
  '.m2',
  'AppData',
  'Library',
]

const DEEP_SKIP_DIRS = [
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'vendor',
  '__pycache__',
  'venv',
  '.venv',
  'dist',
  'build',
  'target',
  '.next',
  '.nuxt',
]

const WINDOWS_ROOT_SKIP_DIRS = [
  'Windows',
  'Program Files',
  'Program Files (x86)',
  'ProgramData',
  '$Recycle.Bin',
  'System Volume Information',
  'Recovery',
]

const MAC_ROOT_SKIP_DIRS = [
  'System',
  'Applications',
  'Library',
  'private',
  'bin',
  'sbin',
  'usr',
  'etc',
  'var',
]

const LINUX_ROOT_SKIP_DIRS = [
  'bin',
  'sbin',
  'usr',
  'lib',
  'lib64',
  'etc',
  'var',
  'proc',
  'sys',
  'dev',
  'run',
  'boot',
  'opt',
]

interface ScanOptions {
  inspectAllFiles: boolean
  skipDirs: Set<string>
  skipRootDirs?: Set<string>
}

function createSkipDirSet(dirs: string[]): Set<string> {
  if (process.platform === 'win32') {
    return new Set(dirs.map(dir => dir.toLowerCase()))
  }
  return new Set(dirs)
}

function normalizeSkipName(name: string): string {
  return process.platform === 'win32' ? name.toLowerCase() : name
}

function shouldSkipDir(name: string, scanOptions: ScanOptions, currentDepth: number): boolean {
  const normalized = normalizeSkipName(name)
  if (currentDepth === 0 && scanOptions.skipRootDirs?.has(normalized)) {
    return true
  }
  return scanOptions.skipDirs.has(normalized)
}

const QUICK_SCAN_OPTIONS: ScanOptions = {
  inspectAllFiles: false,
  skipDirs: createSkipDirSet(QUICK_SKIP_DIRS),
}

const CUSTOM_PATH_SCAN_OPTIONS: ScanOptions = {
  inspectAllFiles: true,
  skipDirs: createSkipDirSet(DEEP_SKIP_DIRS),
}

const FULL_DISK_SCAN_OPTIONS: ScanOptions = {
  inspectAllFiles: true,
  skipDirs: createSkipDirSet(DEEP_SKIP_DIRS),
  skipRootDirs: createSkipDirSet(
    process.platform === 'win32'
      ? WINDOWS_ROOT_SKIP_DIRS
      : process.platform === 'darwin'
        ? MAC_ROOT_SKIP_DIRS
        : LINUX_ROOT_SKIP_DIRS
  ),
}

function extractAiToolKeywordFromName(value: string): string | null {
  const lowerValue = value.toLowerCase()
  for (const keyword of AI_TOOL_KEYWORDS) {
    if (lowerValue.includes(keyword)) {
      return keyword
    }
  }
  return null
}

function extractAiToolKeywordFromDirName(dirName: string): string | null {
  const normalized = dirName.toLowerCase()
  const cleaned = normalized.startsWith('.') ? normalized.slice(1) : normalized
  if (AI_TOOL_KEYWORD_SET.has(cleaned)) {
    return cleaned
  }
  return null
}

function getAiToolSource(keyword: string | null): string {
  if (!keyword) return 'AI Tool'
  return AI_TOOL_SOURCE_MAP[keyword] || 'AI Tool'
}

function isAiTempFileName(fileName: string): boolean {
  return AI_TEMP_EXTENSION_PATTERN.test(fileName) || AI_TEMP_NAME_PATTERN.test(fileName)
}

function isStaleFile(stats: { mtimeMs: number }): boolean {
  return Date.now() - stats.mtimeMs > STALE_FILE_AGE_MS
}

function getWindowsReservedNameInfo(fileName: string): JunkMatchInfo | null {
  if (process.platform !== 'win32') return null
  const trimmedName = fileName.replace(/[. ]+$/g, '')
  const baseName = trimmedName.split('.')[0]
  if (!baseName) return null
  if (!WINDOWS_RESERVED_DEVICE_NAMES.has(baseName.toLowerCase())) {
    return null
  }
  return {
    source: 'AI Tool Bug',
    description: 'Windows reserved device name accidentally created as file - safe to delete',
    descriptionZh: 'Windows 保留设备名被意外创建为文件 - 可安全删除',
    riskLevel: 'low',
  }
}

/**
 * Check if a file is likely AI-generated junk based on its characteristics
 */
async function isLikelyAIJunk(
  filePath: string,
  fileName: string,
  aiToolHint: string | null = null
): Promise<{
  isJunk: boolean
  source: string
  description: string
  descriptionZh: string
  riskLevel: 'low' | 'medium'
} | null> {
  // Get file extension
  const ext = path.extname(fileName).toLowerCase()
  const isDotFile = fileName.startsWith('.')
  const aiKeyword = extractAiToolKeywordFromName(fileName) ?? aiToolHint
  const isAiTempCandidate = Boolean(aiKeyword) && isAiTempFileName(fileName)
  
  // Skip files with known safe extensions unless AI temp candidate
  if (!isAiTempCandidate && ext && SAFE_EXTENSIONS.has(ext)) {
    return null
  }
  
  // Skip known safe filenames unless AI temp candidate
  if (!isAiTempCandidate &&
      (SAFE_FILENAMES.has(fileName) || SAFE_FILENAMES.has(fileName.toLowerCase()))) {
    return null
  }

  if (isAiTempCandidate) {
    try {
      const stats = await fs.stat(filePath)
      if (stats.size === 0 || isStaleFile(stats)) {
        return {
          isJunk: true,
          source: getAiToolSource(aiKeyword),
          description: 'AI temp/cache file (stale or empty) detected by name - safe to delete',
          descriptionZh: '检测到 AI 临时/缓存文件（已过期或为空）- 可安全删除',
          riskLevel: 'low',
        }
      }
    } catch {
      return null
    }
  }

  if (!ext && !isDotFile) {
    try {
      const stats = await fs.stat(filePath)
      const hasUnusualChars = UNUSUAL_FILENAME_CHARS.test(fileName)
      const isShortName = fileName.length <= ZERO_BYTE_SHORT_NAME_MAX_LENGTH
      if (stats.size === 0 && (isShortName || hasUnusualChars)) {
        return {
          isJunk: true,
          source: aiKeyword ? getAiToolSource(aiKeyword) : 'AI Tool Bug',
          description: 'Empty no-extension file with short or unusual name - likely AI-generated junk',
          descriptionZh: '无扩展名的空文件（名称很短或异常）- 可能是 AI 生成的垃圾文件',
          riskLevel: 'medium',
        }
      }
    } catch {
      return null
    }
  }
  
  // Check if filename contains invalid/unusual characters
  const hasSuspiciousChars = SUSPICIOUS_FILENAME_CHARS.test(fileName) || INVISIBLE_FILENAME_CHARS.test(fileName)
  if (hasSuspiciousChars) {
    // Verify it's a small file (AI junk is usually tiny)
    try {
      const stats = await fs.stat(filePath)
      if (stats.size < TINY_FILE_SIZE_BYTES) { // Less than 1KB
        return {
          isJunk: true,
          source: aiKeyword ? getAiToolSource(aiKeyword) : 'AI Tool Bug',
          description: 'File with invalid characters in name - likely AI-generated junk',
          descriptionZh: '文件名包含无效字符 - 可能是 AI 生成的垃圾文件',
          riskLevel: 'medium',
        }
      }
    } catch {
      return null
    }
  }
  
  // Check for files without extension that have unusual names
  if (!ext && AI_GARBAGE_PATTERN.test(fileName)) {
    // Must be very short name (1-4 chars) with unusual characters
    if (fileName.length <= 4 && UNUSUAL_FILENAME_CHARS.test(fileName)) {
      try {
        const stats = await fs.stat(filePath)
        // Must be tiny file
        if (stats.size < 100) {
          return {
            isJunk: true,
            source: 'AI Tool Bug',
            description: 'Tiny file with unusual name - likely AI-generated junk',
            descriptionZh: '异常命名的小文件 - 可能是 AI 生成的垃圾文件',
            riskLevel: 'medium',
          }
        }
      } catch {
        return null
      }
    }
  }
  
  return null
}

function isPermissionError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | undefined)?.code
  return code === 'EPERM' || code === 'EACCES'
}

function formatDeleteError(
  error: unknown,
  language: 'en-US' | 'zh-CN'
): string {
  const code = (error as NodeJS.ErrnoException | undefined)?.code
  if (code === 'EPERM' || code === 'EACCES') {
    const baseMessage = language === 'zh-CN'
      ? '权限不足，无法删除。请以管理员身份运行或先获取文件/目录权限。'
      : 'Permission denied. Run Dev Janitor as administrator or take ownership of the file or folder.'
    return code ? `${baseMessage} (${code})` : baseMessage
  }
  return error instanceof Error ? error.message : 'Unknown error'
}

async function tryMakeWritable(itemPath: string, isDirectory: boolean): Promise<void> {
  try {
    await fs.chmod(itemPath, isDirectory ? 0o777 : 0o666)
  } catch {
    // Ignore chmod failures and fall back to original error handling.
  }
}

/**
 * Check if a directory is a code project (has markers like .git, package.json, etc.)
 */
async function isCodeProject(dirPath: string): Promise<boolean> {
  const markers = [
    '.git',
    'package.json',
    'Cargo.toml',
    'go.mod',
    'pom.xml',
    'build.gradle',
    'requirements.txt',
    'setup.py',
    'pyproject.toml',
    'composer.json',
    'Gemfile',
    '.project',
    'CMakeLists.txt',
  ]
  
  for (const marker of markers) {
    try {
      await fs.access(path.join(dirPath, marker))
      return true
    } catch {
      // Continue checking
    }
  }
  
  return false
}

/**
 * Common directories to scan with depth configuration
 */
interface ScanTarget {
  path: string
  maxDepth: number
}

const HOME_SCAN_DEPTH = 1
const PROJECT_SCAN_DEPTH = 4
const AI_CONFIG_SCAN_DEPTH = 4

function getAiToolDirectories(homeDir: string): string[] {
  const baseNames = [
    'Aider',
    'Claude',
    'Cursor',
    'Windsurf',
    'Codeium',
    'Copilot',
    'Continue',
    'Kiro',
    'OpenAI',
    'Anthropic',
  ]
  const lowerNames = baseNames.map(name => name.toLowerCase())
  const names = Array.from(new Set([...baseNames, ...lowerNames]))

  const dirs: string[] = []
  for (const name of lowerNames) {
    dirs.push(path.join(homeDir, `.${name}`))
  }

  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming')
    const localAppData = process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local')
    for (const name of names) {
      dirs.push(path.join(appData, name))
      dirs.push(path.join(localAppData, name))
    }
  } else if (process.platform === 'darwin') {
    const appSupport = path.join(homeDir, 'Library', 'Application Support')
    const caches = path.join(homeDir, 'Library', 'Caches')
    for (const name of names) {
      dirs.push(path.join(appSupport, name))
      dirs.push(path.join(caches, name))
    }
  } else {
    const configDir = path.join(homeDir, '.config')
    const cacheDir = path.join(homeDir, '.cache')
    const shareDir = path.join(homeDir, '.local', 'share')
    for (const name of lowerNames) {
      dirs.push(path.join(configDir, name))
      dirs.push(path.join(cacheDir, name))
      dirs.push(path.join(shareDir, name))
    }
  }

  return dirs
}

function mergeScanTargets(targets: ScanTarget[]): ScanTarget[] {
  const merged = new Map<string, ScanTarget>()
  for (const target of targets) {
    const resolvedPath = path.resolve(target.path)
    const existing = merged.get(resolvedPath)
    if (!existing || target.maxDepth > existing.maxDepth) {
      merged.set(resolvedPath, { path: resolvedPath, maxDepth: target.maxDepth })
    }
  }
  return Array.from(merged.values())
}

function getScanTargets(): ScanTarget[] {
  const homeDir = os.homedir()
  const targets: ScanTarget[] = []
  
  // User home directory (shallow scan)
  targets.push({ path: homeDir, maxDepth: HOME_SCAN_DEPTH })
  
  // Common project directories
  const projectDirs = [
    'Desktop',
    'Documents',
    'Downloads',
    'Projects',
    'projects',
    'dev',
    'Development',
    'workspace',
    'Work',
    'work',
    'code',
    'Code',
    'src',
    'Source',
    'repos',
    'git',
  ]
  
  for (const dir of projectDirs) {
    targets.push({ path: path.join(homeDir, dir), maxDepth: PROJECT_SCAN_DEPTH })
  }

  // AI tool config/cache directories
  for (const dir of getAiToolDirectories(homeDir)) {
    targets.push({ path: dir, maxDepth: AI_CONFIG_SCAN_DEPTH })
  }
  
  return mergeScanTargets(targets)
}

function extractWindowsDeviceIdFromPath(targetPath: string): string | null {
  const root = path.parse(targetPath).root
  const match = root.match(/^([a-zA-Z]:)/)
  return match ? match[1].toUpperCase() : null
}

function toWindowsDriveRoot(deviceId: string | null | undefined): string | null {
  if (!deviceId) return null
  const trimmed = deviceId.trim()
  if (!/^[a-zA-Z]:$/.test(trimmed)) return null
  return `${trimmed.toUpperCase()}\\`
}

async function getWindowsFixedDriveRoots(): Promise<string[]> {
  const drives = new Set<string>()
  const addDrive = (deviceId: string | null | undefined): void => {
    const root = toWindowsDriveRoot(deviceId)
    if (root) drives.add(root)
  }

  addDrive(process.env.SystemDrive)
  addDrive(extractWindowsDeviceIdFromPath(os.homedir()))

  try {
    const psCommand =
      'Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | Select-Object -ExpandProperty DeviceID'
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-Command', psCommand],
      { timeout: 8000 }
    )

    stdout
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean)
      .forEach(line => addDrive(line))
  } catch (error) {
    console.warn('Failed to enumerate fixed drives, falling back to home drive:', error)
  }

  if (drives.size === 0) {
    addDrive(extractWindowsDeviceIdFromPath(os.homedir()))
  }

  return Array.from(drives)
}

async function getFullDiskTargets(): Promise<ScanTarget[]> {
  if (process.platform === 'win32') {
    const driveRoots = await getWindowsFixedDriveRoots()
    const driveTargets = driveRoots.map(driveRoot => ({
      path: driveRoot,
      maxDepth: FULL_DISK_SCAN_DEPTH,
    }))
    return mergeScanTargets(driveTargets)
  }

  const rootPath = path.parse(os.homedir()).root || '/'
  return mergeScanTargets([{ path: rootPath, maxDepth: FULL_DISK_SCAN_DEPTH }])
}

class AICleanupScanner {
  private language: 'en-US' | 'zh-CN' = 'en-US'

  setLanguage(lang: 'en-US' | 'zh-CN'): void {
    this.language = lang
  }

  /**
   * Check if a file/folder matches any junk pattern
   */
  private matchesPattern(name: string): JunkPattern | null {
    for (const pattern of JUNK_PATTERNS) {
      if (pattern.isExactMatch) {
        if (typeof pattern.pattern === 'string') {
          if (name === pattern.pattern) return pattern
        } else if (pattern.pattern.test(name)) {
          return pattern
        }
      } else {
        if (typeof pattern.pattern === 'string') {
          if (name.includes(pattern.pattern)) return pattern
        } else if (pattern.pattern.test(name)) {
          return pattern
        }
      }
    }
    return null
  }

  /**
   * Scan a directory for AI junk files
   */
  private async scanDirectory(
    dirPath: string,
    maxDepth: number = 2,
    currentDepth: number = 0,
    isInCodeProject: boolean = false,
    aiToolHint: string | null = null,
    scanOptions: ScanOptions = QUICK_SCAN_OPTIONS
  ): Promise<AIJunkFile[]> {
    const results: AIJunkFile[] = []
    
    if (currentDepth > maxDepth) return results
    
    try {
      // Check if this directory is a code project
      const dirName = path.basename(dirPath)
      const dirKeyword = extractAiToolKeywordFromDirName(dirName)
      const isDotDir = dirName.startsWith('.')
      let isProject = isInCodeProject

      if (!isProject) {
        if (!scanOptions.inspectAllFiles) {
          isProject = await isCodeProject(dirPath)
        } else if (dirKeyword && !isDotDir) {
          isProject = await isCodeProject(dirPath)
        }
      }

      const useDirKeyword = !isProject || isDotDir
      const currentAiToolHint = useDirKeyword ? (dirKeyword ?? aiToolHint) : aiToolHint
      const isAiToolDir = currentAiToolHint !== null
      const shouldInspectFiles = scanOptions.inspectAllFiles || isProject || isAiToolDir
      
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        
        const reservedMatch = getWindowsReservedNameInfo(entry.name)
        if (reservedMatch) {
          try {
            const stats = await fs.stat(fullPath)
            const size = entry.isDirectory() ? await getSize(fullPath) : stats.size
            
            results.push({
              id: Buffer.from(fullPath).toString('base64'),
              name: entry.name,
              path: fullPath,
              size,
              sizeFormatted: formatBytes(size),
              type: entry.isDirectory() ? 'directory' : 'file',
              source: reservedMatch.source,
              description: this.language === 'zh-CN' ? reservedMatch.descriptionZh : reservedMatch.description,
              riskLevel: reservedMatch.riskLevel,
              lastModified: stats.mtime,
            })
          } catch {
            // Skip inaccessible files
          }
          continue
        }

        // First check against known patterns
        const pattern = this.matchesPattern(entry.name)
        
        if (pattern) {
          try {
            const stats = await fs.stat(fullPath)
            const size = entry.isDirectory() ? await getSize(fullPath) : stats.size
            
            results.push({
              id: Buffer.from(fullPath).toString('base64'),
              name: entry.name,
              path: fullPath,
              size,
              sizeFormatted: formatBytes(size),
              type: entry.isDirectory() ? 'directory' : 'file',
              source: pattern.source,
              description: this.language === 'zh-CN' ? pattern.descriptionZh : pattern.description,
              riskLevel: pattern.riskLevel,
              lastModified: stats.mtime,
            })
          } catch {
            // Skip inaccessible files
          }
        } else if (entry.isFile() && shouldInspectFiles) {
          // Check for AI junk in code projects and AI tool directories
          const junkInfo = await isLikelyAIJunk(fullPath, entry.name, currentAiToolHint)
          if (junkInfo) {
            try {
              const stats = await fs.stat(fullPath)
              results.push({
                id: Buffer.from(fullPath).toString('base64'),
                name: entry.name,
                path: fullPath,
                size: stats.size,
                sizeFormatted: formatBytes(stats.size),
                type: 'file',
                source: junkInfo.source,
                description: this.language === 'zh-CN' ? junkInfo.descriptionZh : junkInfo.description,
                riskLevel: junkInfo.riskLevel,
                lastModified: stats.mtime,
              })
            } catch {
              // Skip inaccessible files
            }
          }
        }
        
        // Recursively scan subdirectories (but skip node_modules, .git, etc.)
        if (entry.isDirectory() && currentDepth < maxDepth) {
          if (!shouldSkipDir(entry.name, scanOptions, currentDepth)) {
            const subResults = await this.scanDirectory(
              fullPath,
              maxDepth,
              currentDepth + 1,
              isProject,
              currentAiToolHint,
              scanOptions
            )
            results.push(...subResults)
          }
        }
      }
    } catch {
      // Directory not accessible, skip
    }
    
    return results
  }

  /**
   * Scan all common directories for AI junk files
   */
  async scanAll(): Promise<AICleanupScanResult> {
    const startTime = Date.now()
    const scanTargets = getScanTargets()
    const allFiles: AIJunkFile[] = []
    const scannedPaths: string[] = []
    
    for (const target of scanTargets) {
      try {
        await fs.access(target.path)
        scannedPaths.push(target.path)
        const files = await this.scanDirectory(
          target.path,
          target.maxDepth,
          0,
          false,
          null,
          QUICK_SCAN_OPTIONS
        )
        allFiles.push(...files)
      } catch {
        // Directory doesn't exist or not accessible
      }
    }
    
    // Remove duplicates by path
    const uniqueFiles = Array.from(
      new Map(allFiles.map(f => [f.path, f])).values()
    )
    
    // Sort by size descending
    uniqueFiles.sort((a, b) => b.size - a.size)
    
    const totalSize = uniqueFiles.reduce((sum, f) => sum + f.size, 0)
    
    return {
      files: uniqueFiles,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      scanTime: Date.now() - startTime,
      scannedPaths,
    }
  }

  /**
   * Scan all disks for AI junk files (deep scan)
   */
  async scanFullDisk(): Promise<AICleanupScanResult> {
    const startTime = Date.now()
    const scanTargets = await getFullDiskTargets()
    const allFiles: AIJunkFile[] = []
    const scannedPaths: string[] = []

    for (const target of scanTargets) {
      try {
        await fs.access(target.path)
        scannedPaths.push(target.path)
        const files = await this.scanDirectory(
          target.path,
          target.maxDepth,
          0,
          false,
          null,
          FULL_DISK_SCAN_OPTIONS
        )
        allFiles.push(...files)
      } catch {
        // Drive not accessible
      }
    }

    const uniqueFiles = Array.from(
      new Map(allFiles.map(f => [f.path, f])).values()
    )

    uniqueFiles.sort((a, b) => b.size - a.size)

    const totalSize = uniqueFiles.reduce((sum, f) => sum + f.size, 0)

    return {
      files: uniqueFiles,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      scanTime: Date.now() - startTime,
      scannedPaths,
    }
  }

  /**
   * Scan a specific directory
   */
  async scanPath(targetPath: string): Promise<AICleanupScanResult> {
    const startTime = Date.now()
    
    try {
      await fs.access(targetPath)
      const files = await this.scanDirectory(
        targetPath,
        CUSTOM_PATH_SCAN_DEPTH,
        0,
        false,
        null,
        CUSTOM_PATH_SCAN_OPTIONS
      )
      
      // Sort by size descending
      files.sort((a, b) => b.size - a.size)
      
      const totalSize = files.reduce((sum, f) => sum + f.size, 0)
      
      return {
        files,
        totalSize,
        totalSizeFormatted: formatBytes(totalSize),
        scanTime: Date.now() - startTime,
        scannedPaths: [targetPath],
      }
    } catch {
      return {
        files: [],
        totalSize: 0,
        totalSizeFormatted: '0 B',
        scanTime: Date.now() - startTime,
        scannedPaths: [],
      }
    }
  }

  /**
   * Delete a single junk file/directory
   */
  async deleteItem(itemId: string): Promise<AICleanupResult> {
    try {
      const itemPath = Buffer.from(itemId, 'base64').toString('utf-8')
      
      // Get size before deletion
      const sizeBefore = await getSize(itemPath)
      
      // Delete the item
      const stats = await fs.stat(itemPath)
      const removeItem = async () => {
        if (stats.isDirectory()) {
          await fs.rm(itemPath, { recursive: true, force: true })
        } else {
          await fs.unlink(itemPath)
        }
      }

      try {
        await removeItem()
      } catch (error) {
        if (isPermissionError(error)) {
          await tryMakeWritable(itemPath, stats.isDirectory())
          await removeItem()
        } else {
          throw error
        }
      }
      
      return {
        id: itemId,
        success: true,
        freedSpace: sizeBefore,
        freedSpaceFormatted: formatBytes(sizeBefore),
      }
    } catch (error) {
      return {
        id: itemId,
        success: false,
        freedSpace: 0,
        freedSpaceFormatted: '0 B',
        error: formatDeleteError(error, this.language),
      }
    }
  }

  /**
   * Delete multiple junk files/directories
   */
  async deleteMultiple(itemIds: string[]): Promise<AICleanupResult[]> {
    const results: AICleanupResult[] = []
    
    for (const id of itemIds) {
      const result = await this.deleteItem(id)
      results.push(result)
    }
    
    return results
  }
}

export const aiCleanupScanner = new AICleanupScanner()
export default aiCleanupScanner
