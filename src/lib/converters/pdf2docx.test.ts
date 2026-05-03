import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'events';

describe('pdf2docx Converter', () => {
  describe('convertPdfToWord', () => {
    it('should successfully convert a PDF document to Word', async () => {
      await vi.isolateModules(async () => {
        const childProcess = await import('child_process');
        const fsPromises = await import('fs/promises');
        const { convertPdfToWord } = await import('./pdf2docx');

        // Create mock process
        const mockProcess = Object.assign(new EventEmitter(), {
          stdout: new EventEmitter(),
          stderr: new EventEmitter(),
          kill: vi.fn(),
        });

        // Setup spies
        const spawnSpy = vi.spyOn(childProcess, 'spawn').mockReturnValue(mockProcess as any);
        vi.spyOn(fsPromises, 'access').mockResolvedValue(undefined);
        vi.spyOn(fsPromises, 'mkdir').mockResolvedValue(undefined as any);
        vi.spyOn(fsPromises, 'writeFile').mockResolvedValue(undefined);
        vi.spyOn(fsPromises, 'unlink').mockResolvedValue(undefined);

        const options = {
          inputPath: '/tmp/test-input.pdf',
          outputPath: '/tmp/output/test-output.docx',
          timeout: 120000,
        };

        // Start the conversion
        const conversionPromise = convertPdfToWord(options);

        // Wait a tick for async operations
        await new Promise(resolve => setImmediate(resolve));

        // Simulate successful conversion
        mockProcess.stdout.emit('data', Buffer.from('SUCCESS'));
        mockProcess.emit('close', 0);

        const result = await conversionPromise;

        // Verify spawn was called with correct arguments
        expect(spawnSpy).toHaveBeenCalledWith(
          'python3',
          expect.arrayContaining([
            expect.stringMatching(/pdf2docx_.*\.py$/),
            '/tmp/test-input.pdf',
            '/tmp/output/test-output.docx',
          ]),
          expect.objectContaining({
            signal: expect.any(AbortSignal),
          })
        );

        // Verify result
        expect(result.success).toBe(true);
        expect(result.outputPath).toBe('/tmp/output/test-output.docx');
        expect(result.error).toBeUndefined();
      });
    });

    it('should handle timeout by aborting the process', async () => {
      await vi.isolateModules(async () => {
        vi.useFakeTimers();

        const childProcess = await import('child_process');
        const fsPromises = await import('fs/promises');
        const { convertPdfToWord } = await import('./pdf2docx');

        const mockProcess = Object.assign(new EventEmitter(), {
          stdout: new EventEmitter(),
          stderr: new EventEmitter(),
          kill: vi.fn(),
        });

        vi.spyOn(childProcess, 'spawn').mockReturnValue(mockProcess as any);
        vi.spyOn(fsPromises, 'access').mockResolvedValue(undefined);
        vi.spyOn(fsPromises, 'mkdir').mockResolvedValue(undefined as any);
        vi.spyOn(fsPromises, 'writeFile').mockResolvedValue(undefined);
        vi.spyOn(fsPromises, 'unlink').mockResolvedValue(undefined);

        const options = {
          inputPath: '/tmp/test-input.pdf',
          outputPath: '/tmp/output/test-output.docx',
          timeout: 5000,
        };

        const conversionPromise = convertPdfToWord(options);
        await vi.advanceTimersByTimeAsync(0);
        await vi.advanceTimersByTimeAsync(5000);
        mockProcess.emit('close', 1);

        const result = await conversionPromise;

        expect(result.success).toBe(false);
        expect(result.error).toContain('timeout');
        expect(result.error).toContain('120 seconds');

        vi.useRealTimers();
      });
    });

    it('should handle missing Python dependency (ENOENT error)', async () => {
      await vi.isolateModules(async () => {
        const childProcess = await import('child_process');
        const fsPromises = await import('fs/promises');
        const { convertPdfToWord } = await import('./pdf2docx');

        vi.spyOn(fsPromises, 'access').mockResolvedValue(undefined);
        vi.spyOn(fsPromises, 'mkdir').mockResolvedValue(undefined as any);
        vi.spyOn(fsPromises, 'writeFile').mockResolvedValue(undefined);
        vi.spyOn(fsPromises, 'unlink').mockResolvedValue(undefined);

        vi.spyOn(childProcess, 'spawn').mockImplementation(() => {
          const errorProcess = Object.assign(new EventEmitter(), {
            stdout: new EventEmitter(),
            stderr: new EventEmitter(),
            kill: vi.fn(),
          });

          setImmediate(() => {
            const error = new Error('spawn python3 ENOENT') as NodeJS.ErrnoException;
            error.code = 'ENOENT';
            errorProcess.emit('error', error);
          });

          return errorProcess as any;
        });

        const options = {
          inputPath: '/tmp/test-input.pdf',
          outputPath: '/tmp/output/test-output.docx',
        };

        const result = await convertPdfToWord(options);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Python is not installed');
        expect(result.error).toContain('not available in PATH');
      });
    });

    it('should handle missing Python dependency (stderr message)', async () => {
      await vi.isolateModules(async () => {
        const childProcess = await import('child_process');
        const fsPromises = await import('fs/promises');
        const { convertPdfToWord } = await import('./pdf2docx');

        const mockProcess = Object.assign(new EventEmitter(), {
          stdout: new EventEmitter(),
          stderr: new EventEmitter(),
          kill: vi.fn(),
        });

        vi.spyOn(childProcess, 'spawn').mockReturnValue(mockProcess as any);
        vi.spyOn(fsPromises, 'access').mockResolvedValue(undefined);
        vi.spyOn(fsPromises, 'mkdir').mockResolvedValue(undefined as any);
        vi.spyOn(fsPromises, 'writeFile').mockResolvedValue(undefined);
        vi.spyOn(fsPromises, 'unlink').mockResolvedValue(undefined);

        const options = {
          inputPath: '/tmp/test-input.pdf',
          outputPath: '/tmp/output/test-output.docx',
        };

        const conversionPromise = convertPdfToWord(options);
        await new Promise(resolve => setImmediate(resolve));

        mockProcess.stderr.emit('data', Buffer.from('python3: command not found'));
        mockProcess.emit('close', 127);

        const result = await conversionPromise;

        expect(result.success).toBe(false);
        expect(result.error).toContain('Python is not installed');
        expect(result.error).toContain('not available in PATH');
      });
    });

    it('should handle missing pdf2docx library error', async () => {
      await vi.isolateModules(async () => {
        const childProcess = await import('child_process');
        const fsPromises = await import('fs/promises');
        const { convertPdfToWord } = await import('./pdf2docx');

        const mockProcess = Object.assign(new EventEmitter(), {
          stdout: new EventEmitter(),
          stderr: new EventEmitter(),
          kill: vi.fn(),
        });

        vi.spyOn(childProcess, 'spawn').mockReturnValue(mockProcess as any);
        vi.spyOn(fsPromises, 'access').mockResolvedValue(undefined);
        vi.spyOn(fsPromises, 'mkdir').mockResolvedValue(undefined as any);
        vi.spyOn(fsPromises, 'writeFile').mockResolvedValue(undefined);
        vi.spyOn(fsPromises, 'unlink').mockResolvedValue(undefined);

        const options = {
          inputPath: '/tmp/test-input.pdf',
          outputPath: '/tmp/output/test-output.docx',
        };

        const conversionPromise = convertPdfToWord(options);
        await new Promise(resolve => setImmediate(resolve));

        mockProcess.stderr.emit('data', Buffer.from('ModuleNotFoundError: No module named \'pdf2docx\''));
        mockProcess.emit('close', 1);

        const result = await conversionPromise;

        expect(result.success).toBe(false);
        expect(result.error).toContain('pdf2docx library is not installed');
        expect(result.error).toContain('pip3 install pdf2docx');
      });
    });

    it('should handle invalid PDF file error', async () => {
      await vi.isolateModules(async () => {
        const childProcess = await import('child_process');
        const fsPromises = await import('fs/promises');
        const { convertPdfToWord } = await import('./pdf2docx');

        const mockProcess = Object.assign(new EventEmitter(), {
          stdout: new EventEmitter(),
          stderr: new EventEmitter(),
          kill: vi.fn(),
        });

        vi.spyOn(childProcess, 'spawn').mockReturnValue(mockProcess as any);
        vi.spyOn(fsPromises, 'access').mockResolvedValue(undefined);
        vi.spyOn(fsPromises, 'mkdir').mockResolvedValue(undefined as any);
        vi.spyOn(fsPromises, 'writeFile').mockResolvedValue(undefined);
        vi.spyOn(fsPromises, 'unlink').mockResolvedValue(undefined);

        const options = {
          inputPath: '/tmp/invalid.pdf',
          outputPath: '/tmp/output/test-output.docx',
        };

        const conversionPromise = convertPdfToWord(options);
        await new Promise(resolve => setImmediate(resolve));

        mockProcess.stderr.emit('data', Buffer.from('ERROR: invalid PDF structure'));
        mockProcess.emit('close', 1);

        const result = await conversionPromise;

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid PDF file format');
        expect(result.error).toContain('corrupted PDF file');
      });
    });

    it('should handle input file does not exist error', async () => {
      await vi.isolateModules(async () => {
        const childProcess = await import('child_process');
        const fsPromises = await import('fs/promises');
        const { convertPdfToWord } = await import('./pdf2docx');

        const spawnSpy = vi.spyOn(childProcess, 'spawn');
        vi.spyOn(fsPromises, 'access').mockImplementation((path: any) => {
          if (path === '/tmp/non-existent.pdf') {
            return Promise.reject(new Error('ENOENT: no such file or directory'));
          }
          return Promise.resolve(undefined);
        });
        vi.spyOn(fsPromises, 'mkdir').mockResolvedValue(undefined as any);
        vi.spyOn(fsPromises, 'writeFile').mockResolvedValue(undefined);
        vi.spyOn(fsPromises, 'unlink').mockResolvedValue(undefined);

        const options = {
          inputPath: '/tmp/non-existent.pdf',
          outputPath: '/tmp/output/test-output.docx',
        };

        const result = await convertPdfToWord(options);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Input file does not exist');
        expect(result.error).toContain('not accessible');
        expect(spawnSpy).not.toHaveBeenCalled();
      });
    });

    it('should handle output file not generated error', async () => {
      await vi.isolateModules(async () => {
        const childProcess = await import('child_process');
        const fsPromises = await import('fs/promises');
        const { convertPdfToWord } = await import('./pdf2docx');

        const mockProcess = Object.assign(new EventEmitter(), {
          stdout: new EventEmitter(),
          stderr: new EventEmitter(),
          kill: vi.fn(),
        });

        vi.spyOn(childProcess, 'spawn').mockReturnValue(mockProcess as any);
        vi.spyOn(fsPromises, 'access').mockImplementation((path: any) => {
          if (path === '/tmp/test-input.pdf') {
            return Promise.resolve(undefined);
          }
          if (path === '/tmp/output/test-output.docx') {
            return Promise.reject(new Error('ENOENT: no such file or directory'));
          }
          return Promise.resolve(undefined);
        });
        vi.spyOn(fsPromises, 'mkdir').mockResolvedValue(undefined as any);
        vi.spyOn(fsPromises, 'writeFile').mockResolvedValue(undefined);
        vi.spyOn(fsPromises, 'unlink').mockResolvedValue(undefined);

        const options = {
          inputPath: '/tmp/test-input.pdf',
          outputPath: '/tmp/output/test-output.docx',
        };

        const conversionPromise = convertPdfToWord(options);
        await new Promise(resolve => setImmediate(resolve));

        mockProcess.stdout.emit('data', Buffer.from('SUCCESS'));
        mockProcess.emit('close', 0);

        const result = await conversionPromise;

        expect(result.success).toBe(false);
        expect(result.error).toContain('output file was not generated');
      });
    });

    it('should handle output directory creation failure', async () => {
      await vi.isolateModules(async () => {
        const childProcess = await import('child_process');
        const fsPromises = await import('fs/promises');
        const { convertPdfToWord } = await import('./pdf2docx');

        const spawnSpy = vi.spyOn(childProcess, 'spawn');
        vi.spyOn(fsPromises, 'access').mockResolvedValue(undefined);
        vi.spyOn(fsPromises, 'mkdir').mockRejectedValue(new Error('Permission denied'));
        vi.spyOn(fsPromises, 'writeFile').mockResolvedValue(undefined);
        vi.spyOn(fsPromises, 'unlink').mockResolvedValue(undefined);

        const options = {
          inputPath: '/tmp/test-input.pdf',
          outputPath: '/tmp/output/test-output.docx',
        };

        const result = await convertPdfToWord(options);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to create output directory');
        expect(spawnSpy).not.toHaveBeenCalled();
      });
    });

    it('should clean up Python script on error', async () => {
      await vi.isolateModules(async () => {
        const childProcess = await import('child_process');
        const fsPromises = await import('fs/promises');
        const { convertPdfToWord } = await import('./pdf2docx');

        const mockProcess = Object.assign(new EventEmitter(), {
          stdout: new EventEmitter(),
          stderr: new EventEmitter(),
          kill: vi.fn(),
        });

        vi.spyOn(childProcess, 'spawn').mockReturnValue(mockProcess as any);
        vi.spyOn(fsPromises, 'access').mockResolvedValue(undefined);
        vi.spyOn(fsPromises, 'mkdir').mockResolvedValue(undefined as any);
        vi.spyOn(fsPromises, 'writeFile').mockResolvedValue(undefined);
        const unlinkSpy = vi.spyOn(fsPromises, 'unlink').mockResolvedValue(undefined);

        const options = {
          inputPath: '/tmp/test-input.pdf',
          outputPath: '/tmp/output/test-output.docx',
        };

        const conversionPromise = convertPdfToWord(options);
        await new Promise(resolve => setImmediate(resolve));

        mockProcess.stderr.emit('data', Buffer.from('ERROR: Conversion failed'));
        mockProcess.emit('close', 1);

        await conversionPromise;

        expect(unlinkSpy).toHaveBeenCalledWith(expect.stringMatching(/pdf2docx_.*\.py$/));
      });
    });

    it('should handle unexpected errors gracefully', async () => {
      await vi.isolateModules(async () => {
        const childProcess = await import('child_process');
        const fsPromises = await import('fs/promises');
        const { convertPdfToWord } = await import('./pdf2docx');

        vi.spyOn(childProcess, 'spawn');
        vi.spyOn(fsPromises, 'access').mockResolvedValue(undefined);
        vi.spyOn(fsPromises, 'mkdir').mockResolvedValue(undefined as any);
        vi.spyOn(fsPromises, 'writeFile').mockRejectedValue(new Error('Unexpected filesystem error'));
        vi.spyOn(fsPromises, 'unlink').mockResolvedValue(undefined);

        const options = {
          inputPath: '/tmp/test-input.pdf',
          outputPath: '/tmp/output/test-output.docx',
        };

        const result = await convertPdfToWord(options);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Unexpected error during conversion');
      });
    });
  });
});
