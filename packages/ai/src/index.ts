import { AiProductIngestionService } from './service/ingestion-service.js';
import type { IngestOptions } from './schemas/ingestion.schema.js';
import type { ProcessedProductDraft, DraftUpdateInput, PublishDraftResult } from './types/draft.js';

export * from './types/index.js';
export * from './schemas/index.js';
export * from './mock/index.js';
export * from './vision/index.js';
export * from './image/index.js';
export * from './draft/index.js';
export * from './service/index.js';

// Default global singleton service instance for standalone helper calls
const defaultAiService = new AiProductIngestionService();

export interface IngestProductImageInputObject {
  imageBuffer: Buffer | Uint8Array;
  mimeType: string;
  options?: IngestOptions;
}

/**
 * Ingest product photo and extract bilingual structured metadata
 * Supports both single-object contract input and positional arguments
 */
export async function ingestProductImage(
  input: IngestProductImageInputObject
): Promise<ProcessedProductDraft>;
export async function ingestProductImage(
  imageBuffer: Buffer | Uint8Array,
  mimeType: string,
  options?: IngestOptions
): Promise<ProcessedProductDraft>;
export async function ingestProductImage(
  inputOrBuffer: IngestProductImageInputObject | Buffer | Uint8Array,
  maybeMimeType?: string,
  maybeOptions?: IngestOptions
): Promise<ProcessedProductDraft> {
  if (Buffer.isBuffer(inputOrBuffer) || inputOrBuffer instanceof Uint8Array) {
    return defaultAiService.ingestImage(inputOrBuffer, maybeMimeType!, maybeOptions);
  }
  return defaultAiService.ingestImage(
    inputOrBuffer.imageBuffer,
    inputOrBuffer.mimeType,
    inputOrBuffer.options
  );
}

export function updateDraft(
  draftId: string,
  updates: DraftUpdateInput
): ProcessedProductDraft {
  return defaultAiService.updateDraft(draftId, updates);
}

export function publishDraft(draftId: string): PublishDraftResult {
  return defaultAiService.publishDraft(draftId);
}

export function getDraft(draftId: string): ProcessedProductDraft | undefined {
  return defaultAiService.getDraft(draftId);
}
