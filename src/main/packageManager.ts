/**
 * Package Manager Module
 * 
 * Provides functionality to list and manage packages from:
 * - npm (global packages)
 * - pip (Python packages)
 * - composer (PHP packages)
 * 
 * Validates: Requirements 3.1, 3.2, 4.1, 4.2
 */

import { PackageInfo } from '../shared/types'
import { executeSafe, isWindows } from './commandExecutor'

/**
 * npm package list JSON structure
 */
interface NpmListOutput {
  dependencies?: {
    [key: string]: {
      version: string
      resolved?: string
    }
  }
}

/**
 * pip package list JSON structure
 */
interface PipPackage {
  name: string
  version: string
}

/**
 * composer package structure
 */
interface ComposerPackage {
  name: string
  version: string
  description?: string
  homepage?: string
}

/**
 * Parse npm list JSON output
 * 
 * Property 6: Package List Parsing
 * @param output The JSON output from npm list
 * @returns Array of PackageInfo
 */
export function parseNpmOutput(output: string): PackageInfo[] {
  const packages: PackageInfo[] = []
  
  if (!output || typeof output !== 'string') {
    return packages
  }
  
  try {
    const data: NpmListOutput = JSON.parse(output)
    
    if (data.dependencies) {
      for (const [name, info] of Object.entries(data.dependencies)) {
        packages.push({
          name,
          version: info.version || 'unknown',
          location: 'global',
          manager: 'npm',
        })
      }
    }
  } catch {
    // JSON parsing failed, try to extract info from text output
    // npm list output format: "├── package@version"
    const lines = output.split('\n')
    const packageRegex = /[├└]── (.+)@(.+)/
    
    for (const line of lines) {
      const match = line.match(packageRegex)
      if (match) {
        packages.push({
          name: match[1],
          version: match[2],
          location: 'global',
          manager: 'npm',
        })
      }
    }
  }
  
  return packages
}

/**
 * Parse pip list JSON output
 * 
 * Property 6: Package List Parsing
 * @param output The JSON output from pip list
 * @returns Array of PackageInfo
 */
export function parsePipOutput(output: string): PackageInfo[] {
  const packages: PackageInfo[] = []
  
  if (!output || typeof output !== 'string') {
    return packages
  }
  
  try {
    const data: PipPackage[] = JSON.parse(output)
    
    for (const pkg of data) {
      packages.push({
        name: pkg.name,
        version: pkg.version,
        location: 'site-packages',
        manager: 'pip',
      })
    }
  } catch {
    // JSON parsing failed, try to extract from text output
    // pip list output format: "package    version"
    const lines = output.split('\n')
    
    // Skip header lines
    let startIndex = 0
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('---')) {
        startIndex = i + 1
        break
      }
    }
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const parts = line.split(/\s+/)
      if (parts.length >= 2) {
        packages.push({
          name: parts[0],
          version: parts[1],
          location: 'site-packages',
          manager: 'pip',
        })
      }
    }
  }
  
  return packages
}

/**
 * Parse composer global show output
 * 
 * Property 6: Package List Parsing
 * @param output The output from composer global show
 * @returns Array of PackageInfo
 */
export function parseComposerOutput(output: string): PackageInfo[] {
  const packages: PackageInfo[] = []
  
  if (!output || typeof output !== 'string') {
    return packages
  }
  
  try {
    // Try JSON format first
    const data = JSON.parse(output)
    
    if (Array.isArray(data)) {
      for (const pkg of data as ComposerPackage[]) {
        packages.push({
          name: pkg.name,
          version: pkg.version,
          location: 'global',
          manager: 'composer',
          description: pkg.description,
          homepage: pkg.homepage,
        })
      }
    } else if (data.installed) {
      // Alternative JSON structure
      for (const pkg of data.installed as ComposerPackage[]) {
        packages.push({
          name: pkg.name,
          version: pkg.version,
          location: 'global',
          manager: 'composer',
          description: pkg.description,
          homepage: pkg.homepage,
        })
      }
    }
  } catch {
    // JSON parsing failed, try text format
    // composer global show output: "vendor/package version description"
    const lines = output.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      
      // Match pattern: vendor/package vX.Y.Z description
      const match = trimmed.match(/^([\w-]+\/[\w-]+)\s+(v?[\d.]+(?:-[\w.]+)?)\s*(.*)$/)
      if (match) {
        packages.push({
          name: match[1],
          version: match[2],
          location: 'global',
          manager: 'composer',
          description: match[3] || undefined,
        })
      }
    }
  }
  
  return packages
}


/**
 * List globally installed npm packages
 * 
 * Property 5: Package Information Completeness
 * Validates: Requirements 3.1, 3.2
 * @returns Promise resolving to array of PackageInfo
 */
export async function listNpmPackages(): Promise<PackageInfo[]> {
  const result = await executeSafe('npm list -g --depth=0 --json')
  
  if (!result.success && !result.stdout) {
    return []
  }
  
  // npm may return non-zero exit code but still have valid output
  return parseNpmOutput(result.stdout)
}

