import { ToolRegistry } from '@berkelium/tools';
import {
  ReadFileTool,
  WriteFileTool,
  EditFileTool,
  SearchFilesTool,
  SearchTextTool,
  GitDiffTool,
  GitCommitTool,
  DiagnosticsTool,
  TestTool,
} from '@berkelium/tools';

export interface BenchmarkTask {
  name: string;
  category: string;
  expectedTool: string;
  validateArgs: (args: any) => boolean;
}

export const TOOLBENCH_TASKS: BenchmarkTask[] = [
  {
    name: 'Find authentication bug',
    category: 'Search',
    expectedTool: 'search_text',
    validateArgs: (a) => typeof a.query === 'string' && a.query.length > 0,
  },
  {
    name: 'Rename symbols in module',
    category: 'Edit',
    expectedTool: 'edit_file',
    validateArgs: (a) => typeof a.path === 'string' && typeof a.target === 'string' && typeof a.replacement === 'string',
  },
  {
    name: 'Add regression test',
    category: 'Filesystem',
    expectedTool: 'write_file',
    validateArgs: (a) => typeof a.path === 'string' && typeof a.content === 'string',
  },
  {
    name: 'Diagnose test failure',
    category: 'Diagnostics',
    expectedTool: 'test',
    validateArgs: () => true,
  },
  {
    name: 'Check typecheck errors',
    category: 'Diagnostics',
    expectedTool: 'diagnostics',
    validateArgs: () => true,
  },
  {
    name: 'Create Git commit',
    category: 'Git',
    expectedTool: 'git_commit',
    validateArgs: (a) => typeof a.message === 'string',
  },
];

export function runToolBench(): { total: number; passed: number; accuracy: number } {
  const registry = new ToolRegistry();
  registry.registerMany([
    new ReadFileTool(),
    new WriteFileTool(),
    new EditFileTool(),
    new SearchFilesTool(),
    new SearchTextTool(),
    new GitDiffTool(),
    new GitCommitTool(),
    new DiagnosticsTool(),
    new TestTool(),
  ]);

  let passed = 0;
  for (const task of TOOLBENCH_TASKS) {
    const tool = registry.get(task.expectedTool);
    if (tool) {
      passed++;
    }
  }

  return {
    total: TOOLBENCH_TASKS.length,
    passed,
    accuracy: (passed / TOOLBENCH_TASKS.length) * 100,
  };
}
