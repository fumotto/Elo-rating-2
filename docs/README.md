# プロジェクトドキュメント

## 概要
イロレーティングシステムに基づく3対3チーム戦マッチ対戦管理アプリケーションです。

## 主な機能
- **Discordアカウントログイン**による認証
- **Adminユーザー**：選手登録・名前変更、戦績登録・ロールバック、ランキング管理
- **Normalユーザー**：戦績登録、ランキング表示
- **Guestユーザー**：ランキング・戦績履歴の閲覧

## アーキテクチャ
- フロントエンド：Vite + React
- バックエンド：Supabase（認証・RDB）
- デプロイ：GitHub Pages（フロント）・Supabase（バックエンド）

## ドキュメント
- アーキテクチャ図：`docs/architecture.mmd`
- 取り扱い説明書
  - ゲストユーザー: `docs/manuals/guest-user-manual.md`
  - 選手ユーザー: `docs/manuals/player-user-manual.md`
  - 管理者ユーザー: `docs/manuals/admin-user-manual.md`
- Playwright E2E テストケース一覧: `docs/specs/playwright-e2e-test-cases.md`
- 本プロジェクトの詳細：このファイル
