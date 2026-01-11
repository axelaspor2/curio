# @curio/database

Curio プロジェクトの共通データベースパッケージ。
Prisma ORM を使用してデータベース接続と型安全なクライアントを提供します。

## セットアップ

```bash
# 依存関係のインストールとクライアント生成
pnpm install
pnpm db:generate
```

## 利用可能なスクリプト

| コマンド                 | 説明                                                 |
| ------------------------ | ---------------------------------------------------- |
| `pnpm setup`             | インストール〜マイグレーション〜シードまでを一括実行 |
| `pnpm db:generate`       | Prisma Client を生成します (`src/generated/client`)  |
| `pnpm db:migrate:dev`    | 開発用マイグレーションを実行 (スキーマ変更時に使用)  |
| `pnpm db:migrate:deploy` | 本番用マイグレーションを実行                         |
| `pnpm db:seed`           | シードデータを投入 (`prisma/seed.ts` 実行)           |
| `pnpm db:studio`         | Prisma Studio (GUI) を起動                           |
| `pnpm db:reset`          | データベースをリセット (全データ削除)                |
| `pnpm build`             | TypeScript ビルド (型チェック含む)                   |

## ベクトル検索 (pgvector) について

本パッケージでは `pgvector` 拡張を使用しています。
`schema.prisma` にて `extensions = [vector]` を有効化しており、`Unsupported("vector(768)")` 型を使用しています。

## アプリケーションからの利用方法

`apps/api` や `apps/web` からは以下のようにインポートして使用します。

```typescript
import { prisma } from "@curio/database";

// 例: ユーザー取得
const user = await prisma.user.findFirst();
```
