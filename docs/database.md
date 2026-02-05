# Curio データベース設計

## 概要

- **データベース**: PostgreSQL 17
- **ORM**: Prisma 7
- **拡張機能**: pgvector (ベクトル検索)

---

## テーブル一覧

| テーブル                    | 説明                     | 主な用途                   |
| --------------------------- | ------------------------ | -------------------------- |
| `users`                     | ユーザー情報             | 認証、プロフィール         |
| `sources`                   | 情報ソース               | RSS 等の取得元管理         |
| `categories`                | カテゴリマスタ           | フィルタ、コールドスタート |
| `articles`                  | 記事                     | コンテンツ管理、検索       |
| `article_categories`        | 記事×カテゴリ            | LLM 分類結果               |
| `user_category_preferences` | ユーザーカテゴリ興味度   | パーソナライズ             |
| `interactions`              | インタラクション         | 行動ログ、学習             |
| `user_interest_vectors`     | 興味ベクトル             | ベクトル検索               |
| `sessions`                  | セッション               | Better Auth                |
| `accounts`                  | アカウント               | Better Auth                |
| `verifications`             | 認証                     | Better Auth                |

---

## 詳細設計

### users テーブル

**用途**: ユーザーの基本情報を管理

| カラム           | 型          | 説明                       | 例                                     |
| ---------------- | ----------- | -------------------------- | -------------------------------------- |
| `id`             | UUID        | 主キー                     | `550e8400-e29b-41d4-a716-446655440000` |
| `email`          | TEXT        | メールアドレス（ログインID） | `user@example.com`                     |
| `name`           | TEXT        | 表示名                     | `田中太郎`                             |
| `avatar_url`     | TEXT        | プロフィール画像URL        | `https://...`                          |
| `email_verified` | BOOLEAN     | メール認証済みか           | `true`                                 |
| `daily_article_count` | INTEGER | 1日の記事閲覧数（v2予定）  | `12`                                   |
| `last_reset_at`  | TIMESTAMPTZ | 日次カウントリセット日時（v2予定） | `2026-01-22T00:00:00Z`           |
| `created_at`     | TIMESTAMPTZ | 作成日時                   | `2026-01-22T10:00:00Z`                 |
| `updated_at`     | TIMESTAMPTZ | 更新日時                   | `2026-01-22T10:00:00Z`                 |

**インデックス**:

- `users_email_unique`: email の一意性（大文字小文字区別なし）
- `users_created_at_idx`: 作成日時

**リレーション**:

- 1:1 → `user_interest_vectors`
- 1:N → `user_category_preferences`
- 1:N → `interactions`
- 1:N → `sessions`
- 1:N → `accounts`

---

### sources テーブル

**用途**: 運営が提供する情報ソース（RSS 等）を管理

| カラム       | 型          | 説明                                | 例                         |
| ------------ | ----------- | ----------------------------------- | -------------------------- |
| `id`         | UUID        | 主キー                              | -                          |
| `type`       | TEXT        | ソース種別                          | `rss`, `atom`, `twitter`   |
| `name`       | TEXT        | 表示名                              | `TechCrunch Japan`         |
| `url`        | TEXT        | フィードURL                         | `https://techcrunch.com/feed` |
| `created_at` | TIMESTAMPTZ | 作成日時                            | -                          |

**type の種類**:

| 値        | 説明                 |
| --------- | -------------------- |
| `rss`     | RSS フィード         |
| `atom`    | Atom フィード        |
| `twitter` | X (Twitter)          |
| `podcast` | Podcast フィード     |

**インデックス**:

- `sources_type_idx`: ソース種別

**リレーション**:

- 1:N → `articles`

**注**: MVP では運営提供のみ。ユーザー追加機能は MVP 後に実装予定。不要になったソースは物理削除またはアーカイブテーブルへ移動。

---

### categories テーブル

**用途**: 記事分類のためのカテゴリマスタ

| カラム          | 型          | 説明                   | 例                         |
| --------------- | ----------- | ---------------------- | -------------------------- |
| `id`            | UUID        | 主キー                 | -                          |
| `slug`          | TEXT        | URL や内部識別用スラッグ | `technology`               |
| `name`          | TEXT        | 表示名                 | `テクノロジー`             |
| `description`   | TEXT        | カテゴリの説明         | `IT・テック関連のニュース` |
| `display_order` | INTEGER     | 表示順（小さいほど上） | `1`                        |
| `created_at`    | TIMESTAMPTZ | 作成日時               | -                          |

**使用場面**:

1. **コールドスタート**: 新規ユーザーが初回に興味カテゴリを選択
2. **フィルタリング**: フィード画面でカテゴリ絞り込み
3. **学習**: ユーザーのカテゴリ別興味度を計算

