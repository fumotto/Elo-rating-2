---
name: Vite
description: |
  Viteプロジェクトの設定、ビルド、開発環境、
  プラグイン設定、環境変数、import構成を扱う場合に適用する。

globs:
  - "vite.config.*"
  - "vitest.config.*"
  - "package.json"

alwaysApply: false
---

# Vite

## 基本方針

- Viteの標準構成を優先する
- 不要なプラグインは追加しない
- Build速度を優先する

## Import

- import alias（@/）を利用する
- 相対パスを深くしない

## Environment

- VITE\_プレフィックス以外の環境変数をクライアントへ渡さない
- .env.example を更新する

## Build

- Tree Shakingを阻害しない
- Dynamic Importを適切に利用する

## Dependencies

新しいライブラリを追加する場合は

- 必要性
- メリット
- デメリット
- 代替案

を簡潔に説明する。
