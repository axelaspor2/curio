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

## **MVP 範囲**

### **含む機能**

- 記事取得・表示
- スワイプ UI・学習機能
- 認証・ユーザー管理
- カテゴリ選択（コールドスタート対策）
- カテゴリフィルタリング

### **含まない機能（MVP 後）**

- ユーザーによるソース追加
- X (Twitter) 連携
- Podcast 音声の文字起こし・要約
- プッシュ通知
- ブックマーク・シェア機能

---

## **フィード体験（v2）**

### **背景・課題**

v1の20件一括スワイプ方式には以下の課題があった:

- **退屈・飽きる**: ずっとスワイプし続けるのはユーザーにとって飽きる
- **終わりがない**: 無限にリロードできてしまい、ダラダラ続く
- **達成感がない**: 「今日の分は終わり」という区切りがない

### **v2の方針**

**「質を上げて量を減らす」**

- 厳選された少数の記事を提示
- 1日の上限を設けて「今日のノルマ完了」感を出す
- スワイプ後にフィードバック（サマリー画面）を表示

### **変更点サマリー**

| 項目 | 変更前 | 変更後 |
|------|--------|--------|
| フィード件数 | 20件 | **6件/回** |
| 1日上限 | なし | **30件（5セット）** |
| 認証 | メール/パスワードのみ | **Googleログイン追加** |
| 6件終了時 | なし | **サマリー画面表示** |
| 記事表示 | summary（LLM要約） | **description（フィードから取得）** |
| 表示条件 | 全記事 | **エンリッチメント完了記事のみ** |
| 古い記事 | 保持 | **1ヶ月後に削除** |

### **セッションサマリー画面**

6件のスワイプ完了後に表示されるサマリー画面:

#### 表示内容

| セクション | 図 | 内容 |
|------------|-----|------|
| アクション統計 | ドーナツチャート | LIKE/SKIP/READの割合と累計件数 |
| LIKEカテゴリ | 棒グラフ | LIKEが多いカテゴリTOP3 |
| SKIPカテゴリ | 棒グラフ | SKIPが多いカテゴリTOP3 |

#### 累計統計

- これまでにLIKEした記事の総数
- これまでにSKIPした記事の総数
- これまでに開いて読んだ記事の総数（READ）

#### アクション

- **残りセット数表示**: 「残り4セット」など
- **「次の6件を取得」ボタン**: 次のセットを取得
- **「今日はここまで」ボタン**: セッション終了

#### 技術選定

- **チャートライブラリ**: Recharts（React向け、軽量）

### **1日上限の仕様**

- 1日あたり最大30件（6件 × 5セット）
- 日次でカウントリセット（毎日0時）
- 上限到達時は「今日はここまで」画面を表示

### **エンリッチメント完了記事の条件**

以下がすべてNOT NULLの記事のみフィードに表示:
- `embedding`（ベクトル）
- `content`（本文）
- `description`（フィードからの説明文）

---

## **著作権対応方針**

### **基本方針**

記事を要約して表示することは著作権的に問題がある可能性があるため、以下の方針を採用:

| 用途 | 使用するデータ | 理由 |
|------|---------------|------|
| **カード表示** | フィードのdescriptionのみ | 元サイトが公開を意図したもの |
| **サーバー内部処理** | 記事本文も使用可 | ベクトル計算、カテゴリ分類用 |

### **ユーザーに見せるもの**

- タイトル（フィードから）
- description（フィードから）
- サムネイル（OGP画像）
- 元記事へのリンク

### **サーバー内部でのみ使うもの**

- 記事本文（スクレイピング）
- LLMによるカテゴリ分類
- ベクトル生成（本文を使用）
- **要約は生成しても表示しない**

---

## **機能仕様**

### **学習インプット**

| インプット     | 説明                        |
| -------------- | --------------------------- |
| スワイプ       | 右: 興味あり / 左: スキップ |
| 記事オープン   | タップして詳細を開いた      |
| 滞在時間       | 記事を読んでいた時間        |
| カテゴリ選択   | 初回セットアップで選択      |

※ 初回のカテゴリ選択でコールドスタート問題を軽減

### **コンテンツソース**

- **運営提供**: 固定のソース（MVP では 3 つ程度）
- **ユーザー追加**: MVP 後に実装予定

### **カテゴリ機能**

- 運営が定義したカテゴリ（テクノロジー、ビジネス、ライフスタイル等）
- LLM が記事を自動分類
- ユーザーはカテゴリでフィード絞り込み可能
- 初回セットアップで興味カテゴリを選択（コールドスタート対策）

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

## **データモデル**

詳細は [docs/database.md](./database.md) を参照。

### **テーブル一覧**

