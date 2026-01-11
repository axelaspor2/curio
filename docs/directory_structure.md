# ディレクトリ構成

Curio プロジェクトの標準ディレクトリ構成。

## 1. ディレクトリ構造

```
.
├── apps/                          # [pnpm Monorepo Root]
│   ├── api/                       # Backend API (Hono)
│   ├── web/                       # Frontend (React/Vite)
│   ├── packages/
│   │   ├── database/              # DB Schema (Prisma)
│   │   └── shared/                # 共有型定義・定数
│   ├── pnpm-workspace.yaml        # ワークスペース定義
│   └── package.json               # ルート設定
│
├── infra/                         # [External] Terraform (pnpm 管理外)
├── docs/                          # [Docs] 設計ドキュメント
└── README.md
```

## 2. 各ディレクトリの役割

- **apps/api**: API サーバーおよびビジネスロジック。
- **apps/web**: フロントエンドアプリケーション。
- **apps/packages/database**: データベーススキーマ定義 (Prisma) の単一リソース。
- **apps/packages/shared**: API/Web 間で共有する TypeScript 型定義。
- **infra/**: Terraform によるインフラ管理。pnpm 管理外。
