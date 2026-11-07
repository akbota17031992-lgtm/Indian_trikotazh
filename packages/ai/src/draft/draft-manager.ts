import { DraftUpdateSchema } from '../schemas/draft.schema.js';
import type { ProductDraft, DraftUpdateInput, PublishDraftResult } from '../types/draft.js';

export class ProductDraftManager {
  private drafts = new Map<string, ProductDraft>();

  public saveDraft(draft: ProductDraft): void {
    this.drafts.set(draft.id, draft);
  }

  public getDraft(id: string): ProductDraft | undefined {
    return this.drafts.get(id);
  }

  public listDrafts(): ProductDraft[] {
    return Array.from(this.drafts.values());
  }

  public updateDraft(draftId: string, updates: DraftUpdateInput): ProductDraft {
    const draft = this.drafts.get(draftId);
    if (!draft) {
      throw new Error('draft_not_found');
    }
    if (draft.status === 'published') {
      throw new Error('cannot_modify_published_draft');
    }
    if (draft.status === 'discarded') {
      throw new Error('cannot_modify_discarded_draft');
    }

    // Direct check for suggestedPriceKzt invariant before Zod schema parse
    if (updates.suggestedPriceKzt !== undefined) {
      if (!Number.isInteger(updates.suggestedPriceKzt) || updates.suggestedPriceKzt <= 0) {
        throw new Error('suggested_price_must_be_whole_tenge');
      }
    }

    // Validate updates with Zod schema
    const parsed = DraftUpdateSchema.parse(updates);

    if (parsed.name_ru !== undefined) draft.metadata.name_ru = parsed.name_ru;
    if (parsed.name_kz !== undefined) draft.metadata.name_kz = parsed.name_kz;
    if (parsed.description_ru !== undefined) draft.metadata.description_ru = parsed.description_ru;
    if (parsed.description_kz !== undefined) draft.metadata.description_kz = parsed.description_kz;
    if (parsed.category !== undefined) draft.metadata.category = parsed.category;
    if (parsed.subcategory !== undefined) draft.metadata.subcategory = parsed.subcategory;
    if (parsed.colors !== undefined) draft.metadata.colors = parsed.colors;
    if (parsed.material !== undefined) draft.metadata.material = parsed.material;
    if (parsed.season !== undefined) draft.metadata.season = parsed.season;
    if (parsed.gender !== undefined) draft.metadata.gender = parsed.gender;
    if (parsed.tags !== undefined) draft.metadata.tags = parsed.tags;

    if (parsed.suggestedPriceKzt !== undefined) {
      draft.metadata.suggestedPriceKzt = parsed.suggestedPriceKzt;
    }

    if (parsed.variants !== undefined) {
      draft.variants = parsed.variants;
    }

    draft.updatedAt = new Date().toISOString();
    return draft;
  }

  public publishDraft(draftId: string): PublishDraftResult {
    const draft = this.drafts.get(draftId);
    if (!draft) {
      throw new Error('draft_not_found');
    }
    if (draft.status === 'published') {
      throw new Error('draft_already_published');
    }
    if (draft.status === 'discarded') {
      throw new Error('cannot_publish_discarded_draft');
    }

    const cleanId = draft.id.startsWith('draft_') ? draft.id.replace('draft_', '') : draft.id;
    const productId = `prod_${cleanId}`;
    const publishedAt = new Date().toISOString();

    draft.status = 'published';
    draft.publishedProductId = productId;
    draft.updatedAt = publishedAt;

    return {
      productId,
      publishedAt,
    };
  }

  public discardDraft(draftId: string): void {
    const draft = this.drafts.get(draftId);
    if (!draft) {
      throw new Error('draft_not_found');
    }
    if (draft.status === 'published') {
      throw new Error('cannot_modify_published_draft');
    }
    draft.status = 'discarded';
    draft.updatedAt = new Date().toISOString();
  }

  public clear(): void {
    this.drafts.clear();
  }
}
