# パーソナライズアルゴリズム Eval計画書

## 1. 概要

Curioのパーソナライズアルゴリズムの品質を定量的・定性的に評価するためのEval計画。

### 評価対象コンポーネント

| コンポーネント | ファイル | 役割 |
|--------------|---------|------|
| ベクトル検索 | `personalization.service.ts` | コサイン類似度によるセマンティック検索 |
| ベクトル計算 | `vector.service.ts` | ユーザー興味ベクトルの生成（加重平均+時間減衰） |
| リランキング | `personalization.service.ts` | カテゴリスコアによる再順位付け（60%ベクトル/40%カテゴリ） |
| カテゴリ嗜好更新 | `preference.service.ts` | インタラクションに基づくスコア更新 |

---

## 2. 評価フレームワーク

### 2.1 オフライン評価（Retrieval Metrics）

#### 採用メトリクス

| メトリクス | 説明 | 目標値 | 用途 |
|-----------|------|-------|------|
| **Precision@K** | 上位K件中の適合率 | ≥ 0.7 | 推薦精度 |
| **Recall@K** | 関連アイテムのカバー率 | ≥ 0.6 | 網羅性 |
| **NDCG@K** | 順位を考慮した適合度 | ≥ 0.8 | ランキング品質 |
| **MRR** | 最初の適合アイテムの順位 | ≥ 0.7 | 即時性 |

#### 実装計画

```typescript
// apps/api/src/eval/metrics.ts

interface EvalMetrics {
  precisionAtK(relevant: string[], retrieved: string[], k: number): number;
  recallAtK(relevant: string[], retrieved: string[], k: number): number;
  ndcgAtK(relevanceScores: number[], k: number): number;
  mrr(relevant: string[], retrieved: string[]): number;
}
```

**K値の設定**: K=6（v2のフィード件数）, K=10, K=20

### 2.2 LLM as a Judge 評価

#### 評価観点

| 観点 | 説明 | スケール |
|-----|------|---------|
| **Relevance** | 記事がユーザーの興味に合致しているか | 1-5 |
| **Diversity** | 推薦結果の多様性 | 1-5 |
| **Serendipity** | 意外性のある発見があるか | 1-5 |
| **Coherence** | 推薦理由の一貫性 | Binary |

#### 評価プロンプト設計（ベストプラクティス準拠）

```markdown
## ユーザープロファイル
- カテゴリ嗜好: {category_preferences}
- 最近のインタラクション: {recent_interactions}

## 推薦された記事
{recommended_articles}

## 評価基準
以下の各項目を1-5で評価してください:

1. **関連性 (Relevance)**: ユーザーの興味との一致度
   - 5: 非常に関連性が高い
   - 3: ある程度関連している
   - 1: 全く関連がない

2. **多様性 (Diversity)**: 推薦結果の多様性
   - 5: 様々なトピックをバランスよくカバー
   - 3: 一部偏りがある
   - 1: 同じようなトピックばかり

3. **発見性 (Serendipity)**: 新しい発見の可能性
   - 5: 興味を広げる新しい視点がある
   - 3: 予想範囲内だが有用
   - 1: 既知の情報ばかり

## 出力形式
{
  "relevance": <1-5>,
  "diversity": <1-5>,
  "serendipity": <1-5>,
  "reasoning": "<評価理由>"
}
```

#### LLM設定（推奨）

- **モデル**: Gemini 2.0 Flash（コスト効率）または Claude 3.5 Sonnet（精度重視）
- **Temperature**: 0.1（再現性確保）
- **Few-shot例**: 各スコアに2-3例を用意

---

## 3. テストデータセット

### 3.1 合成データセット

#### ユーザーペルソナ（5タイプ）

| ペルソナ | 特徴 | 期待される推薦 |
|---------|------|---------------|
| **テック愛好家** | AI、プログラミングに高い関心 | 技術記事中心 |
| **ビジネスパーソン** | 経済、マーケティングに関心 | ビジネス記事中心 |
| **ライフスタイル重視** | 健康、趣味に関心 | ライフスタイル記事 |
| **オールラウンダー** | 幅広い関心 | 多様な推薦 |
| **新規ユーザー** | インタラクションなし | コールドスタート対応 |

#### データ生成スクリプト

```typescript
// apps/api/src/eval/fixtures/personas.ts

export const EVAL_PERSONAS = [
  {
    name: 'tech_enthusiast',
    categoryPreferences: {
      'テクノロジー': 0.9,
      'AI/機械学習': 0.85,
      'プログラミング': 0.8,
    },
    interactions: [
      { type: 'LIKE', articleCategory: 'テクノロジー' },
      { type: 'READ', articleCategory: 'AI/機械学習', readingTime: 120 },
      // ...
    ],
  },
  // ...
];
```

