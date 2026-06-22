# Elo Rating Manager (3v3)

[fumotto/Elo-rating](https://github.com/fumotto/Elo-rating) をベースに、Supabase バックエンドと Discord 認証を備えた 3 対 3 チーム戦マッチ管理 Web アプリです。

## 構成

```
Elo_rating/
├── frontend/          # Vite + React フロントエンド
├── supabase/          # DB マイグレーション・シード・設定
└── .github/workflows/ # CI / デプロイ / Supabase マイグレーション
```

## 主な機能

| ロール | 権限 |
| --- | --- |
| `guest_user` | ランキング表示、戦績履歴表示 |
| `normal_user` | 上記 + 戦績登録 |
| `admin_user` | 上記 + 選手登録/改名、ロールバック、ランクリセット、K 係数、ユーザロール管理 |

Elo 計算は旧版と同様、3 人の平均レートから期待勝率を求め、同一チーム全員に同じ増減値を適用します。

## ブランチ運用

| ブランチ | 用途 |
| --- | --- |
| `dev` | 開発環境。マージで開発用 GitHub Pages / Supabase にデプロイ |
| `release` | 本番環境。マージで本番 GitHub Pages / Supabase にデプロイ |

- Pull Request 作成時: `ci.yml` で lint / test / build
- `dev` への push: 開発 Pages (`/リポジトリ名/dev/`) + Supabase dev マイグレーション
- `release` への push: 本番 Pages (`/リポジトリ名/`) + Supabase prod マイグレーション

## セットアップ

### 1. 依存関係

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

`frontend/.env.local` を作成:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ENV=development
VITE_BASE_PATH=/
```

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
| `VITE_SUPABASE_ANON_KEY_DEV` | 開発 anon key |
| `VITE_SUPABASE_URL_PROD` | 本番 Supabase URL |
| `VITE_SUPABASE_ANON_KEY_PROD` | 本番 anon key |
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

`development` / `production` 環境を作成し、上記 Secrets をそれぞれ設定してください。

## コマンド

```bash
npm run dev      # フロント開発
npm run build    # フロントビルド
npm run test     # Vitest
npm run lint     # ESLint
npm run db:push  # Supabase マイグレーション適用
```

## 参考

- 原版: https://github.com/fumotto/Elo-rating
- OCR JSON 連携、K 係数、履歴ロールバックなど旧版の概念を Supabase RPC に移植しています
