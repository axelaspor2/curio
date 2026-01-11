# @curio/database

Curio プロジェクトの共通データベースパッケージ。
Prisma ORM + pgvector を使用してデータベース接続と型安全なクライアントを提供します。

## セットアップ

```bash
cd apps
pnpm install
pnpm db:generate
```

## 利用可能なスクリプト

| コマンド                 | 説明                   |
| ------------------------ | ---------------------- |
| `pnpm db:generate`       | Prisma Client を生成   |
| `pnpm db:migrate:dev`    | 開発用マイグレーション |
| `pnpm db:migrate:deploy` | 本番用マイグレーション |
| `pnpm db:seed`           | シードデータ投入       |
| `pnpm db:studio`         | Prisma Studio (GUI)    |
| `pnpm db:reset`          | DB リセット            |
| `pnpm build`             | TypeScript ビルド      |

## ベクトル検索 (pgvector)

Cloud SQL PostgreSQL + pgvector を使用。

- **拡張有効化**: `migrations/00000000000000_enable_pgvector`
- **HNSW インデックス**: `migrations/00000000000001_add_hnsw_indexes`
- **ベクトル型**: `Unsupported("vector(768)")`

### 類似度検索 (Raw SQL)

```typescript
import { prisma } from "@curio/database";

const similar = await prisma.$queryRaw`
  SELECT id, title
  FROM articles
  ORDER BY embedding <=> ${userVector}::vector
  LIMIT 20
`;
```

## データモデル

- `User` - ユーザー
- `Source` - コンテンツソース (RSS 等)
- `Article` - 記事 (embedding 付き)
- `Interaction` - ユーザー行動 (SKIP/LIKE/OPEN/READ)
- `UserInterestVector` - ユーザー興味ベクトル
- `UserSource` - ユーザーのソース購読

## アプリケーションからの利用

```typescript
import { prisma, InteractionType } from "@curio/database";

// 記事取得
const articles = await prisma.article.findMany();

// インタラクション記録
await prisma.interaction.create({
  data: {
    userId: user.id,
    articleId: article.id,
    type: InteractionType.LIKE,
  },
});
```
