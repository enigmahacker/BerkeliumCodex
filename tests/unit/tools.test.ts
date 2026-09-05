import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  ReadFileTool,
  WriteFileTool,
  EditFileTool,
  DeleteFileTool,
  ListDirectoryTool,
  SearchTextTool,
} from '@berkelium/tools';

describe('Native Tools', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'berkelium-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should write and read files correctly', async () => {
    const writeTool = new WriteFileTool();
    const readTool = new ReadFileTool();
    const context = { workspaceRoot: tempDir, sessionId: 'test' };

    const writeRes = await writeTool.execute(
      { path: 'src/main.ts', content: 'console.log("hello world");\n' },
      context
    );
    expect(writeRes.success).toBe(true);

    const readRes = await readTool.execute({ path: 'src/main.ts' }, context);
    expect(readRes.success).toBe(true);
    expect(readRes.output).toContain('console.log("hello world");');
  });

  it('should surgically edit file content', async () => {
    const writeTool = new WriteFileTool();
    const editTool = new EditFileTool();
    const readTool = new ReadFileTool();
    const context = { workspaceRoot: tempDir, sessionId: 'test' };

    await writeTool.execute(
      { path: 'app.ts', content: 'const port = 3000;\napp.listen(port);' },
      context
    );

    const editRes = await editTool.execute(
      { path: 'app.ts', target: '3000', replacement: '8080' },
      context
    );
    expect(editRes.success).toBe(true);

    const readRes = await readTool.execute({ path: 'app.ts' }, context);
    expect(readRes.output).toContain('const port = 8080;');
  });

  it('should search text across files', async () => {
    const writeTool = new WriteFileTool();
    const searchTool = new SearchTextTool();
    const context = { workspaceRoot: tempDir, sessionId: 'test' };

    await writeTool.execute(
      { path: 'src/auth.ts', content: 'function authenticateUser() { return true; }' },
      context
    );

    const searchRes = await searchTool.execute({ query: 'authenticateUser' }, context);
    expect(searchRes.success).toBe(true);
    expect(searchRes.output).toContain('src/auth.ts:1');
  });
});
