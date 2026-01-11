# ディレクトリ構成

Curio プロジェクトの標準ディレクトリ構成。

## 1. ディレクトリ構造

```
.
├── apps/                    # [Apps] 実行可能なアプリケーション
│   ├── api/                 # Backend API (Hono)
│   └── web/                 # Frontend (TanStack Start)
│
├── packages/                # [Packages] 共有資産
│   ├── database/            # DB Schema (Drizzle)
│   └── shared/              # 共有型定義・定数
│
├── infra/                   # [Infra] Terraform 管理
├── docs/                    # [Docs] 設計ドキュメント
└── README.md
```

## 2. 各ディレクトリの役割

- **apps/api**: API サーバーおよびビジネスロジック。
- **apps/web**: フロントエンドアプリケーション。
- **packages/database**: データベーススキーマ定義 (Drizzle ORM) の単一リソース。
- **packages/shared**: API/Web 間で共有する TypeScript 型定義。
