# @curio/database

Curio のデータベースパッケージ。Prisma ORM + pgvector を使用。

## セットアップ

```bash
# 1. Docker で PostgreSQL + pgvector を起動
docker compose up -d

# 2. 依存関係をインストール
cd apps
pnpm install

# 3. マイグレーション実行
pnpm db:migrate

# 4. (オプション) シードデータ投入
pnpm --filter @curio/database db:seed
```

## 利用可能なスクリプト

| スクリプト         | 説明                   |
| ------------------ | ---------------------- |
| `pnpm db:generate` | Prisma Client を生成   |
| `pnpm db:migrate`  | マイグレーションを適用 |
| `pnpm db:studio`   | Prisma Studio を起動   |
| `pnpm db:seed`     | シードデータを投入     |

## データモデル

- **User** - ユーザー
- **Source** - RSS などのコンテンツソース
- **Article** - 記事 (ベクトル embedding 付き)
- **Interaction** - ユーザー行動 (SKIP/LIKE/OPEN/READ)
- **UserSource** - 購読関係
- **UserInterestVector** - ユーザー興味ベクトル

## ベクトル検索

pgvector 拡張と HNSW インデックスを使用。

```typescript
import { prisma } from "@curio/database";

// 類似記事検索 (Raw SQL)
const similar = await prisma.$queryRaw`
  SELECT id, title, 1 - (embedding <=> ${vector}::vector) AS similarity
  FROM articles
  ORDER BY embedding <=> ${vector}::vector
  LIMIT 20
`;
```

## 環境変数

`.env` ファイルに設定:

```
DATABASE_URL="postgresql://curio:curio_dev_password@localhost:5433/curio?schema=public"
```

ポート 5433 を使用（ローカル PostgreSQL との競合を回避）。