/**
 * List installed pip packages
 * 
 * Property 5: Package Information Completeness
 * Validates: Requirements 4.1, 4.2
 * @returns Promise resolving to array of PackageInfo
 */
export async function listPipPackages(): Promise<PackageInfo[]> {
  // Try different pip commands based on platform
  // Windows: pip, pip3, py -m pip
  // Unix: pip3, pip
  const commands = isWindows()
    ? ['pip list --format=json', 'pip3 list --format=json', 'py -m pip list --format=json']
    : ['pip3 list --format=json', 'pip list --format=json']
  
  for (const cmd of commands) {
    const result = await executeSafe(cmd)
    if (result.success && result.stdout) {
      return parsePipOutput(result.stdout)
    }
  }
  
  return []
}

/**
 * List globally installed composer packages
 * 
 * Property 5: Package Information Completeness
 * @returns Promise resolving to array of PackageInfo
 */
export async function listComposerPackages(): Promise<PackageInfo[]> {
  const result = await executeSafe('composer global show --format=json')
  
  if (!result.success && !result.stdout) {
    // Try without --format=json for older versions
    const textResult = await executeSafe('composer global show')
    if (textResult.success && textResult.stdout) {
      return parseComposerOutput(textResult.stdout)
    }
    return []
  }
  
  return parseComposerOutput(result.stdout)
}

/**
 * List installed cargo packages
 * 
 * @returns Promise resolving to array of PackageInfo
 */
export async function listCargoPackages(): Promise<PackageInfo[]> {
  const result = await executeSafe('cargo install --list')
  
  if (!result.success || !result.stdout) {
    return []
  }
  
  const packages: PackageInfo[] = []
  const lines = result.stdout.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith(' ')) continue
    
    // Format: "package-name v1.2.3:"
    const match = trimmed.match(/^(.+?)\s+v?([\d.]+):?/)
    if (match) {
      packages.push({
        name: match[1],
        version: match[2],
        location: 'cargo',
        manager: 'cargo'
      })
    }
  }
  
  return packages
}

/**
 * List installed gem packages
 * 
 * @returns Promise resolving to array of PackageInfo
 */
export async function listGemPackages(): Promise<PackageInfo[]> {
  const result = await executeSafe('gem list --local')
  
  if (!result.success || !result.stdout) {
    return []
  }
  
  const packages: PackageInfo[] = []
  const lines = result.stdout.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    
    // Format: "package-name (1.2.3, 1.2.2)"
    const match = trimmed.match(/^(.+?)\s+\(([\d.]+)/)
    if (match) {
      packages.push({
        name: match[1],
        version: match[2],
        location: 'gem',
        manager: 'gem'
      })
    }
  }
  
  return packages
}

/**
 * Uninstall a package using the appropriate package manager
 * 
 * @param packageName The name of the package to uninstall
 * @param manager The package manager to use
 * @returns Promise resolving to true if successful
 */
export async function uninstallPackage(
  packageName: string,
  manager: 'npm' | 'pip' | 'composer' | 'cargo' | 'gem'
): Promise<boolean> {
  let command: string
  
  switch (manager) {
    case 'npm':
      command = `npm uninstall -g ${packageName}`
      break
    case 'pip':
      // Use -y to auto-confirm, try py -m pip on Windows first
      if (isWindows()) {
        const pyResult = await executeSafe(`py -m pip uninstall -y ${packageName}`)
        if (pyResult.success) return true
      }
      command = `pip uninstall -y ${packageName}`
      break
    case 'composer':
      command = `composer global remove ${packageName}`
      break
    case 'cargo':
      command = `cargo uninstall ${packageName}`
      break
    case 'gem':
      command = `gem uninstall ${packageName} -x`
      break
    default:
      return false
  }
  
  const result = await executeSafe(command)
  return result.success
}

/**
 * Update a package to the latest version using the appropriate package manager
 * 
 * @param packageName The name of the package to update
 * @param manager The package manager to use
 * @returns Promise resolving to object with success status and new version
 */
export async function updatePackage(
  packageName: string,
  manager: 'npm' | 'pip'
): Promise<{ success: boolean; newVersion?: string; error?: string }> {
  let command: string
  
  switch (manager) {
    case 'npm':
      command = `npm update -g ${packageName}`
      break
    case 'pip':
      // Try py -m pip on Windows first
      if (isWindows()) {
        const pyResult = await executeSafe(`py -m pip install --upgrade ${packageName}`)
        if (pyResult.success) {
          // Get the new version after update
          const versionResult = await executeSafe(`py -m pip show ${packageName}`)
          const versionMatch = versionResult.stdout.match(/Version:\s*(.+)/i)
          return { 
            success: true, 
            newVersion: versionMatch ? versionMatch[1].trim() : undefined 
          }
        }
      }
      command = `pip install --upgrade ${packageName}`
      break
    default:
      return { success: false, error: 'Unsupported package manager for update' }
  }
  
  const result = await executeSafe(command)
  
  if (!result.success) {
    return { success: false, error: result.stderr || 'Update failed' }
  }
  
  // Get the new version after update
  let newVersion: string | undefined
  if (manager === 'npm') {
    const versionResult = await executeSafe(`npm list -g ${packageName} --depth=0 --json`)
    try {
      const data = JSON.parse(versionResult.stdout)
      newVersion = data.dependencies?.[packageName]?.version
    } catch {
      // Ignore parse errors
    }
  } else if (manager === 'pip') {
    const versionResult = await executeSafe(`pip show ${packageName}`)
    const versionMatch = versionResult.stdout.match(/Version:\s*(.+)/i)
    newVersion = versionMatch ? versionMatch[1].trim() : undefined
  }
  
  return { success: true, newVersion }
}

