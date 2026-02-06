# @curio/admin

AdminJS ベースの管理画面。データベースの CRUD 操作を GUI で行う。

## 主な機能

- 全データモデルの CRUD 操作
- 日本語ローカライズ
- メール/パスワード認証
- セッション管理（24 時間 Cookie）

## ディレクトリ構成

```
src/
├── resources/           # AdminJS リソース定義
│   └── index.ts         # モデルごとの設定
├── lib/                 # ユーティリティ
│   ├── config.ts        # 環境設定
│   ├── logger.ts        # ロガー
│   └── prisma-dmmf-patch.ts  # Prisma DMMF パッチ
├── app.ts               # Express + AdminJS セットアップ
└── index.ts             # エントリポイント
```

## スクリプト

```bash
pnpm --filter @curio/admin dev     # 開発サーバー起動
pnpm --filter @curio/admin build   # TypeScript ビルド
pnpm --filter @curio/admin start   # 本番サーバー起動
```

## 主な技術

- **AdminJS** - 管理画面フレームワーク
- **Express** - Web サーバー
- **@adminjs/prisma** - Prisma アダプター
