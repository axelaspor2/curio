# **Curio \- プロダクト仕様書**

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

## **システム構成**

## ![][image1]

## **技術スタック**

| レイヤー       | 技術                                           |
| -------------- | ---------------------------------------------- |
| Frontend       | TanStack Start \+ React                        |
| Backend        | Cloud Run \+ Hono                              |
| Database       | Cloud SQL (PostgreSQL)                         |
| Authentication | Better Auth                                    |
| Vector Search  | Cloud SQL (pgvector)                           |
| Embeddings     | Vertex AI Embeddings API (textembedding-gecko) |
| LLM            | Vertex AI Gemini (3 / 2.5 Flash 等を検証)      |
| Batch          | Cloud Scheduler \+ Cloud Run Jobs              |
| Hosting        | Google Cloud Platform                          |

---

## **データモデル**

### **users**

CREATE TABLE users (  
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  
 email VARCHAR(255) UNIQUE NOT NULL,  
 name VARCHAR(255),  
 avatar_url TEXT,  
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
);

### **sources (コンテンツソース)**

CREATE TABLE sources (  
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  
 user_id UUID REFERENCES users(id) NULL, \-- NULL \= 運営提供  
 type VARCHAR(50) NOT NULL, \-- 'rss', 'twitter', 'podcast', etc.  
 name VARCHAR(255) NOT NULL,  
 url TEXT NOT NULL,  
 is_active BOOLEAN DEFAULT true,  
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
);

### **articles**

CREATE TABLE articles (  
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  
 source_id UUID REFERENCES sources(id) NOT NULL,  
 external_id VARCHAR(255), \-- 元記事の ID/URL  
 title TEXT NOT NULL,  
 content TEXT,  
 summary TEXT, \-- LLM 生成の要約  
 url TEXT NOT NULL,  
 image_url TEXT,  
 categories JSONB, \-- LLM 生成のカテゴリ  
 embedding vector(768), -- pgvector (Vertex AI 統合)  
 published_at TIMESTAMP,  
 fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

UNIQUE(source_id, external_id)  
);

### **interactions (ユーザー行動)**

CREATE TABLE interactions (  
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  
 user_id UUID REFERENCES users(id) NOT NULL,  
 article_id UUID REFERENCES articles(id) NOT NULL,  
 type SMALLINT NOT NULL, -- 0:skip, 1:like, 2:open, 3:read  
 reading_time_sec INTEGER, \-- type='read' の場合の滞在時間  
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

INDEX idx_interactions_user (user_id),  
 INDEX idx_interactions_article (article_id)  
);

### **user_interest_vectors (ユーザー興味ベクトル)**

CREATE TABLE user_interest_vectors (  
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  
 user_id UUID REFERENCES users(id) UNIQUE NOT NULL,  
 interest_embedding vector(768), -- pgvector  
 last_calculated_at TIMESTAMP,  
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
);

### **user_sources (ユーザーのソース購読)**

CREATE TABLE user_sources (  
 user_id UUID REFERENCES users(id) NOT NULL,  
 source_id UUID REFERENCES sources(id) NOT NULL,  
 is_subscribed BOOLEAN DEFAULT true,  
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

PRIMARY KEY (user_id, source_id)  
);

---

## **パーソナライズロジック**

### **記事のベクトル化**

1. バッチで新規記事を取得
2. Gemini で記事を分類・要約
3. Vertex AI Embeddings API でベクトル生成
4. Cloud SQL (pgvector) に保存

### **ユーザー興味ベクトルの計算**

1. `interactions` から `like` した記事を取得
2. 各記事のベクトルを加重平均
   - 最近の like ほど重みを大きく
   - `read` で滞在時間が長いものも重みを増やす
3. 計算結果を `user_interest_vectors` に保存

### **フィード生成**

1. ユーザーの興味ベクトルで Cloud SQL (pgvector) を検索 (Cosine Similarity)
2. 類似度の高い記事を取得
3. すでに表示済み/スキップ済みを除外
4. スコア順にタイムライン表示

---

## **MVP タスクリスト**

### **Phase 1: 基盤構築**

- \[ \] GCP プロジェクトセットアップ
- \[ \] Cloud SQL (PostgreSQL) インスタンス作成
- \[ \] Hono プロジェクト初期化
- \[ \] TanStack Start プロジェクト初期化
- \[ \] Better Auth 導入・認証フロー実装
- \[ \] DB マイグレーション (Prisma or Drizzle)

### **Phase 2: コンテンツ取得**

- \[ \] Sources テーブル・API 実装
- \[ \] RSS フィード取得バッチ実装
- \[ \] Cloud Run Jobs \+ Scheduler 設定
- \[ \] 固定ソース 3 つを登録（ソース選定後）

### **Phase 3: LLM 処理**

- \[ \] Vertex AI Gemini 接続
- \[ \] 記事分類・要約パイプライン実装
- \[ \] Vertex AI Embeddings でベクトル生成
- \[ \] Vertex AI Vector Search インデックス作成

### **Phase 4: フロントエンド**

- \[ \] スワイプ UI コンポーネント実装
- \[ \] タイムライン表示
- \[ \] 記事詳細モーダル
- \[ \] インタラクション記録 API 連携

### **Phase 5: パーソナライズ**

- \[ \] インタラクション保存 API
- \[ \] ユーザー興味ベクトル計算バッチ
- \[ \] パーソナライズドフィード API
- \[ \] 初期ユーザー向けコールドスタート対応

### **Phase 6: 仕上げ**

- \[ \] レスポンシブ対応（モバイル最適化）
- \[ \] エラーハンドリング
- \[ \] ローディング・スケルトン UI
- \[ \] デプロイ・動作確認

---

## **今後の拡張案（MVP 後）**

- ユーザーによるソース追加機能
- X (Twitter) 連携
- Podcast 音声の文字起こし・要約
- プッシュ通知
- ブックマーク機能
- シェア機能
- カテゴリフィルター
- ダークモード

---

## **未決定事項**

- \[ \] MVP の固定ソース 3 つの選定
- \[ \] Gemini モデルの最終選定（コスト・精度のバランス検証後）
