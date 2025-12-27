---
name: git-create-pr
description: GitHub Pull Requestを作成するスキル。PR作成時、gh pr createを実行したい時に使用する。
---

# git-create-pr

GitHub Pull Request を Draft で作成する。

## 実行手順

1. `git status` で現在のブランチと変更状況を確認
2. `git log origin/main..HEAD --oneline` でコミット履歴を確認
3. `git diff origin/main...HEAD --stat` で変更ファイルを確認
4. リモートにブランチをプッシュ（未プッシュの場合）
5. PR を Draft で作成

## プッシュ時のルール

- 必ず `--set-upstream` オプションを指定する
- 例: `git push -u origin <branch_name>`

## PR作成コマンド

```bash
gh pr create --draft --title "タイトル" --body "本文"
```

## PR本文のテンプレート

`.github/PULL_REQUEST_TEMPLATE.md` の形式に従い、以下のセクションを含める:

```markdown
## 概要

<!-- 変更の概要を記載 -->

## 関連するIssue

<!-- 関連するIssue番号があれば記載（例: #123） -->

## 実装内容

<!-- 機能追加 / バグ修正 / リファクタリング / ドキュメント修正 / その他 -->

## 動作確認

<!-- 動作確認した内容を記載 -->

## レビュー観点

<!-- レビュワーが注目すべきポイント -->

## 未着手の項目

<!-- 今後実装予定のタスク -->

## 補足事項

<!-- その他の注意点 -->
```

## タイトルのルール

- Conventional Commits の type を prefix として使用可
- 簡潔で内容がわかるタイトルにする
- 日本語で記述

## 注意事項

- main ブランチでは PR を作成しない
- Draft で作成するため `--draft` フラグは必須