| テーブル                    | 説明                     |
| --------------------------- | ------------------------ |
| `users`                     | ユーザー情報             |
| `sources`                   | 情報ソース（運営提供）   |
| `categories`                | カテゴリマスタ           |
| `articles`                  | 記事                     |
| `article_categories`        | 記事×カテゴリ            |
| `user_category_preferences` | ユーザーカテゴリ興味度   |
| `interactions`              | インタラクション         |
| `user_interest_vectors`     | 興味ベクトル             |
| `sessions`                  | Better Auth: セッション  |
| `accounts`                  | Better Auth: アカウント  |
| `verifications`             | Better Auth: 認証        |

### **主要モデル（Prisma）**

#### users

```prisma
model User {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email         String   @db.Text
  name          String   @db.Text
  avatarUrl     String?  @map("avatar_url") @db.Text
  emailVerified Boolean  @default(false) @map("email_verified")
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime @default(now()) @updatedAt @map("updated_at") @db.Timestamptz

  interestVector      UserInterestVector?
  categoryPreferences UserCategoryPreference[]
  interactions        Interaction[]
  sessions            Session[]
  accounts            Account[]

  @@unique([email])
  @@map("users")
}
```

#### categories

```prisma
model Category {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  slug         String   @unique @db.Text
  name         String   @db.Text
  description  String?  @db.Text
  displayOrder Int      @default(0) @map("display_order")
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamptz

  articles        ArticleCategory[]
  userPreferences UserCategoryPreference[]

  @@map("categories")
}
```

#### interactions

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
  createdAt      DateTime        @default(now()) @map("created_at") @db.Timestamptz

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([articleId])
  @@index([userId, type])
  @@map("interactions")
}
```

---

## **パーソナライズロジック**

### **記事のベクトル化**

1. バッチで新規記事を取得（RSS + 本文スクレイピング）
2. Gemini 3 Flash で記事をカテゴリ分類
3. **gemini-embedding-001** で本文（content）からベクトル生成
4. Cloud SQL (pgvector) + HNSW インデックスに保存

> **Note**: ベクトル生成には記事本文（content）を使用。descriptionだけでは情報が不十分なため。

### **ユーザー興味ベクトルの計算**

1. `interactions` から `LIKE` した記事を取得
2. 各記事のベクトルを加重平均
   - 最近の like ほど重みを大きく
   - `READ` で滞在時間が長いものも重みを増やす
3. 計算結果を `user_interest_vectors` に保存

### **カテゴリベースのリランキング**

1. `user_category_preferences` からユーザーのカテゴリ興味度を取得
2. 記事のカテゴリ（`article_categories`）と照合
3. 興味度スコアに基づいて検索結果をリランキング

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
- [x] DB スキーマ定義
- [x] pgvector 拡張 + HNSW インデックス
- [x] 統合テスト

### **Phase 2: コンテンツ取得**

- [ ] Hono API 初期化 (`apps/api`)
- [ ] Sources API 実装
- [ ] RSS フィード取得バッチ
- [ ] Cloud Run Jobs + Scheduler

### **Phase 3: LLM 処理**

- [ ] Vertex AI Gemini 3 Flash 接続
- [ ] 記事分類・要約パイプライン
- [ ] gemini-embedding-001 でベクトル生成
- [ ] カテゴリ自動分類

### **Phase 4: フロントエンド**

- [x] React + Vite 初期化 (`apps/web`)
- [ ] スワイプ UI コンポーネント
- [ ] タイムライン表示
- [ ] 記事詳細モーダル
- [ ] カテゴリ選択画面（コールドスタート）
- [ ] カテゴリフィルター UI

### **Phase 5: パーソナライズ**

- [ ] インタラクション保存 API
- [ ] ユーザー興味ベクトル計算バッチ
- [ ] パーソナライズドフィード API
- [ ] カテゴリベースリランキング

### **Phase 6: 認証・仕上げ**

- [ ] Better Auth 導入
- [ ] レスポンシブ対応
- [ ] Cloud Run デプロイ

---

## **認証**

### **対応認証方式**

| 方式 | 状態 | 備考 |
|------|------|------|
| メール/パスワード | ✅ 実装済み | Better Auth |
| Googleログイン | 📋 予定 | Better Auth socialProviders |

### **Googleログイン実装**

```typescript
// apps/api/src/lib/auth.ts
export const auth = betterAuth({
  // 既存設定...
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});
```

---

## **今後の拡張案（MVP 後）**

### **フィードモード機能（v2以降）**

設定画面でモードを切り替えられる機能:

| モード | 内容 |
|--------|------|
| **通常モード** | パーソナライズ重視の6件（デフォルト） |
| **探索モード** | 普段見ないジャンルも含めて幅広く6件 |
| **ジャンル限定モード** | ユーザーが選んだカテゴリのみから6件 |

### **その他の拡張**

- ユーザーによるソース追加機能
- X (Twitter) 連携
- Podcast 音声の文字起こし・要約
- プッシュ通知
- ブックマーク・シェア機能
- ダークモード
- 累積ダッシュボード（プロフィール画面での詳細統計）
- 週次/月次レポート
