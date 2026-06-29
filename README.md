# Elo Rating Manager (3v3)

[fumotto/Elo-rating](https://github.com/fumotto/Elo-rating) をベースに、Supabase バックエンドと Discord 認証を備えた 3 対 3 チーム戦マッチ管理 Web アプリです。

## 構成

```
Elo-rating-2/
├── vite/              # Vite + React フロントエンド
├── supabase-project/  # Supabase マイグレーション・RPC・設定
└── docs/              # プロジェクトドキュメント
```

## 主な機能

| ロール | 権限 |
| --- | --- |
| `guest_user` | ランキング表示、戦績履歴表示 |
| `normal_user` | 上記 + 戦績登録 |
| `admin_user` | 上記 + 選手登録/編集、ロール管理、戦績ロールバック、ランクリセット、K 係数設定 |

Elo 計算は 3 人チームの平均レートから期待勝率を求め、同一チーム全員に同一のレート変動を適用します。

## ブランチ運用

| ブランチ | 用途 |
| --- | --- |
| `dev` | 開発環境。マージで開発用 GitHub Pages / Supabase にデプロイ |
| `release` | 本番環境。マージで本番 GitHub Pages / Supabase にデプロイ |

- Pull Request 作成時: CI で lint / test / build を実行
- `dev` への push: GitHub Pages 開発ブランチ + Supabase 開発プロジェクトへデプロイ
- `release` への push: GitHub Pages 本番 + Supabase 本番プロジェクトへデプロイ

## セットアップ

### 1. Node / 依存関係

- 推奨 Node バージョン: `24` (プロジェクトルートに `.nvmrc` を追加しています)

```bash
npm install
```

### 2. Supabase プロジェクト

1. [Supabase](https://supabase.com/) で dev / prod の 2 プロジェクトを作成
2. Authentication > Providers で Discord を有効化
3. Redirect URLs に以下を追加
   - ローカル: `http://127.0.0.1:5173`
   - 開発 Pages: `https://<user>.github.io/<repo>/dev/`
   - 本番 Pages: `https://<user>.github.io/<repo>/`

### 3. ローカル環境変数

`vite/.env.local` を作成し、以下を設定します:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_APP_ENV=development
```

Supabase のセルフホスト / スタック設定では、以下の環境変数も用意します:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key
SUPABASE_JWKS_URL=https://xxxx.supabase.co/auth/v1/.well-known/jwks.json
```

> 旧来の `VITE_SUPABASE_ANON_KEY` も一部互換性のため読み込まれますが、最新構成では `VITE_SUPABASE_PUBLISHABLE_KEY` を使用するのが基本です。

### 4. DB マイグレーション

Supabase CLI をインストール後:

```bash
supabase login
supabase link --project-ref <project-ref>
npm run db:push
```

初回管理者は Supabase SQL Editor で付与:

```sql
UPDATE user_profiles
SET role = 'admin_user'
WHERE id = '<your-auth-user-uuid>';
```

### 5. 開発サーバー

```bash
npm run dev
```

## GitHub 設定

### Repository Secrets

| Secret | 用途 |
| --- | --- |
| `VITE_SUPABASE_URL_DEV` | 開発 Supabase URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY_DEV` | 開発 publishable key |
| `VITE_SUPABASE_URL_PROD` | 本番 Supabase URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY_PROD` | 本番 publishable key |
| `SUPABASE_SECRET_KEY_DEV` | 開発 Supabase secret key |
| `SUPABASE_SECRET_KEY_PROD` | 本番 Supabase secret key |
| `SUPABASE_JWKS_URL_DEV` | 開発 JWKS URL |
| `SUPABASE_JWKS_URL_PROD` | 本番 JWKS URL |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI 用 |
| `SUPABASE_DB_PASSWORD` | DB push 用 |

### Repository Variables

| Variable | 用途 |
| --- | --- |
| `SUPABASE_PROJECT_REF_DEV` | 開発 project ref |
| `SUPABASE_PROJECT_REF_PROD` | 本番 project ref |

### GitHub Pages

Settings > Pages > Build and deployment > Source: **GitHub Actions**

### Environments

`development` / `production` 環境を作成し、上記 Secrets を設定してください。

## コマンド

```bash
npm run dev      # フロント開発
npm run build    # フロントビルド
npm run test     # Vitest
npm run lint     # Oxfmt/Oxlint
npm run db:push  # Supabase マイグレーション適用
```

## 参考

- 原版: https://github.com/fumotto/Elo-rating
- この実装では OCR JSON 連携、SteamID/PSN ID、K 係数、戦績ロールバック、ロール管理を Supabase RPC へ移植しています
