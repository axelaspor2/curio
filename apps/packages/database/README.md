# @curio/database

Curio プロジェクトの共通データベースパッケージ。
Prisma ORM を使用してデータベース接続と型安全なクライアントを提供します。

## セットアップ

```bash
# apps/ ディレクトリで実行
cd apps
pnpm install
pnpm db:generate
```

## 利用可能なスクリプト

| コマンド                 | 説明                                                 |
| ------------------------ | ---------------------------------------------------- |
| `pnpm setup`             | インストール〜マイグレーション〜シードまでを一括実行 |
| `pnpm db:generate`       | Prisma Client を生成 (`src/generated/client`)        |
| `pnpm db:migrate:dev`    | 開発用マイグレーションを実行                         |
| `pnpm db:migrate:deploy` | 本番用マイグレーションを実行                         |
| `pnpm db:seed`           | シードデータを投入                                   |
| `pnpm db:studio`         | Prisma Studio (GUI) を起動                           |
| `pnpm db:reset`          | データベースをリセット                               |
| `pnpm build`             | TypeScript ビルド                                    |

## ベクトル検索 (pgvector)

`pgvector` 拡張を使用。`Unsupported("vector(768)")` 型で定義。

## アプリケーションからの利用

```typescript
// apps/api から
import { prisma } from "@curio/database";

const user = await prisma.user.findFirst();
```
