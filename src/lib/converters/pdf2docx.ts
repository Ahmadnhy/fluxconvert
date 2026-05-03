import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

/**
 * Options for pdf2docx PDF-to-Word conversion
 */
export interface Pdf2docxConversionOptions {
  inputPath: string;
  outputPath: string;
  timeout?: number; // milliseconds, default 120000
}

/**
 * Result of pdf2docx PDF-to-Word conversion
 */
export interface Pdf2docxConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
}

/**
 * Convert a PDF document to Word using pdf2docx Python library
 * 
 * @param options - Conversion options including input path, output path, and optional timeout
 * @returns Promise resolving to conversion result with success status and output path or error
 * 
 * @example
 * ```typescript
 * const result = await convertPdfToWord({
 *   inputPath: '/tmp/document.pdf',
 *   outputPath: '/tmp/output/document.docx',
 *   timeout: 120000
 * });
 * 
 * if (result.success) {
 *   console.log('DOCX created at:', result.outputPath);
 * } else {
 *   console.error('Conversion failed:', result.error);
 * }
 * ```
 */
export async function convertPdfToWord(
  options: Pdf2docxConversionOptions
): Promise<Pdf2docxConversionResult> {
  const { inputPath, outputPath, timeout = 120000 } = options;
  let pythonScriptPath: string | null = null;

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
    const outputDir = path.dirname(outputPath);
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create output directory',
      };
    }

    // Create Python script in temporary directory
    const tmpDir = path.join(process.cwd(), '.tmp');
    await fs.mkdir(tmpDir, { recursive: true });
    
    pythonScriptPath = path.join(tmpDir, `pdf2docx_${randomUUID()}.py`);
    
    const pythonScript = `from pdf2docx import Converter
import sys

try:
    cv = Converter(sys.argv[1])
    cv.convert(sys.argv[2])
    cv.close()
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;

    await fs.writeFile(pythonScriptPath, pythonScript, 'utf-8');

    // Create AbortController for timeout handling
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, timeout);

    // Execute Python script with pdf2docx
    const result = await new Promise<Pdf2docxConversionResult>((resolve) => {
      const args = [pythonScriptPath!, inputPath, outputPath];

      console.log('[INFO] Starting pdf2docx conversion:', {
        inputPath,
        outputPath,
        timeout,
      });

      const process = spawn('python3', args, {
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
          console.log('[INFO] pdf2docx stdout:', stdout);
        }
        if (stderr) {
          console.log('[INFO] pdf2docx stderr:', stderr);
        }

        // Check if process was aborted (timeout)
        if (abortController.signal.aborted) {
          console.error('[ERROR] pdf2docx conversion timeout');
          resolve({
            success: false,
            error: 'Conversion timeout: Process exceeded maximum duration of 120 seconds',
          });
          return;
        }

        // Check exit code
        if (code !== 0) {
          console.error('[ERROR] pdf2docx conversion failed with exit code:', code);
          
          // Check for common error patterns
          if (stderr.includes('command not found') || stderr.includes('not recognized')) {
            resolve({
              success: false,
              error: 'Python is not installed or not available in PATH',
            });
            return;
          }

          if (stderr.includes('No module named') || stderr.includes('ModuleNotFoundError')) {
            resolve({
              success: false,
              error: 'pdf2docx library is not installed. Please install it using: pip3 install pdf2docx',
            });
            return;
          }

          if (stderr.includes('invalid PDF') || stderr.includes('PDF format')) {
            resolve({
              success: false,
              error: 'Invalid PDF file format or corrupted PDF file',
            });
            return;
          }

          resolve({
            success: false,
            error: `Conversion failed: ${stderr || 'Unknown error'}`,
          });
          return;
        }

        // Verify output file exists
        try {
          await fs.access(outputPath);
          console.log('[INFO] pdf2docx conversion completed successfully:', outputPath);
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
        console.error('[ERROR] pdf2docx process error:', error);

        // Check for ENOENT (command not found)
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          resolve({
            success: false,
            error: 'Python is not installed or not available in PATH',
          });
          return;
        }

        resolve({
          success: false,
          error: `Process error: ${error.message}`,
        });
      });
    });

    // Clean up Python script
    if (pythonScriptPath) {
      try {
        await fs.unlink(pythonScriptPath);
        console.log('[INFO] Cleaned up Python script:', pythonScriptPath);
      } catch (error) {
        console.warn('[WARN] Failed to clean up Python script:', pythonScriptPath, error);
      }
    }

    return result;
  } catch (error) {
    console.error('[ERROR] Unexpected error during pdf2docx conversion:', error);
    
    // Clean up Python script on error
    if (pythonScriptPath) {
      try {
        await fs.unlink(pythonScriptPath);
      } catch (cleanupError) {
        console.warn('[WARN] Failed to clean up Python script on error:', pythonScriptPath);
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error during conversion',
    };
  }
}
