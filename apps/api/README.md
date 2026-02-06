# @curio/api

Hono ベースの REST API サーバー。Cloud Run 上で動作し、フロントエンドにデータを提供する。

## 主な機能

- パーソナライズドフィード配信（pgvector コサイン類似度）
- ユーザーインタラクション記録（SKIP / LIKE / OPEN / READ）
- カテゴリ管理・統計情報の提供
- Better Auth による認証（Google OAuth + メール/パスワード）
- OpenAPI (Swagger UI) ドキュメント自動生成

## ディレクトリ構成

```
src/
├── routes/              # API エンドポイント
│   ├── auth.ts          # 認証
│   ├── feed.ts          # フィード取得
│   ├── categories.ts    # カテゴリ管理
│   ├── interactions.ts  # インタラクション記録
│   ├── statistics.ts    # 統計情報
│   ├── users.ts         # ユーザー管理
│   └── health.ts        # ヘルスチェック
├── services/            # ビジネスロジック
├── schemas/             # Zod バリデーションスキーマ
├── middlewares/          # 認証・セッション・CORS
├── lib/                 # ユーティリティ（設定、エラー、ロガー）
├── types/               # TypeScript 型定義
├── __tests__/           # テスト（unit / integration）
├── app.ts               # Hono アプリ定義
└── index.ts             # エントリポイント
```

## スクリプト

```bash
pnpm --filter @curio/api dev           # 開発サーバー起動
pnpm --filter @curio/api build         # TypeScript ビルド
pnpm --filter @curio/api start:prod    # 本番サーバー起動
pnpm --filter @curio/api test:unit     # ユニットテスト
pnpm --filter @curio/api test:integration  # 統合テスト
```

## 主な技術

- **Hono** - Web フレームワーク
- **Zod + @hono/zod-openapi** - バリデーション + OpenAPI 生成
- **Better Auth** - 認証
- **Pino** - ロギング
- **Vitest** - テスト