**インデックス**:

- `categories_slug_key`: slug の一意性
- `categories_display_order_idx`: 表示順

**注**: 不要になったカテゴリは物理削除。MVP 後にアーカイブテーブル方式を検討。

---

### articles テーブル

**用途**: 取得した記事コンテンツを管理

| カラム        | 型           | 説明                    | 例                     |
| ------------- | ------------ | ----------------------- | ---------------------- |
| `id`          | UUID         | 主キー                  | -                      |
| `source_id`   | UUID         | ソースID（FK）          | -                      |
| `external_id` | TEXT         | 外部システムでのID      | `abc123`               |
| `title`       | TEXT         | 記事タイトル            | `AI の最新動向`        |
| `content`     | TEXT         | 記事本文                | -                      |
| `description` | TEXT         | フィードからの説明文（v2予定、ユーザー表示用） | `AIの最新動向について...` |
| `summary`     | TEXT         | LLM 生成の要約（v2で削除予定） | -                      |
| `url`         | TEXT         | 記事URL                 | `https://...`          |
| `image_url`   | TEXT         | OGP 画像URL             | `https://...`          |
| `embedding`   | vector(768)  | 記事のベクトル表現      | -                      |
| `published_at`| TIMESTAMPTZ  | 記事の公開日時          | `2026-01-22T10:00:00Z` |
| `fetched_at`  | TIMESTAMPTZ  | 取得日時                | -                      |
| `created_at`  | TIMESTAMPTZ  | 作成日時                | -                      |

> **v2変更予定**: `summary`（LLM要約）を削除し、`description`（フィードから取得）をユーザー表示用に使用

**インデックス**:

- `articles_source_external_unique`: source_id + external_id の一意性
- `articles_source_id_idx`: ソースID
- `articles_published_at_idx`: 公開日時（降順）
- `articles_fetched_at_idx`: 取得日時（降順）
- `articles_embedding_idx`: HNSW インデックス（コサイン類似度）

**リレーション**:

- N:1 → `sources`
- 1:N → `article_categories`
- 1:N → `interactions`

---

### article_categories テーブル

**用途**: 記事に付与されたカテゴリを管理（多対多）

| カラム        | 型           | 説明                           | 例     |
| ------------- | ------------ | ------------------------------ | ------ |
| `article_id`  | UUID         | 記事ID（複合PK）               | -      |
| `category_id` | UUID         | カテゴリID（複合PK）           | -      |
| `confidence`  | DECIMAL(3,2) | LLM の分類確信度（0.00〜1.00） | `0.95` |
| `created_at`  | TIMESTAMPTZ  | 作成日時                       | -      |

**confidence の意味**:

| 範囲      | 意味     | 表示                     |
| --------- | -------- | ------------------------ |
| 0.7 以上  | 高確信   | メイン表示               |
| 0.5〜0.7  | 中程度   | サブ表示                 |
| 0.5 未満  | 低確信   | 非表示または除外         |

**インデックス**:

- `article_categories_category_id_idx`: カテゴリID

**リレーション**:

- N:1 → `articles`
- N:1 → `categories`

---

### user_category_preferences テーブル

**用途**: ユーザーごとのカテゴリ興味度を管理

| カラム                | 型           | 説明                         | 例       |
| --------------------- | ------------ | ---------------------------- | -------- |
| `user_id`             | UUID         | ユーザーID（複合PK）         | -        |
| `category_id`         | UUID         | カテゴリID（複合PK）         | -        |
| `preference_score`    | DECIMAL(5,4) | 興味度スコア（0.0〜1.0）     | `0.8500` |
| `is_initial_selection`| BOOLEAN      | コールドスタートで選択されたか | `true`   |
| `updated_at`          | TIMESTAMPTZ  | 最終更新日時                 | -        |
| `created_at`          | TIMESTAMPTZ  | 作成日時                     | -        |

**preference_score の計算**:

- **初期値**: コールドスタートで選択 → 0.7、未選択 → 0.3
- **更新**: カテゴリに属する記事への LIKE/SKIP 比率で調整
- **範囲**: 0.0（興味なし）〜 1.0（非常に興味あり）

**インデックス**:

- `user_category_preferences_category_id_idx`: カテゴリID
- `user_category_preferences_score_idx`: ユーザーID + スコア（降順）

**リレーション**:

- N:1 → `users`
- N:1 → `categories`

---

### interactions テーブル

**用途**: ユーザーの記事への操作を記録

