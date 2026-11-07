import { validateImageIngestInput, type IngestOptions } from '../schemas/ingestion.schema.js';
import type { ProcessedProductDraft, DraftUpdateInput, PublishDraftResult } from '../types/draft.js';
import { GeminiVisionClient } from '../vision/gemini-client.js';
import { ImagePipeline } from '../image/pipeline.js';
import { ProductDraftManager } from '../draft/draft-manager.js';
import { MockProductAnalyzer } from '../mock/mock-analyzer.js';

export class AiProductIngestionService {
  private visionClient: GeminiVisionClient;
  private imagePipeline: ImagePipeline;
  private draftManager: ProductDraftManager;
  private mockAnalyzer: MockProductAnalyzer;

  constructor(
    visionClient?: GeminiVisionClient,
    imagePipeline?: ImagePipeline,
    draftManager?: ProductDraftManager
  ) {
    this.visionClient = visionClient || new GeminiVisionClient();
    this.imagePipeline = imagePipeline || new ImagePipeline();
    this.draftManager = draftManager || new ProductDraftManager();
    this.mockAnalyzer = new MockProductAnalyzer();
  }

  /**
   * Process product photo and extract bilingual structured metadata
   */
  async ingestImage(
    imageBuffer: Buffer | Uint8Array,
    mimeType: string,
    options: IngestOptions = { removeBg: true, mockMode: false }
  ): Promise<ProcessedProductDraft & { id: string; status: 'draft' }> {
    // 1. Strict input validation
    const { buffer, mime } = validateImageIngestInput(imageBuffer, mimeType);

    const draftId = `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 2. Multimodal Vision Extraction (Gemini Vision API or Mock fallback)
    const metadata = options.mockMode
      ? this.mockAnalyzer.generateMetadata(buffer, options.targetCategory)
      : await this.visionClient.analyzeApparelPhoto(buffer, mime, options.targetCategory);

    // 3. Image Processing: Normalization, Background Removal, WebP Resizing
    const processedImages = await this.imagePipeline.process(buffer, mime, {
      removeBg: options.removeBg,
      mockMode: options.mockMode,
    });

    // 4. Default Variants Generation (S, M, L with unique SKUs)
    const variants = this.mockAnalyzer.generateDefaultVariants(draftId, metadata);

    const draft: ProcessedProductDraft = {
      id: draftId,
      status: 'draft',
      metadata,
      images: {
        thumbnail: processedImages.thumbnail,
        card: processedImages.card,
        full: processedImages.full,
      },
      variants,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.draftManager.saveDraft(draft);

    return draft as ProcessedProductDraft & { id: string; status: 'draft' };
  }

  updateDraft(
    draftId: string,
    updates: DraftUpdateInput
  ): ProcessedProductDraft & { id: string; status: 'draft' } {
    return this.draftManager.updateDraft(draftId, updates) as ProcessedProductDraft & {
      id: string;
      status: 'draft';
    };
  }

  publishDraft(draftId: string): PublishDraftResult {
    return this.draftManager.publishDraft(draftId);
  }

  getDraft(id: string): ProcessedProductDraft | undefined {
    return this.draftManager.getDraft(id);
  }

  listDrafts(): ProcessedProductDraft[] {
    return this.draftManager.listDrafts();
  }

  discardDraft(draftId: string): void {
    this.draftManager.discardDraft(draftId);
  }
}
