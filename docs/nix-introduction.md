# Nix 入門

このドキュメントでは、Nix パッケージマネージャーの基本概念と、Curio プロジェクトでの活用方法を説明します。

## Nix とは

Nix は**宣言的で再現可能なパッケージマネージャー**です。主な特徴：

- **再現性**: 同じ設定ファイルから、どのマシンでも同一の環境を構築できる
- **分離性**: プロジェクトごとに異なるバージョンのツールを共存できる
- **ロールバック**: 環境の変更を簡単に元に戻せる
- **宣言的**: 環境を「どうなっているべきか」で記述する

## なぜ Nix を使うのか

### 従来の課題

```
"僕の環境では動くんだけど..."
```

- Node.js のバージョンが違う
- システムに入っている依存関係が違う
- グローバルにインストールしたツールのバージョンが違う

### Nix による解決

```nix
# flake.nix で環境を宣言
devShells.default = mkShell {
  packages = [
    nodejs_22
    pnpm_10
    postgresql_17
  ];
};
```

全員が同じバージョンのツールを使える。

## インストール

### macOS / Linux

```bash
# Determinate Systems のインストーラー（推奨）
curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install

# または公式インストーラー
sh <(curl -L https://nixos.org/nix/install) --daemon
```

### Flakes を有効化（公式インストーラーの場合のみ）

```bash
# ~/.config/nix/nix.conf に追加
mkdir -p ~/.config/nix
echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf
```

### direnv のインストール（推奨）

direnv を使うと、ディレクトリに入った時に自動で環境が有効になります。

```bash
# Nix でインストール
nix profile install nixpkgs#direnv

# シェルに hook を追加（~/.zshrc または ~/.bashrc）
eval "$(direnv hook zsh)"  # zsh の場合
eval "$(direnv hook bash)" # bash の場合
```

## このプロジェクトでの使い方

### 初回セットアップ

```bash
# リポジトリをクローン
git clone <repository-url>
cd curio

# direnv を許可（初回のみ）
direnv allow
```

これだけで Node.js, pnpm, PostgreSQL クライアントなど必要なツールが使えるようになります。

### 手動で環境に入る

direnv を使わない場合：

```bash
nix develop
```

### 環境の更新

`flake.nix` が更新されたら：

```bash
# flake.lock を更新
nix flake update

# 環境を再構築（direnv を使っている場合は自動）
direnv reload
```

## 基本的な Nix コマンド

| コマンド | 説明 |
|---------|------|
| `nix develop` | 開発環境シェルに入る |
| `nix flake update` | 依存関係を最新に更新 |
| `nix flake show` | flake の内容を表示 |
| `nix run nixpkgs#<package>` | パッケージを一時的に実行 |
| `nix search nixpkgs <query>` | パッケージを検索 |

## flake.nix の構造

```nix
{
  description = "プロジェクトの説明";

  inputs = {
    # 依存する外部 flake
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      # サポートするプラットフォーム
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
    in {
      # 開発環境の定義
      devShells.<system>.default = mkShell {
        packages = [ ... ];
      };
    };
}
```

## トラブルシューティング

### `direnv: error .envrc is blocked`

```bash
direnv allow
```

### 古いパッケージバージョンが使われる

```bash
# キャッシュをクリア
nix flake update
direnv reload
```

### `nix` コマンドが見つからない

ターミナルを再起動するか、以下を実行：

```bash
. /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.sh
```

## 参考リンク

- [Nix 公式サイト](https://nixos.org/)
- [Nix Flakes 入門](https://nixos.wiki/wiki/Flakes)
- [Zero to Nix](https://zero-to-nix.com/) - 初心者向けチュートリアル
- [nix.dev](https://nix.dev/) - 公式ドキュメント
- [Determinate Systems](https://determinate.systems/) - Nix ツールとリソース
