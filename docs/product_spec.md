# **Curio - プロダクト仕様書**

## **概要**

**Curio** は、使えば使うほどパーソナライズされる情報キュレーションアプリ。

### **解決する課題**

- Twitter のような最新情報は欲しいけどノイズが多い
- ニュースサイトを自分から見に行くのは大変
- 知りたい情報だけを見たい

### **コンセプト**

- Tinder ライクなスワイプ UI で直感的に操作
- スワイプや閲覧行動から学習し、タイムラインが最適化されていく
- 好奇心（Curiosity）を満たすパーソナルフィード

---

## **ターゲットユーザー**

- エンジニア
- ビジネスパーソン
- 学生
- 情報感度の高い一般ユーザー

---

## **機能仕様**

### **学習インプット**

| インプット   | 説明                        |
| ------------ | --------------------------- |
| スワイプ     | 右: 興味あり / 左: スキップ |
| 記事オープン | タップして詳細を開いた      |
| 滞在時間     | 記事を読んでいた時間        |

※ 明示的なタグ/カテゴリ選択は MVP では実装しない

### **コンテンツソース**

- **運営提供**: 固定のソース（MVP では 3 つ程度）
- **ユーザー追加**: RSS URL などを自分で登録可能

### **対応ソース種別**

- RSS / Atom フィード
- ブログ
- ニュースサイト
- X (Twitter)
- Podcast
- その他（拡張可能）

---

## **技術スタック (2026 年 1 月)**

