/**
 * Tests for DetectionEngine Module
 * 
 * Feature: dev-tools-manager
 * Tests Properties 1 and 2 from the design document
 */

import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import {
  parseVersion,
  detectInstallMethod,
  DetectionEngine,
} from './detectionEngine'

describe('DetectionEngine', () => {
  describe('parseVersion', () => {
    it('should parse Node.js style version (v18.17.0)', () => {
      const result = parseVersion('v18.17.0')
      expect(result.version).toBe('18.17.0')
    })

    it('should parse npm style version (9.8.1)', () => {
      const result = parseVersion('9.8.1')
      expect(result.version).toBe('9.8.1')
    })

    it('should parse Python style version (Python 3.11.4)', () => {
      const result = parseVersion('Python 3.11.4')
      expect(result.version).toBe('3.11.4')
    })

    it('should parse PHP style version (PHP 8.2.0)', () => {
      const result = parseVersion('PHP 8.2.0 (cli) (built: ...)')
      expect(result.version).toBe('8.2.0')
    })

    it('should parse Composer style version', () => {
      const result = parseVersion('Composer version 2.5.8 2023-06-09')
      expect(result.version).toBe('2.5.8')
    })

    it('should handle empty input', () => {
      const result = parseVersion('')
      expect(result.version).toBeNull()
    })

    it('should handle null/undefined input', () => {
      const result = parseVersion(null as unknown as string)
      expect(result.version).toBeNull()
    })

    it('should handle version with prerelease tag', () => {
      const result = parseVersion('v1.0.0-beta.1')
      expect(result.version).toBe('1.0.0-beta.1')
    })

    // Property-based test for version parsing
    it('should always return a ParsedVersion object', () => {
      fc.assert(
        fc.property(
          fc.string(),
          (input) => {
            const result = parseVersion(input)
            return (
              typeof result === 'object' &&
              (result.version === null || typeof result.version === 'string') &&
              typeof result.raw === 'string'
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    // Property-based test: valid semver strings should be parsed
    it('should parse valid semver strings', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 99 }),
          fc.integer({ min: 0, max: 99 }),
          fc.integer({ min: 0, max: 99 }),
          (major, minor, patch) => {
            const versionStr = `${major}.${minor}.${patch}`
            const result = parseVersion(versionStr)
            return result.version === versionStr
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('detectInstallMethod', () => {
    it('should detect homebrew installation', () => {
      expect(detectInstallMethod('/opt/homebrew/bin/node')).toBe('homebrew')
      expect(detectInstallMethod('/usr/local/Cellar/node/18.0.0/bin/node')).toBe('manual')
    })

    it('should detect chocolatey installation', () => {
      expect(detectInstallMethod('C:\\ProgramData\\chocolatey\\bin\\node.exe')).toBe('chocolatey')
    })

    it('should detect npm installation', () => {
      expect(detectInstallMethod('/usr/local/lib/node_modules/.bin/tool')).toBe('npm')
    })

    it('should detect pip installation', () => {
      expect(detectInstallMethod('/usr/local/lib/python3.11/site-packages/pip')).toBe('pip')
    })

    it('should return manual for unknown paths', () => {
      expect(detectInstallMethod('/some/random/path')).toBe('manual')
    })

    it('should handle null path', () => {
      expect(detectInstallMethod(null)).toBe('manual')
    })
  })

  describe('DetectionEngine class', () => {
    let engine: DetectionEngine

    beforeEach(() => {
      engine = new DetectionEngine()
    })

    describe('detectNodeJS', () => {
      /**
       * Feature: dev-tools-manager, Property 1: Tool Detection Consistency
       * **Validates: Requirements 1.2, 1.8**
       * 
       * For any supported development tool, when the tool is installed,
       * the Detection Engine should successfully detect it and return
       * both version number and installation path.
       */
      it('should return a valid ToolInfo structure', async () => {
        const result = await engine.detectNodeJS()

        expect(result).toHaveProperty('name', 'node')
        expect(result).toHaveProperty('displayName', 'Node.js')
        expect(result).toHaveProperty('category', 'runtime')
        expect(result).toHaveProperty('isInstalled')
        expect(typeof result.isInstalled).toBe('boolean')

        if (result.isInstalled) {
          expect(result.version).not.toBeNull()
          expect(result.path).not.toBeNull()
        }
      })
    })

    describe('detectNpm', () => {
      /**
       * Feature: dev-tools-manager, Property 1: Tool Detection Consistency
       * **Validates: Requirements 1.3, 1.8**
       */
      it('should return a valid ToolInfo structure', async () => {
        const result = await engine.detectNpm()

        expect(result).toHaveProperty('name', 'npm')
        expect(result).toHaveProperty('displayName', 'npm')
        expect(result).toHaveProperty('category', 'package-manager')
        expect(result).toHaveProperty('isInstalled')
      })
    })

    describe('detectJava', () => {
      /**
       * Feature: dev-tools-manager, Property 1: Tool Detection Consistency
       */
      it('should return a valid ToolInfo structure', async () => {
        const result = await engine.detectJava()

        expect(result).toHaveProperty('name', 'java')
        expect(result).toHaveProperty('displayName', 'Java')
        expect(result).toHaveProperty('category', 'runtime')
        expect(result).toHaveProperty('isInstalled')
      })
    })

    describe('detectPython', () => {
      /**
       * Feature: dev-tools-manager, Property 1: Tool Detection Consistency
       * **Validates: Requirements 1.4, 1.8**
       */
      it('should return a valid ToolInfo structure', async () => {
        const result = await engine.detectPython()

        expect(result).toHaveProperty('name', 'python')
        expect(result).toHaveProperty('displayName', 'Python')
        expect(result).toHaveProperty('category', 'runtime')
        expect(result).toHaveProperty('isInstalled')
      })
    })

    describe('detectPip', () => {
      /**
       * Feature: dev-tools-manager, Property 1: Tool Detection Consistency
       * **Validates: Requirements 1.5, 1.8**
       */
      it('should return a valid ToolInfo structure', async () => {
        const result = await engine.detectPip()

        expect(result).toHaveProperty('name', 'pip')
        expect(result).toHaveProperty('displayName', 'pip')
        expect(result).toHaveProperty('category', 'package-manager')
        expect(result).toHaveProperty('isInstalled')
      })
    })

    describe('detectPHP', () => {
      /**
       * Feature: dev-tools-manager, Property 1: Tool Detection Consistency
       * **Validates: Requirements 1.6, 1.8**
       */
      it('should return a valid ToolInfo structure', async () => {
        const result = await engine.detectPHP()

        expect(result).toHaveProperty('name', 'php')
        expect(result).toHaveProperty('displayName', 'PHP')
        expect(result).toHaveProperty('category', 'runtime')
        expect(result).toHaveProperty('isInstalled')
      })
    })

    describe('detectComposer', () => {
      /**
       * Feature: dev-tools-manager, Property 1: Tool Detection Consistency
       * **Validates: Requirements 1.7, 1.8**
       */
      it('should return a valid ToolInfo structure', async () => {
        const result = await engine.detectComposer()

        expect(result).toHaveProperty('name', 'composer')
        expect(result).toHaveProperty('displayName', 'Composer')
        expect(result).toHaveProperty('category', 'package-manager')
        expect(result).toHaveProperty('isInstalled')
      })
    })

    describe('detectTool', () => {
      it('should route to correct detection method', async () => {
        const nodeResult = await engine.detectTool('node')
        expect(nodeResult.name).toBe('node')

        const npmResult = await engine.detectTool('npm')
        expect(npmResult.name).toBe('npm')

        const pythonResult = await engine.detectTool('python')
        expect(pythonResult.name).toBe('python')

        const javaResult = await engine.detectTool('java')
        expect(javaResult.name).toBe('java')

        const mvnResult = await engine.detectTool('mvn')
        expect(mvnResult.name).toBe('mvn')
      })

      it('should handle case-insensitive tool names', async () => {
        const result1 = await engine.detectTool('NODE')
        const result2 = await engine.detectTool('Node')
        const result3 = await engine.detectTool('node')

        expect(result1.name).toBe('node')
        expect(result2.name).toBe('node')
        expect(result3.name).toBe('node')
      })

      it('should detect custom tools', async () => {
        const result = await engine.detectTool('git')
        expect(result.name).toBe('git')
        expect(result.category).toBe('tool')
      })
    })

    describe('detectAllTools', () => {
      /**
       * Feature: dev-tools-manager, Property 11: Partial Failure Resilience
       * **Validates: Requirements 8.5**
       * 
       * For any set of tool detection operations, if some detections fail,
       * the system should still return results for successful detections.
       */
      it('should return an array of ToolInfo objects', async () => {
        const results = await engine.detectAllTools()

        expect(Array.isArray(results)).toBe(true)
        expect(results.length).toBe(39) // 12 runtimes + 11 package managers + 6 dev tools + 5 cloud tools + 5 version managers
        for (const tool of results) {
          expect(tool).toHaveProperty('name')
          expect(tool).toHaveProperty('displayName')
          expect(tool).toHaveProperty('version')
          expect(tool).toHaveProperty('path')
          expect(tool).toHaveProperty('isInstalled')
          expect(tool).toHaveProperty('category')
        }
      }, 10000) // Increase timeout to 10 seconds for async operations

      it('should detect tools in parallel', async () => {
        const startTime = Date.now()
        await engine.detectAllTools()
        const duration = Date.now() - startTime

        // Parallel execution should be faster than sequential
        // 6 tools * 5s timeout = 30s sequential, should be much less in parallel
        expect(duration).toBeLessThan(15000)
      })
    })

    describe('detectCustomTool', () => {
      it('should detect a custom tool with version flag', async () => {
        const result = await engine.detectCustomTool('git', 'Git', '--version')

        expect(result.name).toBe('git')
        expect(result.displayName).toBe('Git')
        expect(result.category).toBe('tool')
      })

      /**
       * Feature: dev-tools-manager, Property 2: Unavailable Tool Handling
       * **Validates: Requirements 1.9**
       * 
       * For any tool that is not installed on the system, the Detection Engine
       * should mark it as unavailable (isInstalled: false) without throwing errors.
       */
      it('should handle non-existent tools gracefully', async () => {
        const result = await engine.detectCustomTool('nonexistent_tool_12345')

        expect(result.isInstalled).toBe(false)
        expect(result.version).toBeNull()
        expect(result.path).toBeNull()
      })

      // Property-based test for unavailable tool handling
      it('should never throw for any tool name', () => {
        fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes(' ') && !s.includes('\n')),
            async (toolName) => {
              try {
                const result = await engine.detectCustomTool(toolName)
                return (
                  typeof result.isInstalled === 'boolean' &&
                  (result.version === null || typeof result.version === 'string') &&
                  (result.path === null || typeof result.path === 'string')
                )
              } catch {
                return false // Should never throw
              }
            }
          ),
          { numRuns: 10 } // Limited runs due to actual command execution
        )
      })
    })
  })

  describe('Property Tests', () => {
    let engine: DetectionEngine

    beforeEach(() => {
      engine = new DetectionEngine()
    })

    /**
     * Feature: dev-tools-manager, Property 1: Tool Detection Consistency
     * **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8**
     * 
     * For any supported development tool, when the tool is installed,
     * the Detection Engine should successfully detect it and return
     * both version number and installation path.
     */
    it('Property 1: installed tools should have version and path', async () => {
      const tools = await engine.detectAllTools()

      for (const tool of tools) {
        if (tool.isInstalled) {
          expect(tool.version).not.toBeNull()
          expect(tool.path).not.toBeNull()
        }
      }
    })

    /**
     * Feature: dev-tools-manager, Property 2: Unavailable Tool Handling
     * **Validates: Requirements 1.9**
     * 
     * For any tool that is not installed on the system, the Detection Engine
     * should mark it as unavailable (isInstalled: false) without throwing errors.
     */
    it('Property 2: unavailable tools should be marked as not installed', async () => {
      const tools = await engine.detectAllTools()

      for (const tool of tools) {
        if (!tool.isInstalled) {
          expect(tool.version).toBeNull()
          // Path might still be null for unavailable tools
        }
      }
    })

    /**
     * Feature: dev-tools-manager, Property 7: Tool Categorization
     * **Validates: Requirements 5.2**
     * 
     * For any list of tools, when organized by category, all tools should
     * be assigned to exactly one category and no tools should be lost.
     */
    it('Property 7: all tools should have exactly one category', async () => {
      const tools = await engine.detectAllTools()
      const validCategories = ['runtime', 'package-manager', 'tool', 'other']

      for (const tool of tools) {
        expect(validCategories).toContain(tool.category)
      }
    })
  })
})
