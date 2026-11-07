import { GEMINI_SYSTEM_INSTRUCTION, buildVisionPrompt } from './prompt.js';
import { geminiProductExtractionSchema } from './schema.js';
import { AiClothingMetadataSchema } from '../schemas/metadata.schema.js';
import type { AiClothingMetadata } from '../types/metadata.js';
import { MockProductAnalyzer } from '../mock/mock-analyzer.js';

export interface GeminiClientConfig {
  apiKey?: string;
  modelName?: string;
  maxDimension?: number;
}

export class GeminiVisionClient {
  private apiKey?: string;
  private modelName: string;
  private mockAnalyzer: MockProductAnalyzer;

  constructor(config: GeminiClientConfig = {}) {
    const key = config.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    this.modelName = config.modelName || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.mockAnalyzer = new MockProductAnalyzer();

    if (key && key.trim().length > 0 && !key.startsWith('mock')) {
      this.apiKey = key.trim();
    }
  }

  public isLiveMode(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0 && !this.apiKey.startsWith('mock'));
  }

  public async analyzeApparelPhoto(
    imageBuffer: Buffer,
    mimeType: string,
    targetCategoryHint?: string
  ): Promise<AiClothingMetadata> {
    // 1. Transparent fallback to mock if API key is not configured or mock mode active
    if (!this.isLiveMode()) {
      return this.mockAnalyzer.generateMetadata(imageBuffer, targetCategoryHint);
    }

    try {
      // 2. Multimodal API request via Google Generative AI REST endpoint
      const prompt = buildVisionPrompt(targetCategoryHint);
      const base64Data = imageBuffer.toString('base64');

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
              {
                text: `${GEMINI_SYSTEM_INSTRUCTION}\n\n${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          response_schema: geminiProductExtractionSchema,
          temperature: 0.2,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Gemini API HTTP error ${response.status}: ${await response.text()}`);
      }

      const data = (await response.json()) as any;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('Empty text content received from Gemini Vision API');
      }

      const parsedJson = JSON.parse(text);
      return AiClothingMetadataSchema.parse(parsedJson);
    } catch (err: any) {
      // Graceful fallback on rate limit (HTTP 429), auth error, or network fault
      console.warn(
        `[GeminiVisionClient] Remote vision API call failed (${err?.message || err}). Falling back to MockProductAnalyzer.`
      );
      return this.mockAnalyzer.generateMetadata(imageBuffer, targetCategoryHint);
    }
  }
}
