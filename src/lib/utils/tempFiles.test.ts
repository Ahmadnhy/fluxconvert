import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createTempFile, createTempDir, cleanupTempFiles } from './tempFiles';

describe('Temporary File Management', () => {
  const createdPaths: string[] = [];

  // Clean up any files created during tests
  afterEach(async () => {
    for (const path of createdPaths) {
      try {
        await fs.rm(path, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
    createdPaths.length = 0;
  });

  describe('createTempFile', () => {
    it('should create a temporary file with content', async () => {
      const content = Buffer.from('test content');
      const { path, cleanup } = await createTempFile(content);
      createdPaths.push(path);

      // Verify file exists
      const fileContent = await fs.readFile(path);
      expect(fileContent.toString()).toBe('test content');

      // Cleanup
      await cleanup();

      // Verify file is deleted
      await expect(fs.access(path)).rejects.toThrow();
    });

    it('should create a file with custom prefix and extension', async () => {
      const content = Buffer.from('test');
      const { path, cleanup } = await createTempFile(content, {
        prefix: 'input',
        extension: 'docx'
      });
      createdPaths.push(path);

      // Verify filename format
      const parts = path.split(/[/\\]/);
      const filename = parts[parts.length - 1];
      expect(filename).toMatch(/^input-[a-f0-9-]+-\d+\.docx$/);

      await cleanup();
    });

    it('should create a file with default prefix and extension', async () => {
      const content = Buffer.from('test');
      const { path, cleanup } = await createTempFile(content);
      createdPaths.push(path);

      // Verify filename format
      const parts = path.split(/[/\\]/);
      const filename = parts[parts.length - 1];
      expect(filename).toMatch(/^temp-[a-f0-9-]+-\d+\.tmp$/);

      await cleanup();
    });

    it('should create files in the system temp directory', async () => {
      const content = Buffer.from('test');
      const { path, cleanup } = await createTempFile(content);
      createdPaths.push(path);

      expect(path).toContain(tmpdir());

      await cleanup();
    });

    it('should generate unique filenames', async () => {
      const content = Buffer.from('test');
      const { path: path1, cleanup: cleanup1 } = await createTempFile(content);
      const { path: path2, cleanup: cleanup2 } = await createTempFile(content);
      createdPaths.push(path1, path2);

      expect(path1).not.toBe(path2);

      await cleanup1();
      await cleanup2();
    });

    it('should handle cleanup errors gracefully', async () => {
      const content = Buffer.from('test');
      const { path, cleanup } = await createTempFile(content);
      createdPaths.push(path);

      // Delete the file manually
      await fs.rm(path, { force: true });

      // Cleanup should not throw
      await expect(cleanup()).resolves.not.toThrow();
    });

    it('should handle binary content', async () => {
      const content = Buffer.from([0x00, 0x01, 0x02, 0xFF]);
      const { path, cleanup } = await createTempFile(content);
      createdPaths.push(path);

      const fileContent = await fs.readFile(path);
      expect(fileContent).toEqual(content);

      await cleanup();
    });
  });

  describe('createTempDir', () => {
    it('should create a temporary directory', async () => {
      const { path, cleanup } = await createTempDir();
      createdPaths.push(path);

      // Verify directory exists
      const stats = await fs.stat(path);
      expect(stats.isDirectory()).toBe(true);

      // Cleanup
      await cleanup();

      // Verify directory is deleted
      await expect(fs.access(path)).rejects.toThrow();
    });

    it('should create directory with correct naming convention', async () => {
      const { path, cleanup } = await createTempDir();
      createdPaths.push(path);

      // Verify directory name format: conversion-{uuid}-{timestamp}
      const parts = path.split(/[/\\]/);
      const dirname = parts[parts.length - 1];
      expect(dirname).toMatch(/^conversion-[a-f0-9-]+-\d+$/);

      await cleanup();
    });

    it('should create directory in system temp directory', async () => {
      const { path, cleanup } = await createTempDir();
      createdPaths.push(path);

      expect(path).toContain(tmpdir());

      await cleanup();
    });

    it('should generate unique directory names', async () => {
      const { path: path1, cleanup: cleanup1 } = await createTempDir();
      const { path: path2, cleanup: cleanup2 } = await createTempDir();
      createdPaths.push(path1, path2);

      expect(path1).not.toBe(path2);

      await cleanup1();
      await cleanup2();
    });

    it('should cleanup directory with files inside', async () => {
      const { path, cleanup } = await createTempDir();
      createdPaths.push(path);

      // Create files inside the directory
      await fs.writeFile(join(path, 'file1.txt'), 'content1');
      await fs.writeFile(join(path, 'file2.txt'), 'content2');

      // Cleanup should remove directory and all contents
      await cleanup();

      // Verify directory is deleted
      await expect(fs.access(path)).rejects.toThrow();
    });

    it('should handle cleanup errors gracefully', async () => {
      const { path, cleanup } = await createTempDir();
      createdPaths.push(path);

      // Delete the directory manually
      await fs.rm(path, { recursive: true, force: true });

      // Cleanup should not throw
      await expect(cleanup()).resolves.not.toThrow();
    });
  });

  describe('cleanupTempFiles', () => {
    it('should cleanup multiple files', async () => {
      const content = Buffer.from('test');
      const { path: path1 } = await createTempFile(content);
      const { path: path2 } = await createTempFile(content);
      createdPaths.push(path1, path2);

      await cleanupTempFiles([path1, path2]);

      // Verify both files are deleted
      await expect(fs.access(path1)).rejects.toThrow();
      await expect(fs.access(path2)).rejects.toThrow();
    });

    it('should cleanup multiple directories', async () => {
      const { path: path1 } = await createTempDir();
      const { path: path2 } = await createTempDir();
      createdPaths.push(path1, path2);

      await cleanupTempFiles([path1, path2]);

      // Verify both directories are deleted
      await expect(fs.access(path1)).rejects.toThrow();
      await expect(fs.access(path2)).rejects.toThrow();
    });

    it('should cleanup mixed files and directories', async () => {
      const content = Buffer.from('test');
      const { path: filePath } = await createTempFile(content);
      const { path: dirPath } = await createTempDir();
      createdPaths.push(filePath, dirPath);

      await cleanupTempFiles([filePath, dirPath]);

      // Verify both are deleted
      await expect(fs.access(filePath)).rejects.toThrow();
      await expect(fs.access(dirPath)).rejects.toThrow();
    });

    it('should handle empty array', async () => {
      await expect(cleanupTempFiles([])).resolves.not.toThrow();
    });

    it('should handle non-existent paths gracefully', async () => {
      const fakePath1 = join(tmpdir(), 'non-existent-file.txt');
      const fakePath2 = join(tmpdir(), 'non-existent-dir');

      // Should not throw even if paths don't exist
      await expect(cleanupTempFiles([fakePath1, fakePath2])).resolves.not.toThrow();
    });

    it('should continue cleanup even if one path fails', async () => {
      const content = Buffer.from('test');
      const { path: validPath } = await createTempFile(content);
      const invalidPath = join(tmpdir(), 'non-existent.txt');
      createdPaths.push(validPath);

      // Should not throw and should cleanup the valid path
      await cleanupTempFiles([invalidPath, validPath]);

      // Verify valid path is deleted
      await expect(fs.access(validPath)).rejects.toThrow();
    });

    it('should cleanup directories with nested content', async () => {
      const { path: dirPath } = await createTempDir();
      createdPaths.push(dirPath);

      // Create nested structure
      const subDir = join(dirPath, 'subdir');
      await fs.mkdir(subDir);
      await fs.writeFile(join(dirPath, 'file1.txt'), 'content1');
      await fs.writeFile(join(subDir, 'file2.txt'), 'content2');

      await cleanupTempFiles([dirPath]);

      // Verify directory and all contents are deleted
      await expect(fs.access(dirPath)).rejects.toThrow();
    });
  });
});
