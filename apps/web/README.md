# @curio/web

React フロントエンド。Tinder ライクなスワイプ UI でパーソナライズドされた記事を閲覧する。

## 主な機能

- スワイプ操作による記事のブラウジング（SKIP / LIKE）
- カテゴリフィルタリング
- セッションサマリー画面（記事がなくなった時の統計表示）
- 統計ダッシュボード（ドーナツチャート、バーチャート）
- Google ログイン + メール/パスワード認証
- オンボーディング（初回カテゴリ選択）

## ディレクトリ構成

```
src/
├── routes/              # ファイルベースルーティング (TanStack Router)
│   ├── index/           # / - メインフィード（スワイプ UI）
│   ├── login/           # /login - ログイン
│   ├── signup/          # /signup - ユーザー登録
│   └── onboarding/      # /onboarding - カテゴリ選択
├── components/          # React コンポーネント
│   ├── feed/            # フィード・スワイプ関連
│   ├── charts/          # 統計チャート
│   ├── auth/            # 認証 UI
│   ├── layout/          # レイアウト
│   ├── onboarding/      # オンボーディング
│   ├── providers/       # Context プロバイダ
│   └── ui/              # 共通 UI パーツ
├── hooks/               # カスタムフック (useFeed, useAuth, etc.)
├── lib/                 # ユーティリティ（API クライアント、認証）
├── store/               # Jotai ステート管理
│   └── atoms/           # Atom 定義
├── styles/              # グローバル CSS (Tailwind)
├── types/               # TypeScript 型定義
└── main.tsx             # エントリポイント
```

## スクリプト

```bash
pnpm --filter @curio/web dev         # 開発サーバー起動
pnpm --filter @curio/web build       # プロダクションビルド
pnpm --filter @curio/web preview     # ビルド結果プレビュー
pnpm --filter @curio/web typecheck   # 型チェック
```

## 主な技術

- **React 19** + **Vite** - UI + ビルド
- **TanStack Router** - ファイルベースルーティング
- **TanStack Query** - サーバーステート管理
- **Jotai** - クライアントステート管理
- **Tailwind CSS** - スタイリング
- **Framer Motion** - アニメーション
- **Recharts** - チャート描画
