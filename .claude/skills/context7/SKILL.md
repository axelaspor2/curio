---
name: context7
description: "ライブラリやフレームワークの最新ドキュメントをContext7 APIから取得するスキル。以下の場合に使用する：(1) ユーザーがライブラリの使い方を尋ねた時、(2) プロジェクトで使用している技術の実装方法がわからない・確信が持てない時、(3) エラーが発生して公式ドキュメントの確認が必要な時、(4) 最新のAPIや推奨パターンを確認したい時。Claude自身が必要と判断した場合、ユーザーの明示的な指示がなくても自律的にこのスキルを使用してよい。"
---

# Context7 Documentation Fetcher

ライブラリやフレームワークの最新ドキュメントをContext7から取得する。

## いつ使うべきか

このスキルは以下の状況で**自律的に**使用すること：

- ✅ **実装方法がわからない時**: プロジェクトで使用している技術の最新のAPIや書き方がわからない
- ✅ **確信が持てない時**: 知識が古い可能性がある、または最新のベストプラクティスを確認したい
- ✅ **エラー解決時**: エラーメッセージの原因や解決方法を公式ドキュメントで確認したい
- ✅ **ユーザーの質問時**: ユーザーが「調べて」「使い方を教えて」と明示的に依頼した時

**重要**: ユーザーからの指示を待つ必要はない。必要と判断したら積極的に使用すること。

### 使用すべき具体例

- Honoの新しいミドルウェアの書き方がわからない → スキルを使って調べる
- Prismaのリレーション定義でエラーが出た → スキルを使って公式ドキュメントを確認
- Jotaiの非同期atomの最新パターンを確認したい → スキルを使って調べる
- TauriのIPC通信の実装方法を確認したい → スキルを使って調べる

## 使用方法

### 1. ライブラリIDの検索

```bash
node scripts/search.js "ライブラリ名"
```

例: `node scripts/search.js "next.js"`

### 2. ドキュメントの取得

```bash
node scripts/get-docs.js "ライブラリID" "トピック(省略可)" "トークン数(省略可、デフォルト5000)"
```

**基本的な例:**
- `node scripts/get-docs.js "/honojs/hono" "middleware"`
- `node scripts/get-docs.js "/prisma/prisma" "relations" "8000"`

**プロジェクトでよく使う例:**
- `node scripts/get-docs.js "/honojs/hono" "RPC"` - Hono RPCの使い方
- `node scripts/get-docs.js "/prisma/prisma" "transaction"` - Prismaトランザクション
- `node scripts/get-docs.js "/pmndrs/jotai" "async atom"` - Jotai非同期atom
- `node scripts/get-docs.js "/mantinedev/mantine" "form"` - Mantineフォーム
- `node scripts/get-docs.js "/tauri-apps/tauri" "IPC"` - Tauri IPC通信
- `node scripts/get-docs.js "/better-auth/better-auth" "stripe"` - Better Auth Stripe連携
- `node scripts/get-docs.js "/arktypeio/arktype" "validation"` - arktypeバリデーション

### 3. 検索からドキュメント取得まで一括実行

```bash
node scripts/fetch.js "ライブラリ名" "トピック(省略可)"
```

**基本的な例:**
- `node scripts/fetch.js "supabase" "authentication"`
- `node scripts/fetch.js "hono" "middleware"`

**プロジェクトでよく使う例:**
- `node scripts/fetch.js "jotai" "async"` - Jotaiの非同期処理
- `node scripts/fetch.js "mantine" "notifications"` - Mantineの通知機能
- `node scripts/fetch.js "better-auth"` - Better Authの概要

## ライブラリID一覧

### このプロジェクトで使用する技術（優先）

直接IDを指定することで検索ステップをスキップして高速に取得可能：

**バックエンド:**
- `/honojs/hono` - Hono（Webフレームワーク）
- `/prisma/prisma` - Prisma（ORM）
- `/better-auth/better-auth` - Better Auth（認証）

**フロントエンド:**
- `/facebook/react` - React
- `/pmndrs/jotai` - Jotai（状態管理）
- `/mantinedev/mantine` - Mantine（UIライブラリ）
- `/tanstack/router` - TanStack Router

**デスクトップ:**
- `/tauri-apps/tauri` - Tauri

**決済:**
- `/stripe/stripe-node` - Stripe

**バリデーション:**
- `/arktypeio/arktype` - arktype

### その他よく使うライブラリ

- `/vercel/next.js` - Next.js
- `/supabase/supabase` - Supabase
- `/tailwindlabs/tailwindcss` - TailwindCSS
- `/trpc/trpc` - tRPC

## 環境変数

`CONTEXT7_API_KEY` を設定するとレート制限が緩和される（省略可）。