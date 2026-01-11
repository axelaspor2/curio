---
name: git-create-commit
description: Conventional Commits形式でgitコミットメッセージを作成するスキル。コミット作成時、git commitを実行したい時、変更をコミットしたい時に使用する。
---

# git-create-commit

Conventional Commits 形式でコミットメッセージを作成する。

## 実行手順

1. `git status` でファイルを確認
2. [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) に従ってコミットを実行

## 形式の指定

- `type(scope): subject` の形式に従う
- タイトルは50文字以内、本文は72文字程度で改行
- 動詞は原形を使用（add, fix, update など）
- scope は原則記述するが、適切なものがない場合は省略可
- コミットメッセージは prefix 以外は日本語で書く

## 実装とテストが含まれる場合の優先ルール

- 実装とテストコードが含まれている場合、type は test よりも feat/fix を優先する

## Conventional Commits の type 一覧

| type | 説明 |
|------|------|
| feat | 新機能の追加 |
| fix | バグ修正 |
| docs | ドキュメントのみの変更 |
| style | コードの意味に影響しない変更（空白、フォーマット等） |
| refactor | バグ修正でも機能追加でもないコード変更 |
| perf | パフォーマンス改善 |
| test | テストの追加・修正 |
| build | ビルドシステムや外部依存に関する変更 |
| ci | CI設定ファイルやスクリプトの変更 |
| chore | その他の変更（ソースやテストに影響しない） |
