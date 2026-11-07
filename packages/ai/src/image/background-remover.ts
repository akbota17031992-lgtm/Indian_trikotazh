import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface BackgroundRemovalResult {
  buffer: Buffer;
  backgroundRemoved: boolean;
  fallbackApplied: boolean;
}

export class BackgroundRemover {
  private scriptPath: string;
  private pythonBin: string;

  constructor(customPythonBin?: string) {
    this.pythonBin = customPythonBin || process.env.PYTHON_BIN || 'python';
    try {
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      this.scriptPath = path.resolve(currentDir, '../../scripts/remove_bg.py');
    } catch {
      this.scriptPath = path.resolve(process.cwd(), 'scripts/remove_bg.py');
    }
  }

  async removeBackground(
    inputBuffer: Buffer,
    hasAlpha: boolean,
    options: { mockMode?: boolean; timeoutMs?: number } = {}
  ): Promise<BackgroundRemovalResult> {
    // In mock mode or offline testing, execute fallback directly
    if (options.mockMode || process.env.NODE_ENV === 'test') {
      return this.applySharpFallback(inputBuffer, hasAlpha);
    }

    try {
      const cutout = await this.executePythonRembg(inputBuffer, options.timeoutMs ?? 10000);
      return {
        buffer: cutout,
        backgroundRemoved: true,
        fallbackApplied: false,
      };
    } catch {
      // Graceful fallback on rembg absence, timeout, or execution crash
      return this.applySharpFallback(inputBuffer, hasAlpha);
    }
  }

  private async executePythonRembg(buffer: Buffer, timeoutMs: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.pythonBin, [this.scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      });

      const stdoutChunks: Buffer[] = [];
      const stderrChunks: Buffer[] = [];

      const timer = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('rembg_timeout'));
      }, timeoutMs);

      child.stdout.on('data', (c) => stdoutChunks.push(c));
      child.stderr.on('data', (c) => stderrChunks.push(c));

      child.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0 && stdoutChunks.length > 0) {
          resolve(Buffer.concat(stdoutChunks));
        } else {
          const stderr = Buffer.concat(stderrChunks).toString('utf8');
          reject(new Error(`rembg_failed_code_${code}: ${stderr}`));
        }
      });

      child.stdin.write(buffer);
      child.stdin.end();
    });
  }

  private async applySharpFallback(
    buffer: Buffer,
    hasAlpha: boolean
  ): Promise<BackgroundRemovalResult> {
    try {
      const sharpModule = await import('sharp').then((m) => m.default || m).catch(() => null);
      if (sharpModule) {
        if (hasAlpha) {
          const output = await sharpModule(buffer).png().toBuffer();
          return { buffer: output, backgroundRemoved: true, fallbackApplied: true };
        }
        const output = await sharpModule(buffer)
          .modulate({ brightness: 1.02, saturation: 1.05 })
          .linear(1.08, -10)
          .png()
          .toBuffer();
        return { buffer: output, backgroundRemoved: false, fallbackApplied: true };
      }
    } catch {
      // If sharp is not loaded or fails, pass through original buffer
    }

    return {
      buffer,
      backgroundRemoved: hasAlpha,
      fallbackApplied: true,
    };
  }
}

export const defaultBackgroundRemover = new BackgroundRemover();

export async function removeBackgroundGraceful(
  imageBuffer: Buffer,
  hasAlpha = false,
  options: { mockMode?: boolean; timeoutMs?: number } = {}
): Promise<Buffer> {
  const result = await defaultBackgroundRemover.removeBackground(imageBuffer, hasAlpha, options);
  return result.buffer;
}
