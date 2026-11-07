import { z } from 'zod';

export const SupportedImageMimeEnum = z.enum(['image/jpeg', 'image/png', 'image/webp']);
export type SupportedImageMime = z.infer<typeof SupportedImageMimeEnum>;

export const IngestOptionsSchema = z.object({
  removeBg: z.boolean().default(true).optional(),
  targetCategory: z.string().optional(),
  mockMode: z.boolean().default(false).optional(),
});
export type IngestOptions = z.infer<typeof IngestOptionsSchema>;

export function validateImageIngestInput(
  imageBuffer: Buffer | Uint8Array,
  mimeType: string
): { buffer: Buffer; mime: SupportedImageMime } {
  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error('empty_image_buffer');
  }

  const mimeParsed = SupportedImageMimeEnum.safeParse(mimeType);
  if (!mimeParsed.success) {
    throw new Error(`unsupported_image_mime: ${mimeType}`);
  }

  const buffer = Buffer.isBuffer(imageBuffer) ? imageBuffer : Buffer.from(imageBuffer);
  return { buffer, mime: mimeParsed.data };
}
