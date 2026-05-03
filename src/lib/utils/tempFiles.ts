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
 * Supports various file extensions for multi-step conversion pipelines:
 * - .docx (Word documents)
 * - .pdf (PDF documents)
 * - .html (HTML intermediate files)
 * - Any other extension needed for conversion
 * 
 * @param content - Buffer containing the file content
 * @param options - Optional configuration for the temp file
 * @returns Promise resolving to the file path and cleanup function
 * 
 * @example
 * ```typescript
 * // Create input file
 * const { path, cleanup } = await createTempFile(buffer, { 
 *   prefix: 'input', 
 *   extension: 'docx' 
 * });
 * 
 * // Create intermediate HTML file
 * const { path: htmlPath, cleanup: cleanupHtml } = await createTempFile(htmlBuffer, {
 *   prefix: 'intermediate',
 *   extension: 'html'
 * });
 * 
 * try {
 *   // Use the files
 * } finally {
 *   await cleanup();
 *   await cleanupHtml();
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
 * This function handles cleanup of all temporary files including intermediate files
 * generated during multi-step conversion pipelines (e.g., HTML, styled HTML).
 * All cleanup operations are performed in parallel for efficiency.
 * 
 * @param paths - Array of file or directory paths to clean up (can include intermediate files)
 * @returns Promise that resolves when all cleanup operations complete
 * 
 * @example
 * ```typescript
 * // Clean up all files from a conversion pipeline
 * await cleanupTempFiles([
 *   inputPath,           // Original input file
 *   htmlPath,            // Intermediate HTML file
 *   styledHtmlPath,      // Intermediate styled HTML file
 *   outputPath,          // Final output file
 *   tempDirPath          // Temporary directory
 * ]);
 * ```
 */
export async function cleanupTempFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) {
    console.log('[INFO] No temporary files to clean up');
    return;
  }
  
  console.log(`[INFO] Starting cleanup of ${paths.length} temporary file(s)/directory(ies)`);
  
  const cleanupPromises = paths.map(async (path, index) => {
    try {
      await fs.rm(path, { recursive: true, force: true });
      console.log(`[INFO] Cleaned up temporary path [${index + 1}/${paths.length}]: ${path}`);
    } catch (error) {
      console.error(`[ERROR] Failed to cleanup temporary path [${index + 1}/${paths.length}]: ${path}`, error);
      // Don't throw - continue cleaning up other files
    }
  });
  
  // Wait for all cleanup operations to complete
  await Promise.all(cleanupPromises);
  
  console.log(`[INFO] Completed cleanup of ${paths.length} temporary file(s)/directory(ies)`);
}
