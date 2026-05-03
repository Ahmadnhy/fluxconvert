import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';
import * as childProcess from 'child_process';
import * as fsPromises from 'fs/promises';
import { convertWordToPdf } from './libreoffice';

describe('LibreOffice Converter', () => {
  let mockProcess: EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    kill: ReturnType<typeof vi.fn>;
  };
  let spawnSpy: ReturnType<typeof vi.spyOn>;
  let accessSpy: ReturnType<typeof vi.spyOn>;
  let mkdirSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Restore all spies if they exist
    if (spawnSpy) {
      try {
        spawnSpy.mockRestore();
      } catch (e) {
        // Ignore errors
      }
    }
    if (accessSpy) {
      try {
        accessSpy.mockRestore();
      } catch (e) {
        // Ignore errors
      }
    }
    if (mkdirSpy) {
      try {
        mkdirSpy.mockRestore();
      } catch (e) {
        // Ignore errors
      }
    }

    // Create mock process with stdout and stderr
    mockProcess = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
      kill: vi.fn(),
    });

    // Spy on child_process.spawn
    spawnSpy = vi.spyOn(childProcess, 'spawn').mockReturnValue(mockProcess as any);
    
    // Spy on fs.promises methods - default to success
    accessSpy = vi.spyOn(fsPromises, 'access').mockResolvedValue(undefined);
    mkdirSpy = vi.spyOn(fsPromises, 'mkdir').mockResolvedValue(undefined as any);
  });

  describe('convertWordToPdf', () => {
    it('should successfully convert a Word document to PDF', async () => {
      const options = {
        inputPath: '/tmp/test-input.docx',
        outputDir: '/tmp/output',
        timeout: 120000,
      };

      // Start the conversion
      const conversionPromise = convertWordToPdf(options);

      // Wait a tick for async operations
      await new Promise(resolve => setImmediate(resolve));

      // Simulate successful conversion
      mockProcess.stdout.emit('data', Buffer.from('convert /tmp/test-input.docx -> /tmp/output/test-input.pdf'));
      mockProcess.emit('close', 0);

      const result = await conversionPromise;

      // Verify spawn was called with correct arguments
      expect(spawnSpy).toHaveBeenCalledWith(
        'libreoffice',
        [
          '--headless',
          '--convert-to',
          'pdf',
          '--outdir',
          '/tmp/output',
          '/tmp/test-input.docx',
        ],
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );

      // Verify result
      expect(result.success).toBe(true);
      expect(result.outputPath).toBe('/tmp/output/test-input.pdf');
      expect(result.error).toBeUndefined();

      // Verify output directory was created
      expect(mkdirSpy).toHaveBeenCalledWith('/tmp/output', { recursive: true });

      // Verify output file existence was checked
      expect(accessSpy).toHaveBeenCalledWith('/tmp/output/test-input.pdf');
    });

    it('should handle timeout by aborting the process', async () => {
      const { convertWordToPdf } = await import('./libreoffice');
      vi.useFakeTimers();

      const options = {
        inputPath: '/tmp/test-input.docx',
        outputDir: '/tmp/output',
        timeout: 5000,
      };

      // Start the conversion
      const conversionPromise = convertWordToPdf(options);

      // Wait for async setup
      await vi.advanceTimersByTimeAsync(0);

      // Fast-forward time to trigger timeout
      await vi.advanceTimersByTimeAsync(5000);

      // Simulate process close after abort
      mockProcess.emit('close', 1);

      const result = await conversionPromise;

      // Verify result indicates timeout
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
      expect(result.error).toContain('120 seconds');

      vi.useRealTimers();
    });

    it('should handle missing LibreOffice dependency (ENOENT error)', async () => {
      const { convertWordToPdf } = await import('./libreoffice');
      
      const options = {
        inputPath: '/tmp/test-input.docx',
        outputDir: '/tmp/output',
      };

      // Mock spawn to emit ENOENT error
      spawnSpy.mockImplementation(() => {
        const errorProcess = Object.assign(new EventEmitter(), {
          stdout: new EventEmitter(),
          stderr: new EventEmitter(),
          kill: vi.fn(),
        });

        // Emit error asynchronously
        setImmediate(() => {
          const error = new Error('spawn libreoffice ENOENT') as NodeJS.ErrnoException;
          error.code = 'ENOENT';
          errorProcess.emit('error', error);
        });

        return errorProcess as any;
      });

      const result = await convertWordToPdf(options);

      // Verify result indicates missing LibreOffice
      expect(result.success).toBe(false);
      expect(result.error).toContain('LibreOffice is not installed');
      expect(result.error).toContain('not available in PATH');
    });

    it('should handle missing LibreOffice dependency (stderr message)', async () => {
      const { convertWordToPdf } = await import('./libreoffice');
      
      const options = {
        inputPath: '/tmp/test-input.docx',
        outputDir: '/tmp/output',
      };

      // Start the conversion
      const conversionPromise = convertWordToPdf(options);

      // Wait a tick
      await new Promise(resolve => setImmediate(resolve));

      // Simulate command not found in stderr
      mockProcess.stderr.emit('data', Buffer.from('libreoffice: command not found'));
      mockProcess.emit('close', 127);

      const result = await conversionPromise;

      // Verify result indicates missing LibreOffice
      expect(result.success).toBe(false);
      expect(result.error).toContain('LibreOffice is not installed');
      expect(result.error).toContain('not available in PATH');
    });

    it('should handle invalid input file error', async () => {
      const { convertWordToPdf } = await import('./libreoffice');
      
      const options = {
        inputPath: '/tmp/non-existent.docx',
        outputDir: '/tmp/output',
      };

      // Mock fs.access to reject for input file
      accessSpy.mockImplementation((path: any) => {
        if (path === '/tmp/non-existent.docx') {
          return Promise.reject(new Error('ENOENT: no such file or directory'));
        }
        return Promise.resolve(undefined);
      });

      const result = await convertWordToPdf(options);

      // Verify result indicates input file error
      expect(result.success).toBe(false);
      expect(result.error).toContain('Input file does not exist');
      expect(result.error).toContain('not accessible');

      // Verify spawn was not called
      expect(spawnSpy).not.toHaveBeenCalled();
    });

    it('should handle output file not generated error', async () => {
      const { convertWordToPdf } = await import('./libreoffice');
      
      const options = {
        inputPath: '/tmp/test-input.docx',
        outputDir: '/tmp/output',
      };

      // Mock fs.access to succeed for input but fail for output
      accessSpy.mockImplementation((path: any) => {
        if (path === '/tmp/test-input.docx') {
          return Promise.resolve(undefined);
        }
        if (path === '/tmp/output/test-input.pdf') {
          return Promise.reject(new Error('ENOENT: no such file or directory'));
        }
        return Promise.resolve(undefined);
      });

      // Start the conversion
      const conversionPromise = convertWordToPdf(options);

      // Wait a tick
      await new Promise(resolve => setImmediate(resolve));

      // Simulate successful process exit but no output file
      mockProcess.emit('close', 0);

      const result = await conversionPromise;

      // Verify result indicates output file not generated
      expect(result.success).toBe(false);
      expect(result.error).toContain('output file was not generated');
    });

    it('should handle conversion failure with non-zero exit code', async () => {
      const { convertWordToPdf } = await import('./libreoffice');
      
      const options = {
        inputPath: '/tmp/test-input.docx',
        outputDir: '/tmp/output',
      };

      // Start the conversion
      const conversionPromise = convertWordToPdf(options);

      // Wait a tick
      await new Promise(resolve => setImmediate(resolve));

      // Simulate conversion failure
      mockProcess.stderr.emit('data', Buffer.from('Error: Invalid document format'));
      mockProcess.emit('close', 1);

      const result = await conversionPromise;

      // Verify result indicates conversion failure
      expect(result.success).toBe(false);
      expect(result.error).toContain('Conversion failed with exit code 1');
      expect(result.error).toContain('Invalid document format');
    });

    it('should use default timeout of 120000ms when not specified', async () => {
      const { convertWordToPdf } = await import('./libreoffice');
      
      const options = {
        inputPath: '/tmp/test-input.docx',
        outputDir: '/tmp/output',
      };

      // Start the conversion
      const conversionPromise = convertWordToPdf(options);

      // Wait a tick
      await new Promise(resolve => setImmediate(resolve));

      // Simulate successful conversion
      mockProcess.emit('close', 0);

      await conversionPromise;

      // Verify spawn was called (timeout is internal, we just verify it doesn't error)
      expect(spawnSpy).toHaveBeenCalled();
    });

    it('should handle output directory creation failure', async () => {
      const { convertWordToPdf } = await import('./libreoffice');
      
      const options = {
        inputPath: '/tmp/test-input.docx',
        outputDir: '/tmp/output',
      };

      // Mock mkdir to fail
      mkdirSpy.mockRejectedValue(new Error('Permission denied'));

      const result = await convertWordToPdf(options);

      // Verify result indicates directory creation failure
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create output directory');

      // Verify spawn was not called
      expect(spawnSpy).not.toHaveBeenCalled();
    });

    it('should capture and log stdout output', async () => {
      const { convertWordToPdf } = await import('./libreoffice');
      
      const options = {
        inputPath: '/tmp/test-input.docx',
        outputDir: '/tmp/output',
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Start the conversion
      const conversionPromise = convertWordToPdf(options);

      // Wait a tick
      await new Promise(resolve => setImmediate(resolve));

      // Simulate stdout output
      mockProcess.stdout.emit('data', Buffer.from('Converting document...'));
      mockProcess.stdout.emit('data', Buffer.from('Conversion complete'));
      mockProcess.emit('close', 0);

      await conversionPromise;

      // Verify stdout was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        '[INFO] LibreOffice stdout:',
        'Converting document...Conversion complete'
      );

      consoleSpy.mockRestore();
    });

    it('should capture and log stderr output', async () => {
      const { convertWordToPdf } = await import('./libreoffice');
      
      const options = {
        inputPath: '/tmp/test-input.docx',
        outputDir: '/tmp/output',
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Start the conversion
      const conversionPromise = convertWordToPdf(options);

      // Wait a tick
      await new Promise(resolve => setImmediate(resolve));

      // Simulate stderr output (warnings)
      mockProcess.stderr.emit('data', Buffer.from('Warning: Font not found'));
      mockProcess.emit('close', 0);

      await conversionPromise;

      // Verify stderr was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        '[INFO] LibreOffice stderr:',
        'Warning: Font not found'
      );

      consoleSpy.mockRestore();
    });

    it('should handle process error events', async () => {
      const { convertWordToPdf } = await import('./libreoffice');
      
      const options = {
        inputPath: '/tmp/test-input.docx',
        outputDir: '/tmp/output',
      };

      // Start the conversion
      const conversionPromise = convertWordToPdf(options);

      // Wait a tick then emit error
      await new Promise(resolve => setImmediate(resolve));
      mockProcess.emit('error', new Error('Unexpected process error'));

      const result = await conversionPromise;

      // Verify result indicates process error
      expect(result.success).toBe(false);
      expect(result.error).toContain('Process error');
      expect(result.error).toContain('Unexpected process error');
    });

    it('should handle files with different extensions correctly', async () => {
      const { convertWordToPdf } = await import('./libreoffice');
      
      const options = {
        inputPath: '/tmp/my-document.docx',
        outputDir: '/tmp/output',
      };

      // Start the conversion
      const conversionPromise = convertWordToPdf(options);

      // Wait a tick
      await new Promise(resolve => setImmediate(resolve));

      // Simulate successful conversion
      mockProcess.emit('close', 0);

      const result = await conversionPromise;

      // Verify output path has .pdf extension
      expect(result.success).toBe(true);
      expect(result.outputPath).toBe('/tmp/output/my-document.pdf');
    });

    it('should handle files with multiple dots in filename', async () => {
      const { convertWordToPdf } = await import('./libreoffice');
      
      const options = {
        inputPath: '/tmp/my.document.v2.docx',
        outputDir: '/tmp/output',
      };

      // Start the conversion
      const conversionPromise = convertWordToPdf(options);

      // Wait a tick
      await new Promise(resolve => setImmediate(resolve));

      // Simulate successful conversion
      mockProcess.emit('close', 0);

      const result = await conversionPromise;

      // Verify output path replaces only the last extension
      expect(result.success).toBe(true);
      expect(result.outputPath).toBe('/tmp/output/my.document.v2.pdf');
    });

    it('should log conversion start with options', async () => {
      const { convertWordToPdf } = await import('./libreoffice');
      
      const options = {
        inputPath: '/tmp/test-input.docx',
        outputDir: '/tmp/output',
        timeout: 60000,
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Start the conversion
      const conversionPromise = convertWordToPdf(options);

      // Wait a tick
      await new Promise(resolve => setImmediate(resolve));

      // Simulate successful conversion
      mockProcess.emit('close', 0);

      await conversionPromise;

      // Verify start was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        '[INFO] Starting LibreOffice conversion:',
        {
          inputPath: '/tmp/test-input.docx',
          outputDir: '/tmp/output',
          timeout: 60000,
        }
      );

      consoleSpy.mockRestore();
    });

    it('should log successful completion with output path', async () => {
      const { convertWordToPdf } = await import('./libreoffice');
      
      const options = {
        inputPath: '/tmp/test-input.docx',
        outputDir: '/tmp/output',
      };

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Start the conversion
      const conversionPromise = convertWordToPdf(options);

      // Wait a tick
      await new Promise(resolve => setImmediate(resolve));

      // Simulate successful conversion
      mockProcess.emit('close', 0);

      await conversionPromise;

      // Verify completion was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        '[INFO] LibreOffice conversion completed successfully:',
        '/tmp/output/test-input.pdf'
      );

      consoleSpy.mockRestore();
    });

    it('should handle unexpected errors gracefully', async () => {
      const { convertWordToPdf } = await import('./libreoffice');
      
      const options = {
        inputPath: '/tmp/test-input.docx',
        outputDir: '/tmp/output',
      };

      // Mock fs.mkdir to throw unexpected error
      mkdirSpy.mockRejectedValue(new Error('Unexpected filesystem error'));

      const result = await convertWordToPdf(options);

      // Verify result indicates unexpected error
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to create output directory');
    });
  });
});

