# @curio/jobs

バッチ処理ジョブ群。Cloud Run Jobs + Cloud Scheduler で定期実行される。

## ジョブ一覧

| ジョブ | 説明 |
| :--- | :--- |
| `rss-fetch` | RSS/Atom フィードから記事メタデータを取得・保存 |
| `article-fetch` | 本文未取得の記事をスクレイピングしてフルテキスト抽出 |
| `article-enrichment` | Gemini API でカテゴリ分類 + 768 次元 embedding 生成 |
| `interest-vector` | ユーザーのインタラクション履歴から興味ベクトルを算出 |

## データパイプライン

```
rss-fetch → article-fetch → article-enrichment → interest-vector
  ① 取得      ② 本文抽出       ③ 分類+embedding     ④ ベクトル算出
```

## ディレクトリ構成

```
src/
├── rss-fetch/           # RSS/Atom 取得
│   ├── index.ts         # エントリポイント
│   ├── rss.service.ts   # RSS パース・保存ロジック
│   ├── schema.ts        # バリデーションスキーマ
│   └── errors.ts        # エラー定義
├── article-fetch/       # 本文抽出
│   ├── index.ts
│   ├── fetch.service.ts # 記事取得ロジック
│   ├── extractor.ts     # Readability による本文抽出
│   └── errors.ts
├── article-enrichment/  # カテゴリ分類 + Embedding
│   ├── index.ts
│   ├── enrichment.service.ts  # Gemini API 連携
│   └── errors.ts
├── interest-vector/     # 興味ベクトル算出
│   ├── index.ts
│   └── vector.service.ts  # ベクトル計算ロジック
├── lib/                 # 共通ユーティリティ
│   ├── gemini-client.ts # Gemini API クライアント
│   ├── gemini-schemas.ts # Gemini レスポンススキーマ
│   ├── ai-errors.ts     # AI 関連エラー定義
│   └── logger.ts        # ロガー
└── __tests__/           # テスト
```

## スクリプト

```bash
pnpm --filter @curio/jobs rss-fetch           # RSS 取得
pnpm --filter @curio/jobs article-fetch       # 本文抽出
pnpm --filter @curio/jobs article-enrichment  # エンリッチメント
pnpm --filter @curio/jobs interest-vector     # 興味ベクトル算出
```

## 主な技術

- **rss-parser** - RSS/Atom パース
- **@google/genai** - Gemini API クライアント
- **@mozilla/readability + jsdom** - 記事本文抽出
- **neverthrow** - Result 型エラーハンドリング