### 3.2 Ground Truthの作成

#### 方法1: 人手アノテーション（Gold Standard）

- **対象**: 30-50件のユーザー×記事ペア
- **アノテーター**: 3名によるクロスバリデーション
- **基準**: Krippendorff's alpha ≥ 0.7

#### 方法2: 暗黙的フィードバック変換

```typescript
// インタラクションをRelevanceスコアに変換
const interactionToRelevance = {
  LIKE: 1.0,    // 完全に関連
  READ: 0.8,    // 高い関連性（読了時間考慮）
  OPEN: 0.5,    // 中程度の関連性
  SKIP: 0.0,    // 関連なし
};
```

---

## 4. 評価シナリオ

### 4.1 A/Bテスト シミュレーション

| テスト | ベースライン | バリアント | 評価指標 |
|-------|------------|-----------|---------|
| ベクトル重み | 60% | 70%, 50% | NDCG, MRR |
| 時間減衰係数 | 30日 | 14日, 60日 | Precision |
| リランキング有無 | あり | なし | Diversity |

### 4.2 コールドスタート評価

- **シナリオ**: 新規ユーザー（インタラクション0-5件）
- **評価**: 初期推薦の品質、学習曲線

### 4.3 長期シミュレーション

- **シナリオ**: 100インタラクション後の推薦品質
- **評価**: フィルターバブル発生の有無、多様性維持

---

## 5. 実装計画

### Phase 1: 基盤構築（Week 1）

- [ ] Evalモジュール構造の作成
- [ ] オフラインメトリクス実装（Precision, Recall, NDCG, MRR）
- [ ] テストデータ生成スクリプト

### Phase 2: LLM Judge実装（Week 2）

- [ ] LLM評価プロンプトの設計・テスト
- [ ] 人手アノテーションとの相関検証
- [ ] 自動評価パイプライン構築

### Phase 3: 統合・レポート（Week 3）

- [ ] A/Bテストシミュレーション実行
- [ ] ダッシュボード/レポート機能
- [ ] ベースラインスコアの記録

---

## 6. ファイル構成案

```
apps/
├── api/
│   └── src/
│       └── eval/
│           ├── index.ts
│           ├── metrics/
│           │   ├── precision.ts
│           │   ├── recall.ts
│           │   ├── ndcg.ts
│           │   └── mrr.ts
│           ├── llm-judge/
│           │   ├── prompts.ts
│           │   ├── evaluator.ts
│           │   └── aggregator.ts
│           ├── fixtures/
│           │   ├── personas.ts
│           │   └── ground-truth.json
│           ├── runners/
│           │   ├── offline-eval.ts
│           │   └── llm-eval.ts
│           └── reports/
│               └── generator.ts
```

---

## 7. 成功基準

| 指標 | 現状（推定） | 目標 |
|-----|-------------|------|
| NDCG@6 | 測定前 | ≥ 0.75 |
| MRR | 測定前 | ≥ 0.65 |
| LLM Relevance Score | 測定前 | ≥ 4.0/5.0 |
| LLM Diversity Score | 測定前 | ≥ 3.5/5.0 |

---

## 8. 参考資料

### ベクトル検索評価
- [Weaviate - Retrieval Evaluation Metrics](https://weaviate.io/blog/retrieval-evaluation-metrics)
- [Pinecone - Offline Evaluation](https://www.pinecone.io/learn/offline-evaluation/)
- [Milvus - Vector Search Metrics](https://milvus.io/ai-quick-reference/beyond-basic-recall-and-precision-which-other-metrics-such-as-ndcg-mrr-or-f1score-can-be-used-to-evaluate-vector-search-results-and-what-aspects-of-performance-does-each-capture)

### LLM as a Judge
- [Evidently AI - LLM as a Judge Complete Guide](https://www.evidentlyai.com/llm-guide/llm-as-a-judge)
- [Confident AI - LLM Evaluation at Scale](https://www.confident-ai.com/blog/why-llm-as-a-judge-is-the-best-llm-evaluation-method)
- [Monte Carlo Data - 7 Best Practices](https://www.montecarlodata.com/blog-llm-as-judge/)
- [Hugging Face - LLM Judge Cookbook](https://huggingface.co/learn/cookbook/en/llm_judge)

### RAG/レコメンデーション評価
- [RAG Evaluation 2026 - Label Your Data](https://labelyourdata.com/articles/llm-fine-tuning/rag-evaluation)
- [RAG Evaluation Metrics 2025 - FutureAGI](https://futureagi.com/blogs/rag-evaluation-metrics-2025)
