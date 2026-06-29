---
name: Supabase

globs:
  - "supabase/**/*"
  - "**/*.sql"

regex:
  - "createClient"
  - "from\\("
  - "supabase"

alwaysApply: false

description: |
  SupabaseやPostgreSQLを扱う時
---

- RLS必須
- migrationを使用
- service_role禁止