| カラム            | 型          | 説明               | 例     |
| ----------------- | ----------- | ------------------ | ------ |
| `id`              | UUID        | 主キー             | -      |
| `user_id`         | UUID        | ユーザーID         | -      |
| `article_id`      | UUID        | 記事ID             | -      |
| `type`            | ENUM        | 操作種別           | `LIKE` |
| `reading_time_sec`| INTEGER     | 閲覧時間（秒）     | `120`  |
| `article_title`   | TEXT        | 記事タイトル（v2予定、非正規化） | `AI の最新動向` |
| `article_url`     | TEXT        | 記事URL（v2予定、非正規化） | `https://...` |
| `category_ids`    | UUID[]      | カテゴリID配列（v2予定、非正規化） | `[uuid1, uuid2]` |
| `created_at`      | TIMESTAMPTZ | 操作日時           | -      |

> **v2変更予定**: 記事削除後も統計情報を保持するため、`article_title`、`article_url`、`category_ids` を非正規化して保存

**type の種類**:

| 値     | 意味         | トリガー       | 学習への影響   |
| ------ | ------------ | -------------- | -------------- |
| `SKIP` | スキップ     | 左スワイプ     | 負の信号（弱） |
| `LIKE` | 興味あり     | 右スワイプ     | 正の信号（強） |
| `OPEN` | 記事を開いた | タップ         | 正の信号（中） |
| `READ` | 読了         | 一定時間閲覧   | 正の信号（強） |

**インデックス**:

- `interactions_user_id_idx`: ユーザーID
- `interactions_article_id_idx`: 記事ID
- `interactions_user_type_idx`: ユーザーID + 操作種別
- `interactions_created_at_idx`: 作成日時（降順）

**リレーション**:

- N:1 → `users`
- N:1 → `articles`

---

### user_interest_vectors テーブル

**用途**: ユーザーの興味をベクトル形式で保持

| カラム              | 型          | 説明                   | 例  |
| ------------------- | ----------- | ---------------------- | --- |
| `id`                | UUID        | 主キー                 | -   |
| `user_id`           | UUID        | ユーザーID（一意）     | -   |
| `interest_embedding`| vector(768) | 興味ベクトル           | -   |
| `last_calculated_at`| TIMESTAMPTZ | 最終計算日時           | -   |
| `created_at`        | TIMESTAMPTZ | 作成日時               | -   |
| `updated_at`        | TIMESTAMPTZ | 更新日時               | -   |

**リレーション**:

- 1:1 → `users`

---

### Better Auth テーブル

#### sessions

| カラム       | 型          | 説明               |
| ------------ | ----------- | ------------------ |
| `id`         | UUID        | 主キー             |
| `user_id`    | UUID        | ユーザーID         |
| `token`      | TEXT        | セッショントークン |
| `expires_at` | TIMESTAMPTZ | 有効期限           |
| `ip_address` | TEXT        | IPアドレス         |
| `user_agent` | TEXT        | ユーザーエージェント |
| `created_at` | TIMESTAMPTZ | 作成日時           |
| `updated_at` | TIMESTAMPTZ | 更新日時           |

#### accounts

| カラム                    | 型          | 説明                       |
| ------------------------- | ----------- | -------------------------- |
| `id`                      | UUID        | 主キー                     |
| `user_id`                 | UUID        | ユーザーID                 |
| `account_id`              | TEXT        | 外部プロバイダでのID       |
| `provider_id`             | TEXT        | プロバイダ識別子           |
| `access_token`            | TEXT        | アクセストークン           |
| `refresh_token`           | TEXT        | リフレッシュトークン       |
| `id_token`                | TEXT        | IDトークン                 |
| `access_token_expires_at` | TIMESTAMPTZ | アクセストークン有効期限   |
| `refresh_token_expires_at`| TIMESTAMPTZ | リフレッシュトークン有効期限|
| `scope`                   | TEXT        | 認可スコープ               |
| `password`                | TEXT        | パスワードハッシュ         |
| `created_at`              | TIMESTAMPTZ | 作成日時                   |
| `updated_at`              | TIMESTAMPTZ | 更新日時                   |

#### verifications

| カラム       | 型          | 説明           |
| ------------ | ----------- | -------------- |
| `id`         | UUID        | 主キー         |
| `identifier` | TEXT        | 識別子         |
| `value`      | TEXT        | 値             |
| `expires_at` | TIMESTAMPTZ | 有効期限       |
| `created_at` | TIMESTAMPTZ | 作成日時       |
| `updated_at` | TIMESTAMPTZ | 更新日時       |

---

## ER図