/**
 * Get the global installation path for a package manager
 * 
 * @param manager The package manager
 * @returns Promise resolving to the global path or null
 */
export async function getGlobalPath(
  manager: 'npm' | 'pip' | 'composer' | 'cargo' | 'gem'
): Promise<string | null> {
  let command: string
  
  switch (manager) {
    case 'npm':
      command = 'npm root -g'
      break
    case 'pip':
      // Get site-packages location, try py on Windows first
      if (isWindows()) {
        const pyResult = await executeSafe('py -c "import site; print(site.getsitepackages()[0])"')
        if (pyResult.success && pyResult.stdout) {
          return pyResult.stdout.trim()
        }
      }
      command = isWindows()
        ? 'python -c "import site; print(site.getsitepackages()[0])"'
        : 'python3 -c "import site; print(site.getsitepackages()[0])"'
      break
    case 'composer':
      command = 'composer global config home'
      break
    case 'cargo':
      // Cargo installs to ~/.cargo/bin
      command = isWindows()
        ? 'echo %USERPROFILE%\\.cargo\\bin'
        : 'echo ~/.cargo/bin'
      break
    case 'gem':
      command = 'gem environment gemdir'
      break
    default:
      return null
  }
  
  const result = await executeSafe(command)
  
  if (result.success && result.stdout) {
    return result.stdout.trim()
  }
  
  return null
}

/**
 * Check if a package manager is available
 * 
 * @param manager The package manager to check
 * @returns Promise resolving to true if available
 */
export async function isPackageManagerAvailable(
  manager: 'npm' | 'pip' | 'composer' | 'cargo' | 'gem'
): Promise<boolean> {
  let commands: string[]
  
  switch (manager) {
    case 'npm':
      commands = ['npm --version']
      break
    case 'pip':
      // Try multiple pip commands on Windows
      commands = isWindows()
        ? ['pip --version', 'pip3 --version', 'py -m pip --version']
        : ['pip3 --version', 'pip --version']
      break
    case 'composer':
      commands = ['composer --version']
      break
    case 'cargo':
      commands = ['cargo --version']
      break
    case 'gem':
      commands = ['gem --version']
      break
    default:
      return false
  }
  
  for (const cmd of commands) {
    const result = await executeSafe(cmd)
    if (result.success) return true
  }
  
  return false
}

/**
 * PackageManager class providing an object-oriented interface
 */
export class PackageManager {
  /**
   * List npm global packages
   */
  async listNpmPackages(): Promise<PackageInfo[]> {
    return listNpmPackages()
  }
  
  /**
   * List pip packages
   */
  async listPipPackages(): Promise<PackageInfo[]> {
    return listPipPackages()
  }
  
  /**
   * List composer global packages
   */
  async listComposerPackages(): Promise<PackageInfo[]> {
    return listComposerPackages()
  }
  
  /**
   * List cargo packages
   */
  async listCargoPackages(): Promise<PackageInfo[]> {
    return listCargoPackages()
  }
  
  /**
   * List gem packages
   */
  async listGemPackages(): Promise<PackageInfo[]> {
    return listGemPackages()
  }
  
  /**
   * Uninstall a package
   */
  async uninstallPackage(
    packageName: string,
    manager: 'npm' | 'pip' | 'composer' | 'cargo' | 'gem'
  ): Promise<boolean> {
    return uninstallPackage(packageName, manager)
  }
  
  /**
   * Update a package to the latest version
   */
  async updatePackage(
    packageName: string,
    manager: 'npm' | 'pip'
  ): Promise<{ success: boolean; newVersion?: string; error?: string }> {
    return updatePackage(packageName, manager)
  }
  
  /**
   * Get global installation path
   */
  async getGlobalPath(manager: 'npm' | 'pip' | 'composer' | 'cargo' | 'gem'): Promise<string | null> {
    return getGlobalPath(manager)
  }
  
  /**
   * Check if package manager is available
   */
  async isPackageManagerAvailable(
    manager: 'npm' | 'pip' | 'composer' | 'cargo' | 'gem'
  ): Promise<boolean> {
    return isPackageManagerAvailable(manager)
  }
  
  /**
   * Parse npm output
   */
  parseNpmOutput(output: string): PackageInfo[] {
    return parseNpmOutput(output)
  }
  
  /**
   * Parse pip output
   */
  parsePipOutput(output: string): PackageInfo[] {
    return parsePipOutput(output)
  }
  
  /**
   * Parse composer output
   */
  parseComposerOutput(output: string): PackageInfo[] {
    return parseComposerOutput(output)
  }
}

// Export a default instance
export const packageManager = new PackageManager()
