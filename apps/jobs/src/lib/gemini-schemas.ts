/**
 * Gemini APIレスポンスのZodスキーマ
 *
 * LLMの出力を型安全に検証するためのスキーマ定義。
 */
import { z } from "zod";

/**
 * カテゴリ分類結果のスキーマ
 */
export const CategoryClassificationSchema = z.object({
  slug: z.string(),
  confidence: z.number().min(0).max(1),
});

export type CategoryClassification = z.infer<typeof CategoryClassificationSchema>;

/**
 * 記事分類・要約結果のスキーマ
 */
export const ClassificationResultSchema = z.object({
  summary: z.string().max(500),
  categories: z.array(CategoryClassificationSchema).max(3),
});

export type ClassificationResult = z.infer<typeof ClassificationResultSchema>;

/**
 * Embeddingベクトルのスキーマ
 */
export const EmbeddingVectorSchema = z.array(z.number()).length(768);

export type EmbeddingVector = z.infer<typeof EmbeddingVectorSchema>;
