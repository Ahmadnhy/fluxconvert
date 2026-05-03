import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Options for creating a temporary file
 */
export interface TempFileOptions {
  prefix?: string;
  extension?: string;
}

/**
 * Result of creating a temporary file
 */
export interface TempFileResult {
  path: string;
  cleanup: () => Promise<void>;
}

/**
 * Creates a temporary file with the provided content
 * 
 * @param content - Buffer containing the file content
 * @param options - Optional configuration for the temp file
 * @returns Promise resolving to the file path and cleanup function
 * 
 * @example
 * ```typescript
 * const { path, cleanup } = await createTempFile(buffer, { 
 *   prefix: 'input', 
 *   extension: 'docx' 
 * });
 * try {
 *   // Use the file
 * } finally {
 *   await cleanup();
 * }
 * ```
 */
export async function createTempFile(
  content: Buffer,
  options?: TempFileOptions
): Promise<TempFileResult> {
  const uuid = uuidv4();
  const timestamp = Date.now();
  const prefix = options?.prefix || 'temp';
  const extension = options?.extension || 'tmp';
  
  // Generate unique filename: {prefix}-{uuid}-{timestamp}.{extension}
  const filename = `${prefix}-${uuid}-${timestamp}.${extension}`;
  const filePath = join(tmpdir(), filename);
  
  try {
    // Write the file content
    await fs.writeFile(filePath, content);
    
    console.log(`[INFO] Temporary file created: ${filePath}`);
    
    // Return the path and cleanup function
    return {
      path: filePath,
      cleanup: async () => {
        try {
          await fs.rm(filePath, { force: true });
          console.log(`[INFO] Temporary file cleaned up: ${filePath}`);
        } catch (error) {
          console.error(`[ERROR] Failed to cleanup temporary file: ${filePath}`, error);
          // Don't throw - cleanup should be best-effort
        }
      }
    };
  } catch (error) {
    console.error(`[ERROR] Failed to create temporary file: ${filePath}`, error);
    throw new Error(`Failed to create temporary file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Creates a temporary directory with a unique name
 * 
 * @returns Promise resolving to the directory path and cleanup function
 * 
 * @example
 * ```typescript
 * const { path, cleanup } = await createTempDir();
 * try {
 *   // Use the directory
 * } finally {
 *   await cleanup();
 * }
 * ```
 */
export async function createTempDir(): Promise<{
  path: string;
  cleanup: () => Promise<void>;
}> {
  const uuid = uuidv4();
  const timestamp = Date.now();
  
  // Generate unique directory name: conversion-{uuid}-{timestamp}
  const dirname = `conversion-${uuid}-${timestamp}`;
  const dirPath = join(tmpdir(), dirname);
  
  try {
    // Create the directory with recursive option
    await fs.mkdir(dirPath, { recursive: true });
    
    console.log(`[INFO] Temporary directory created: ${dirPath}`);
    
    // Return the path and cleanup function
    return {
      path: dirPath,
      cleanup: async () => {
        try {
          await fs.rm(dirPath, { recursive: true, force: true });
          console.log(`[INFO] Temporary directory cleaned up: ${dirPath}`);
        } catch (error) {
          console.error(`[ERROR] Failed to cleanup temporary directory: ${dirPath}`, error);
          // Don't throw - cleanup should be best-effort
        }
      }
    };
  } catch (error) {
    console.error(`[ERROR] Failed to create temporary directory: ${dirPath}`, error);
    throw new Error(`Failed to create temporary directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Cleans up multiple temporary files and directories
 * 
 * @param paths - Array of file or directory paths to clean up
 * @returns Promise that resolves when all cleanup operations complete
 * 
 * @example
 * ```typescript
 * await cleanupTempFiles([inputPath, outputPath, tempDirPath]);
 * ```
 */
export async function cleanupTempFiles(paths: string[]): Promise<void> {
  const cleanupPromises = paths.map(async (path) => {
    try {
      await fs.rm(path, { recursive: true, force: true });
      console.log(`[INFO] Cleaned up temporary path: ${path}`);
    } catch (error) {
      console.error(`[ERROR] Failed to cleanup temporary path: ${path}`, error);
      // Don't throw - continue cleaning up other files
    }
  });
  
  // Wait for all cleanup operations to complete
  await Promise.all(cleanupPromises);
}