| レイヤー        | 技術                                                          | 備考                             |
| --------------- | ------------------------------------------------------------- | -------------------------------- |
| Frontend        | React + Vite                                                  | `apps/web/`                      |
| Backend         | [Hono](https://hono.dev/) + Cloud Run                         | `apps/api/`                      |
| Database        | Cloud SQL (PostgreSQL 17)                                     | `apps/packages/database/`        |
| ORM             | [Prisma 7](https://www.prisma.io/) + Driver Adapter           | @prisma/adapter-pg               |
| Vector Search   | [pgvector](https://github.com/pgvector/pgvector) 0.8.1 + HNSW | Cosine Similarity                |
| Embeddings      | **gemini-embedding-001**                                      | 旧 text-embedding-gecko は非推奨 |
| LLM             | **Gemini 3 Flash**                                            | Gemini 2.5 Flash は 2026/6 終了  |
| Authentication  | Better Auth                                                   |                                  |
| Batch           | Cloud Scheduler + Cloud Run Jobs                              |                                  |
| IaC             | Terraform                                                     | `infra/`                         |
| Package Manager | pnpm 10.28.0                                                  | Workspaces                       |

> **重要 (2026 年 1 月時点)**
>
> - `text-embedding-004` は 2026/1/14 に廃止
> - `gemini-embedding-001` が最新の推奨モデル
> - Gemini 3 Flash が 2025/12/17 リリース、デフォルトに

---

## **データモデル (Prisma スキーマ)**

### **users**

```prisma
model User {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email     String   @unique @db.VarChar(255)
  name      String?  @db.VarChar(255)
  avatarUrl String?  @map("avatar_url")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at")

  sources        Source[]
  userSources    UserSource[]
  interactions   Interaction[]
  interestVector UserInterestVector?

  @@map("users")
}
```

### **sources**

```prisma
model Source {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String?  @map("user_id") @db.Uuid  // NULL = 運営提供
  type      String   @db.VarChar(50)  // 'rss', 'twitter', etc.
  name      String   @db.VarChar(255)
  url       String
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")

  user        User?        @relation(fields: [userId], references: [id], onDelete: SetNull)
  articles    Article[]
  subscribers UserSource[]

  @@map("sources")
}
```

### **articles**

```prisma
model Article {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sourceId    String   @map("source_id") @db.Uuid
  externalId  String?  @map("external_id") @db.VarChar(255)
  title       String
  content     String?
  summary     String?      // LLM 生成の要約
  url         String
  imageUrl    String?  @map("image_url")
  categories  Json?        // LLM 生成のカテゴリ
  embedding   Unsupported("vector(768)")?  // pgvector
  publishedAt DateTime? @map("published_at")
  fetchedAt   DateTime  @default(now()) @map("fetched_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  source       Source        @relation(fields: [sourceId], references: [id], onDelete: Cascade)
  interactions Interaction[]

  @@unique([sourceId, externalId])
  @@map("articles")
}
```

### **interactions**

```prisma
enum InteractionType {
  SKIP
  LIKE
  OPEN
  READ
}

model Interaction {
  id             String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         String          @map("user_id") @db.Uuid
  articleId      String          @map("article_id") @db.Uuid
  type           InteractionType
  readingTimeSec Int?            @map("reading_time_sec")
  createdAt      DateTime        @default(now()) @map("created_at")

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([articleId])
  @@map("interactions")
}
```

### **user_interest_vectors**

```prisma
model UserInterestVector {
  id                String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId            String    @unique @map("user_id") @db.Uuid
  interestEmbedding Unsupported("vector(768)")? @map("interest_embedding")
  lastCalculatedAt  DateTime? @map("last_calculated_at")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @default(now()) @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_interest_vectors")
}
```

### **user_sources**

```prisma
model UserSource {
  userId       String   @map("user_id") @db.Uuid
  sourceId     String   @map("source_id") @db.Uuid
  isSubscribed Boolean  @default(true) @map("is_subscribed")
  createdAt    DateTime @default(now()) @map("created_at")

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  source Source @relation(fields: [sourceId], references: [id], onDelete: Cascade)

  @@id([userId, sourceId])
  @@map("user_sources")
}
```

---

## **パーソナライズロジック**

### **記事のベクトル化**

1. バッチで新規記事を取得
2. Gemini 3 Flash で記事を分類・要約
3. **gemini-embedding-001** でベクトル生成
4. Cloud SQL (pgvector) + HNSW インデックスに保存

### **ユーザー興味ベクトルの計算**

1. `interactions` から `LIKE` した記事を取得
2. 各記事のベクトルを加重平均
   - 最近の like ほど重みを大きく
   - `READ` で滞在時間が長いものも重みを増やす
3. 計算結果を `user_interest_vectors` に保存

### **フィード生成**

```typescript
// pgvector + HNSW による高速類似検索
const similar = await prisma.$queryRaw`
  SELECT id, title, 
         1 - (embedding <=> ${userVector}::vector) AS similarity
  FROM articles
  ORDER BY embedding <=> ${userVector}::vector
  LIMIT 20
`;
```

---

## **MVP タスクリスト**

### **Phase 1: 基盤構築** ✅

- [x] pnpm モノレポセットアップ
- [x] Docker Compose (PostgreSQL + pgvector)
- [x] Prisma 7 + Driver Adapter 設定
- [x] DB スキーマ定義 (6 モデル)
- [x] pgvector 拡張 + HNSW インデックス
- [x] 統合テスト (7 tests passed)

### **Phase 2: コンテンツ取得**

- [ ] Hono API 初期化 (`apps/api`)
- [ ] Sources API 実装
- [ ] RSS フィード取得バッチ
- [ ] Cloud Run Jobs + Scheduler

### **Phase 3: LLM 処理**

- [ ] Vertex AI Gemini 3 Flash 接続
- [ ] 記事分類・要約パイプライン
- [ ] gemini-embedding-001 でベクトル生成

### **Phase 4: フロントエンド**

- [ ] React + Vite 初期化 (`apps/web`)
- [ ] スワイプ UI コンポーネント
- [ ] タイムライン表示
- [ ] 記事詳細モーダル

### **Phase 5: パーソナライズ**

- [ ] インタラクション保存 API
- [ ] ユーザー興味ベクトル計算バッチ
- [ ] パーソナライズドフィード API

### **Phase 6: 認証・仕上げ**

- [ ] Better Auth 導入
- [ ] レスポンシブ対応
- [ ] Cloud Run デプロイ

---

## **今後の拡張案（MVP 後）**

- ユーザーによるソース追加機能
- X (Twitter) 連携
- Podcast 音声の文字起こし・要約
- プッシュ通知
- ブックマーク・シェア機能
- ダークモード
