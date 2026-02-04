/**
 * Gemini APIクライアント
 *
 * @google/genai SDK経由でGemini 3 Flash（LLM）とtext-embedding-004（Embeddings）を呼び出す。
 * Vertex AIモード（ADC認証）で動作。
 */
import { GoogleGenAI } from "@google/genai";
import { ResultAsync } from "neverthrow";
import { type AIError, ClassificationError, EmbeddingError, RateLimitError } from "./ai-errors.js";
import {
  type ClassificationResult,
  ClassificationResultSchema,
  type EmbeddingVector,
} from "./gemini-schemas.js";

const getConfig = () => {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  // Gemini 3モデルはglobalロケーションでのみ利用可能
  const location = process.env.VERTEX_AI_LOCATION ?? "global";

  if (!projectId) {
    throw new Error("GOOGLE_CLOUD_PROJECT environment variable is required");
  }

  return { projectId, location };
};

const createClient = () => {
  const { projectId, location } = getConfig();
  return new GoogleGenAI({
    vertexai: true,
    project: projectId,
    location,
  });
};

/**
 * カテゴリ一覧（LLMに提示する選択肢）
 */
const CATEGORY_SLUGS = [
  "tech",
  "ai-ml",
  "web-dev",
  "mobile",
  "devops",
  "security",
  "business",
  "startup",
  "design",
  "career",
  "lifestyle",
  "news",
] as const;

/**
 * 記事分類・要約のプロンプト
 */
const buildClassificationPrompt = (title: string, content: string): string => `
あなたは記事分類・要約の専門家です。以下の記事を分析し、JSON形式で回答してください。

## 記事
タイトル: ${title}

本文:
${content.slice(0, 3000)}

## 指示
1. 記事の要約を日本語で100-200文字程度で作成してください
2. 以下のカテゴリから最大3つを選び、各カテゴリの適合度（0.0-1.0）を判定してください

利用可能なカテゴリ:
${CATEGORY_SLUGS.map((slug) => `- ${slug}`).join("\n")}

## 出力形式（JSON）
{
  "summary": "記事の要約...",
  "categories": [
    {"slug": "tech", "confidence": 0.9},
    {"slug": "ai-ml", "confidence": 0.7}
  ]
}

JSONのみを出力し、他の説明は不要です。
`;

export const geminiClient = {
  /**
   * 記事を分類・要約する
   */
  classifyAndSummarize: (content: {
    title: string;
    content: string;
  }): ResultAsync<ClassificationResult, AIError> => {
    return ResultAsync.fromPromise(
      (async () => {
        const client = createClient();
        const prompt = buildClassificationPrompt(content.title, content.content);

        const response = await client.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
        });

        const text = response.text;

        if (!text) {
          throw new ClassificationError("Empty response from Gemini");
        }

        // JSONを抽出（マークダウンコードブロックを考慮）
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new ClassificationError(`Failed to parse JSON from response: ${text}`);
        }

        const parsed = JSON.parse(jsonMatch[0]);
        const validated = ClassificationResultSchema.safeParse(parsed);

        if (!validated.success) {
          throw new ClassificationError(`Invalid response format: ${validated.error.message}`);
        }

        return validated.data;
      })(),
      (e) => {
        if (e instanceof ClassificationError) {
          return e;
        }
        const message = e instanceof Error ? e.message : "Unknown error";
        if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
          return new RateLimitError(`Rate limit exceeded: ${message}`, e);
        }
        return new ClassificationError(`Classification failed: ${message}`, e);
      },
    );
  },

  /**
   * テキストからEmbeddingベクトルを生成する
   */
  generateEmbedding: (text: string): ResultAsync<EmbeddingVector, AIError> => {
    return ResultAsync.fromPromise(
      (async () => {
        const client = createClient();

        const response = await client.models.embedContent({
          model: "text-embedding-004",
          contents: text,
          config: {
            taskType: "RETRIEVAL_DOCUMENT",
          },
        });

        const values = response.embeddings?.[0]?.values;

        if (!values || values.length !== 768) {
          throw new EmbeddingError(
            `Invalid embedding dimension: expected 768, got ${values?.length ?? 0}`,
          );
        }

        return values as EmbeddingVector;
      })(),
      (e) => {
        if (e instanceof EmbeddingError) {
          return e;
        }
        const message = e instanceof Error ? e.message : "Unknown error";
        if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
          return new RateLimitError(`Rate limit exceeded: ${message}`, e);
        }
        return new EmbeddingError(`Embedding failed: ${message}`, e);
      },
    );
  },

  /**
   * 複数テキストからEmbeddingベクトルをバッチ生成する
   */
  generateEmbeddingBatch: (texts: string[]): ResultAsync<EmbeddingVector[], AIError> => {
    return ResultAsync.fromPromise(
      (async () => {
        const client = createClient();

        // バッチ処理: 各テキストを順次処理
        // 大量の場合は並列化も検討
        const embeddings: EmbeddingVector[] = [];

        for (const text of texts) {
          const response = await client.models.embedContent({
            model: "text-embedding-004",
            contents: text,
            config: {
              taskType: "RETRIEVAL_DOCUMENT",
            },
          });

          const values = response.embeddings?.[0]?.values;

          if (!values || values.length !== 768) {
            throw new EmbeddingError(
              `Invalid embedding dimension: expected 768, got ${values?.length ?? 0}`,
            );
          }

          embeddings.push(values as EmbeddingVector);
        }

        return embeddings;
      })(),
      (e) => {
        if (e instanceof EmbeddingError) {
          return e;
        }
        const message = e instanceof Error ? e.message : "Unknown error";
        if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
          return new RateLimitError(`Rate limit exceeded: ${message}`, e);
        }
        return new EmbeddingError(`Embedding batch failed: ${message}`, e);
      },
    );
  },
};
