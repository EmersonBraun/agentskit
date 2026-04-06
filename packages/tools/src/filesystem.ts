import { resolve, relative } from 'node:path'
import type { ToolDefinition } from '@agentskit/core'

export interface FilesystemConfig {
  basePath: string
}

function safePath(basePath: string, inputPath: string): string {
  const normalizedBase = resolve(basePath)
  const resolved = resolve(basePath, inputPath)
  if (!resolved.startsWith(normalizedBase + '/') && resolved !== normalizedBase) {
    throw new Error(`Access denied: "${inputPath}" is outside the allowed base path`)
  }
  return resolved
}

export function filesystem(config: FilesystemConfig): ToolDefinition[] {
  const basePath = resolve(config.basePath)

  const readFile: ToolDefinition = {
    name: 'read_file',
    description: 'Read the contents of a file. Path is relative to the workspace.',
    tags: ['filesystem', 'read'],
    category: 'filesystem',
    schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to workspace' },
      },
      required: ['path'],
    },
    execute: async (args) => {
      const fs = await import('node:fs/promises')
      const filePath = safePath(basePath, String(args.path ?? ''))
      return await fs.readFile(filePath, 'utf8')
    },
  }

  const writeFile: ToolDefinition = {
    name: 'write_file',
    description: 'Write content to a file. Creates the file if it does not exist. Path is relative to the workspace.',
    tags: ['filesystem', 'write'],
    category: 'filesystem',
    schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to workspace' },
        content: { type: 'string', description: 'Content to write' },
      },
      required: ['path', 'content'],
    },
    execute: async (args) => {
      const fs = await import('node:fs/promises')
      const { dirname } = await import('node:path')
      const filePath = safePath(basePath, String(args.path ?? ''))
      await fs.mkdir(dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, String(args.content ?? ''), 'utf8')
      return `Written to ${args.path}`
    },
  }

  const listDirectory: ToolDefinition = {
    name: 'list_directory',
    description: 'List files and directories at a path. Path is relative to the workspace.',
    tags: ['filesystem', 'read'],
    category: 'filesystem',
    schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Directory path relative to workspace (default: root)' },
      },
    },
    execute: async (args) => {
      const fs = await import('node:fs/promises')
      const dirPath = safePath(basePath, String(args.path ?? '.'))
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      return entries
        .map(e => `${e.isDirectory() ? '[dir] ' : ''}${e.name}`)
        .join('\n')
    },
  }

  return [readFile, writeFile, listDirectory]
}
