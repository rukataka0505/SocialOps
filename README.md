# SocialOps

## 1. Product Concept: "SocialOps"
**Tagline:** スプシ地獄からSNS運用者を救う、超シンプルな「チーム用タスクOS」。

**Mission:**
- 「入力するツール」ではなく「仕事が降ってくるツール」を作る。
- 複雑なカスタマイズを排除し、迷わせないUIを提供する。

**Target Audience:**
- スプレッドシートとチャットツール（Slack/Discord）で消耗している小規模SNS運用チーム。

## 2. Core Features (v1 Roadmap)
### 🛡 脱・タスク管理シート
- **ルーチン設定に基づくタスク自動生成:** 毎週勝手に仕事が降ってくる仕組み。
- **Today画面:** 今日やることだけに集中できるシンプルなUI。

### 👥 脱・担当者管理シート
- **案件ごとのRole明確化:** 「誰が・何を」やるかを明確にする。
- **チームメンバー管理:** Slackのような直感的なメンバー管理。

### 🔗 脱・リンク集
- **ハブ機能:** クライアントごとに既存のスプレッドシート（実績管理用など）へのURLを統合。「ここを見れば全部ある」状態を作る。

## 3. Tech Stack
- **Framework:** Next.js 15 (App Router)
- **DB/Auth:** Supabase
- **UI:** Tailwind CSS, Shadcn UI
- **Logic:** date-fns-tz (JST Standard)

## 4. Architecture Philosophy (v8.0 Changes)
### Flexible Schema
- `tasks` テーブルはコア項目以外を `JSONB` で持ち、将来の拡張（ジャンル・単価・工数など）に柔軟に対応する。

### Database Centric
- 外部API連携（Instagram API等）はv1では行わず、まずはDB内での完結を目指す。

## 5. Development Status
- **Current Version**: v8.0 (Phase 1: DB Migration & Spreadsheet Integration)
- **Status**: Active Development
- **Recent Updates**:
  - Added `spreadsheet_url` to Clients and `attributes` to Tasks.
  - Implemented Spreadsheet Integration in Client Management.
  - Refined Dashboard UI (v7.0).
  - Implemented Routine Task Generation Logic.
  - Added Dev Bypass Authentication.
- [ ] Spreadsheet URL Integration (New)
- [ ] Member Role Assignment (New)
