---
project: "Elo Rating Manager (3v3)"
repo: "github.com/fumotto/Elo-rating-2"
version: "dev"
last_updated: "2026-06-29"
---

# 概要
Supabase バックエンドと Discord OAuth 認証を備えた 3 対 3 チーム戦マッチ管理 Web アプリです。フロントエンドは Vite + React、バックエンドは Supabase の認証・PostgreSQL・RPC を利用して構成されています。

# 目的とゴール
- Discord アカウントでのログインを実現する
- 3 つのユーザーロールでアクセス制御を行う
- 3v3 のマッチ登録と Elo レート計算をサポートする
- SteamID / PSN ID の外部 ID による選手識別を可能にする
- 管理者向けのロールバック / ランクリセット / K 係数設定を提供する
- UI とデータモデルを最新の実装に合わせる

# ステークホルダー
- プロダクトオーナー: fumotto
- 開発リード: fumotto

# 用語集
- `guest_user`: ランキング・戦績履歴のみ閲覧できるゲストユーザー
- `normal_user`: 戦績登録が可能な通常ユーザー
- `admin_user`: 選手管理・ロール管理・ロールバックなどの管理者権限をもつユーザー
- `SteamID`: プレイヤーを外部データと照合するための Steam アカウント識別子
- `PSN ID`: プレイヤーを外部データと照合するための PlayStation Network アカウント識別子
- `K 係数`: Eloレーティング変動の強さを決めるパラメータ

# 主要機能
- Discord OAuth によるログイン
- Supabase 認証と `user_profiles` の同期
- ロールベースの UI 表示制御
- 管理者向けの選手登録・編集・削除
- 3v3 戦績登録と Elo レート更新
- 最新戦績のロールバックとランキングリセット
- SteamID / PSN ID による OCR JSON からの選手マッチング
- ランキングと戦績履歴の表示

# アーキテクチャ図
- `docs/architecture.mmd`

# ディレクトリ構成
- `vite/`: フロントエンドコード（Vite + React）
- `supabase/`: Supabase マイグレーション、RPC、設定
- `docs/`: プロジェクトドキュメントとアーキテクチャ図

# 主要 API / RPC
- `supabase.rpc('ensure_user_profile')`: ユーザープロファイル行を確実に作成/更新
- `supabase.rpc('register_match')`: 3v3 戦績の登録
- `supabase.rpc('rollback_last_match')`: 最新戦績のロールバック
- `supabase.rpc('reset_rankings')`: 選手レートを初期値に戻す
- `supabase.rpc('set_k_factor')`: K 係数を更新する
- `supabase.rpc('get_ranking')`: ランキング取得
- `supabase.rpc('get_match_history')`: 戦績履歴取得

# 非機能要件
- 開発環境では Node 24 LTS を推奨
- Supabase 認証プロバイダは Discord を使用
- フロントエンドは GitHub Pages へデプロイ可能

# 更新履歴
- 2026-06-29: 実装状況に合わせてドキュメントを最新化
