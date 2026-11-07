declare module 'sharp' {
  export interface OutputInfo {
    format: string;
    size: number;
    width: number;
    height: number;
    channels: number;
  }

  export interface Metadata {
    format?: string;
    width?: number;
    height?: number;
    channels?: number;
    hasAlpha?: boolean;
    orientation?: number;
  }

  export interface ResizeOptions {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    position?: number | string;
    withoutEnlargement?: boolean;
  }

  export interface WebpOptions {
    quality?: number;
    effort?: number;
    alphaQuality?: number;
  }

  export interface PngOptions {
    quality?: number;
    effort?: number;
  }

  export interface SharpInstance {
    metadata(): Promise<Metadata>;
    rotate(angle?: number): SharpInstance;
    resize(width?: number, height?: number, options?: ResizeOptions): SharpInstance;
    webp(options?: WebpOptions): SharpInstance;
    png(options?: PngOptions): SharpInstance;
    modulate(options?: { brightness?: number; saturation?: number; hue?: number }): SharpInstance;
    linear(a?: number, b?: number): SharpInstance;
    clone(): SharpInstance;
    toBuffer(): Promise<Buffer>;
  }

  export interface SharpFunction {
    (input?: Buffer | Uint8Array | string, options?: { failOn?: string; limitInputPixels?: number }): SharpInstance;
  }

  const sharp: SharpFunction;
  export default sharp;
}
