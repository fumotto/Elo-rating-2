# Playwright E2E テスト

## 概要

このディレクトリでは、Vite アプリの E2E テストを Playwright で管理します。

## 使い方

1. フロントエンドをビルドまたは開発サーバーで起動する
2. 次のコマンドでテストを実行する

```bash
npx playwright test --config=playwrite/playwright.config.ts
```

## 注意

- 実際の認証フローは Discord 認証に依存するため、ここではゲストユーザー向けの公開ページと権限制御を中心にしています。
- 管理者・選手ユーザーの自動ログインは別途モックまたはテスト用環境の整備が必要です。