```
┌─────────────────────────────────────────────────────────────┐
│                        users                                 │
│  id, email, name, avatar_url, email_verified, ...           │
└─────────────────────────────────────────────────────────────┘
         │ 1:1              │ 1:N                    │ 1:N
         ▼                  ▼                        ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ user_interest    │  │ user_category    │  │   interactions   │
│ _vectors         │  │ _preferences     │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
                            │ N:1                    │ N:1
                            ▼                        ▼
                      ┌──────────────────┐  ┌──────────────────┐
                      │   categories     │  │    articles      │
                      │                  │  │                  │
                      └──────────────────┘  └──────────────────┘
                            ▲ 1:N                    │ N:1
                            │                        ▼
                      ┌──────────────────┐  ┌──────────────────┐
                      │ article_         │◄─│    sources       │
                      │ categories       │  │                  │
                      └──────────────────┘  └──────────────────┘

Better Auth:
users ──► sessions
users ──► accounts
        verifications (独立)
```

---

## ユースケース別データフロー

### 1. コールドスタート（新規ユーザー初回設定）

```
1. categories から全カテゴリを取得（display_order順）
2. ユーザーが興味カテゴリを選択
3. user_category_preferences に挿入
   - 選択したもの: preference_score=0.7, is_initial_selection=true
   - 選択しなかったもの: preference_score=0.3, is_initial_selection=false
```

### 2. フィード生成（パーソナライズ）

```
1. user_interest_vectors から interest_embedding を取得
2. articles.embedding との類似度検索（pgvector HNSW）
3. user_category_preferences で結果をリランキング
4. 既に interactions がある記事を除外
5. 上位N件を返却
```

### 3. スワイプ操作の記録

```
1. interactions に挿入 (type=LIKE or SKIP)
2. 記事のカテゴリを article_categories から取得
3. user_category_preferences の preference_score を更新
   - LIKE: スコアを少し上昇
   - SKIP: スコアを少し下降
4. 定期バッチで user_interest_vectors を再計算
```

### 4. カテゴリフィルタリング

```
1. categories から選択されたカテゴリIDを取得
2. article_categories で該当記事を取得
3. フィード生成ロジックに追加条件として適用
```

---

## インデックス戦略

### HNSW インデックス（ベクトル検索）

```sql
CREATE INDEX articles_embedding_idx ON articles
  USING hnsw (embedding vector_cosine_ops);
```

- **用途**: ユーザー興味ベクトルと記事ベクトルの類似度検索
- **アルゴリズム**: HNSW（Hierarchical Navigable Small World）
- **距離関数**: コサイン類似度

### B-tree インデックス

| テーブル                    | インデックス                          | 用途                       |
| --------------------------- | ------------------------------------- | -------------------------- |
| `users`                     | `email` (UNIQUE)                      | ログイン時の検索           |
| `articles`                  | `published_at DESC`                   | 新着記事の取得             |
| `interactions`              | `(user_id, type)`                     | ユーザーの行動履歴取得     |
| `user_category_preferences` | `(user_id, preference_score DESC)`    | スコア順でのカテゴリ取得   |

---

## マイグレーション手順

```bash
# 開発環境でのリセット
pnpm prisma migrate reset --force

# 新しいマイグレーション作成
pnpm prisma migrate dev --name redesign_schema

# Prisma Client 生成
pnpm prisma generate
```

---

## 検証項目

- [ ] Prisma generate が成功する
- [ ] マイグレーションが正常に適用される
- [ ] pgvector HNSW インデックスが作成される
- [ ] Better Auth との互換性確認
- [ ] 基本的な CRUD 操作のテスト

---

## v2 スキーマ変更予定

### 概要

フィード体験改善（6件/回、1日上限30件、サマリー画面）に伴うスキーマ変更。

### 変更内容

#### users テーブル

```prisma
model User {
  // 追加
  dailyArticleCount Int      @default(0) @map("daily_article_count")
  lastResetAt       DateTime @default(now()) @map("last_reset_at") @db.Timestamptz
}
```

#### articles テーブル

```prisma
model Article {
  // 追加
  description String? @db.Text  // フィードのdescription（ユーザー表示用）

  // 削除
  // summary String? @db.Text  // LLM生成の要約（削除）
}
```

#### interactions テーブル

```prisma
model Interaction {
  // 追加（記事削除後も統計を保持するための非正規化）
  articleTitle  String?  @map("article_title") @db.Text
  articleUrl    String?  @map("article_url") @db.Text
  categoryIds   String[] @map("category_ids") @db.Uuid
}
```

### バッチジョブ

| ジョブ | スケジュール | 説明 |
|--------|------------|------|
| `cleanup-articles` | 毎日深夜 | 1ヶ月以上前の記事を削除 |
| `reset-daily-count` | 毎日0時 | 全ユーザーの dailyArticleCount をリセット |

### API変更

| エンドポイント | 変更内容 |
|--------------|---------|
| `GET /api/feed` | limit デフォルト 6、1日上限チェック、残りセット数をレスポンスに追加 |
| `POST /api/interactions` | 記事情報を非正規化して保存 |
| `GET /api/stats` | 新規作成（統計取得） |
