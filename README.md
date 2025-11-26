# SocialOps

SNS運用特化型タスク管理SaaS。「DB中心設計」「全自動生成」「堅牢なデータ整合性」を掲げたv7.0アーキテクチャに基づく。

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database & Auth:** Supabase (SSR / Postgres)
- **UI:** Tailwind CSS, Shadcn UI
- **Date Handling:** date-fns, date-fns-tz (JST固定運用)

## Architecture (v7.0)

- **Core Philosophy:**
  - DB制約（Unique Index）による鉄壁の重複防止。
  - 論理削除（`deleted_at`）の統一運用。
  - タイムゾーンはJST（`Asia/Tokyo`）を基準とし、日付計算を行う。

## Setup & Development

### Environment Variables
`.env.local` に以下のキーを設定してください：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_DEV_BYPASS` (Optional: `true` for bypass)
- `NEXT_PUBLIC_MOCK_USER_ID` (Optional: UUID for bypass)

### Dev Bypass Mode
ローカル開発時に認証をスキップするには、`.env.local` で以下を設定します：
```bash
NEXT_PUBLIC_DEV_BYPASS=true
NEXT_PUBLIC_MOCK_USER_ID=your-test-user-uuid
```

### Commands
- `npm run dev`: 開発サーバー起動
- `npm run backup`: 手動バックアップ（Git Commit & Push）

## Features Checklist (Current Status)

- [x] Project Setup & DB Schema (v7.0)
- [x] Authentication (Login/Signup/Middleware)
- [x] Dev Bypass Mode (Local only)
- [x] Client Management (CRUD + Soft Delete)
- [x] Routine Management (JSONB Frequency)
- [x] Task Generation Engine (JST aware)
- [ ] Dashboard Task Display (Next Step)
