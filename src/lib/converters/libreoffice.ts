import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Options for LibreOffice Word-to-PDF conversion
 */
export interface LibreOfficeConversionOptions {
  inputPath: string;
  outputDir: string;
  timeout?: number; // milliseconds, default 120000
}

/**
 * Result of LibreOffice Word-to-PDF conversion
 */
export interface LibreOfficeConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

/**
 * Convert a Word document to PDF using LibreOffice CLI
 * 
 * @param options - Conversion options including input path, output directory, and optional timeout
 * @returns Promise resolving to conversion result with success status and output path or error
 * 
 * @example
 * ```typescript
 * const result = await convertWordToPdf({
 *   inputPath: '/tmp/document.docx',
 *   outputDir: '/tmp/output',
 *   timeout: 120000
 * });
 * 
 * if (result.success) {
 *   console.log('PDF created at:', result.outputPath);
 * } else {
 *   console.error('Conversion failed:', result.error);
 * }
 * ```
 */
export async function convertWordToPdf(
  options: LibreOfficeConversionOptions
): Promise<LibreOfficeConversionResult> {
  const { inputPath, outputDir, timeout = 120000 } = options;

  try {
    // Verify input file exists
    try {
      await fs.access(inputPath);
    } catch (error) {
      return {
        success: false,
        error: 'Input file does not exist or is not accessible',
      };
    }

    // Ensure output directory exists
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create output directory',
      };
    }

    // Create AbortController for timeout handling
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, timeout);

    // Execute LibreOffice conversion
    const result = await new Promise<LibreOfficeConversionResult>((resolve) => {
      const args = [
        '--headless',
        '--convert-to',
        'pdf',
        '--outdir',
        outputDir,
        inputPath,
      ];

      console.log('[INFO] Starting LibreOffice conversion:', {
        inputPath,
        outputDir,
        timeout,
      });

      const process = spawn('libreoffice', args, {
        signal: abortController.signal,
      });

      let stdout = '';
      let stderr = '';

      // Capture stdout
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      // Capture stderr
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Handle process completion
      process.on('close', async (code) => {
        clearTimeout(timeoutId);

        // Log output for debugging
        if (stdout) {
          console.log('[INFO] LibreOffice stdout:', stdout);
        }
        if (stderr) {
          console.log('[INFO] LibreOffice stderr:', stderr);
        }

        // Check if process was aborted (timeout)
        if (abortController.signal.aborted) {
          console.error('[ERROR] LibreOffice conversion timeout');
          resolve({
            success: false,
            error: 'Conversion timeout: Process exceeded maximum duration of 120 seconds',
          });
          return;
        }

        // Check exit code
        if (code !== 0) {
          console.error('[ERROR] LibreOffice conversion failed with exit code:', code);
          
          // Check for common error patterns
          if (stderr.includes('command not found') || stderr.includes('not recognized')) {
            resolve({
              success: false,
              error: 'LibreOffice is not installed or not available in PATH',
            });
            return;
          }

          resolve({
            success: false,
            error: `Conversion failed with exit code ${code}: ${stderr || 'Unknown error'}`,
          });
          return;
        }

        // Verify output file exists
        const inputFilename = path.basename(inputPath);
        const outputFilename = inputFilename.replace(/\.[^.]+$/, '.pdf');
        const outputPath = path.join(outputDir, outputFilename);

        try {
          await fs.access(outputPath);
          console.log('[INFO] LibreOffice conversion completed successfully:', outputPath);
          resolve({
            success: true,
            outputPath,
          });
        } catch (error) {
          console.error('[ERROR] Output file not found:', outputPath);
          resolve({
            success: false,
            error: 'Conversion completed but output file was not generated',
          });
        }
      });

      // Handle process errors
      process.on('error', (error) => {
        clearTimeout(timeoutId);
        console.error('[ERROR] LibreOffice process error:', error);

        // Check for ENOENT (command not found)
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          resolve({
            success: false,
            error: 'LibreOffice is not installed or not available in PATH',
          });
          return;
        }

        resolve({
          success: false,
          error: `Process error: ${error.message}`,
        });
      });
    });

    return result;
  } catch (error) {
    console.error('[ERROR] Unexpected error during LibreOffice conversion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error during conversion',
    };
  }
}
