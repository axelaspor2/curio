# ディレクトリ構成

Curio プロジェクトの標準ディレクトリ構成 (2026 年 1 月時点)。

## 1. 全体構造

```
.
├── apps/                          # [pnpm Monorepo Root]
│   ├── api/                       # Backend API (Hono) ※未実装
│   │   └── src/
│   ├── web/                       # Frontend (React/Vite) ※未実装
│   │   └── src/
│   ├── packages/
│   │   ├── database/              # ★ DB Package (Prisma + pgvector)
│   │   └── shared/                # 共有型定義・定数 ※未実装
│   ├── pnpm-workspace.yaml        # ワークスペース定義
│   ├── package.json               # ルート設定 (packageManager指定)
│   └── pnpm-lock.yaml             # ロックファイル
│
├── compose.yaml                   # ローカル PostgreSQL + pgvector
├── infra/                         # Terraform (pnpm 管理外)
│   └── env/shared/cloudbuild.yaml # Cloud Build 設定
├── docs/                          # 設計ドキュメント
└── README.md
```

## 2. Database Package 詳細

```
apps/packages/database/
├── package.json               # @curio/database (v0.0.1)
├── tsconfig.json              # TypeScript 設定
├── prisma.config.ts           # Prisma 7 設定 (DATABASE_URL)
├── README.md                  # 使用方法
│
├── prisma/
│   ├── schema.prisma          # スキーマ定義 (6モデル)
│   ├── seed.ts                # シードデータスクリプト
│   ├── test.ts                # 統合テスト (8テスト)
│   └── migrations/
│       ├── 0_init/            # 初期マイグレーション
│       │   └── migration.sql  # pgvector + HNSW
│       └── migration_lock.toml
│
├── src/
│   ├── index.ts               # エントリポイント (Singleton)
│   └── generated/client/      # Prisma 自動生成 (.gitignore対象)
│
└── dist/                      # ビルド成果物 (.gitignore対象)
```

## 3. 各ディレクトリの役割

| ディレクトリ             | 役割                                            |
| ------------------------ | ----------------------------------------------- |
| `apps/api`               | Hono ベースの API サーバー                      |
| `apps/web`               | React/Vite フロントエンド                       |
| `apps/packages/database` | Prisma スキーマ・クライアント・マイグレーション |
| `apps/packages/shared`   | 共有 TypeScript 型定義                          |
| `infra/`                 | Cloud Build, Terraform などの IaC               |
| `docs/`                  | 設計仕様書・アーキテクチャ図                    |

## 4. 技術スタック (2026)

| 技術       | バージョン                 |
| ---------- | -------------------------- |
| Node.js    | ≥24.0.0                    |
| pnpm       | 10.x                       |
| TypeScript | 5.9.3                      |
| Prisma     | 7.2.0 + @prisma/adapter-pg |
| PostgreSQL | 17 (pgvector)              |
