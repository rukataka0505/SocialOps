# SocialOps

**Concept:** 「『いつ・誰が・何をやるか』が一目でわかる。SNS運用チームのためのカレンダー型ワークスペース。」  
**Tagline:** 「スプシ地獄」と「チャット連絡」からチームを解放する、自動化されたワークスペース。

## Product Vision

**The Core Experience:**
- **Calendar is King:** トップページはリストではなく「カレンダー」。いつ・誰が・何を投稿するかを1枚の絵で支配する。
- **Side-by-Side Management:** カレンダーで「全体の流れ」を見ながら、右側のメンバーリストで「個人の負荷」を確認・調整する。
- **Zero Input:** タスクは手入力するものではなく、ルーチンから「自動で降ってくる」もの。ユーザーは調整と消化に集中する。

## Core Philosophy (Iron Rules)

1. **Don't Make Me Think:** 迷わせない。招待リンクで即参加、ルーチン保存で即タスク生成。
2. **Spreadsheet Centric:** 複雑な分析はスプシに任せ、本ツールは「最強のハブ」に徹する。
3. **Flexible Schema:** `attributes` (JSONB) を活用し、媒体・ジャンル・単価などの増減に柔軟に対応する。
4. **Simple Interaction:**  
   - ドラッグ操作 = 「日付（いつ）」の変更に限定する。  
   - 「誰がやるか」の変更は、常に詳細ダイアログ（Task / Member）から行う。

## Architecture & Roadmap (v10.0)

### ✅ Phase 1-3: Foundation (Completed)

- **DB Flexibility:** `tasks.attributes`, `clients.spreadsheet_url` 実装済み。
- **Team Identity:** 招待URLによるメンバー追加機能。
- **Auto-Assign:** ルーチン設定時に担当者を指定し、タスク生成時に自動割り当て。
- **Guest User System:** アカウント不要のゲストユーザー管理機能。

### ✅ Phase 4: Calendar + Member Console Dashboard (Completed)

ダッシュボードを「リスト型」から  
**「カレンダー＋メンバーリストの2ペイン構成」**へ完全リニューアル完了。

### ✅ Phase 5: Web App Transformation (Completed)

Webサイト的なページ遷移を廃止し、**「Webアプリ（SPA）的な操作感」**へ進化。

- **Persistent Header:** ヘッダー（ナビゲーション）をレイアウト層に移動し、ページ遷移時も常駐。
- **Instant Switching:** ダッシュボード、クライアント、設定画面を「タブ切り替え」の感覚で瞬時に移動。
- **Cockpit UI:** 「戻る」ボタンを廃止し、常にヘッダーから全ての機能にアクセス可能。

### ✅ Phase 6: Team Settings & Dynamic Task UI (Completed)

チーム設定を拡張し、タスク作成UIを動的に変化させる「カスタマイズ可能なワークフロー」を実装。

- **Team Settings (チーム設定):**
  - **ワークフローステータス管理:** チームごとにカスタムステータス（例: 未着手、進行中、確認待ち、完了）を定義可能。
  - **カスタム入力項目管理:** タスクに独自の入力項目（テキスト、URL、日付、選択肢）を追加可能。

- **Dynamic Task Dialog (動的タスクダイアログ):**
  - チーム設定に応じてステータス選択肢が自動で反映。
  - カスタムフィールドが動的にレンダリング。
  - サブタスク管理機能（親タスクに紐づく子タスクの追加・表示）。

### ✅ Phase 7: Client Cockpit (案件コックピット) (Completed)

クライアント詳細画面を「案件コックピット」として大幅強化。

- **Tabs Interface (タブ構成):**
  - **概要 (Overview):** 基本情報、アカウント情報（credentials）、リソースリンク（resources）、ルーチン設定。
  - **進行表 (Schedule):** 月次の縦並びリスト形式で投稿予定を管理。日付ごとに親タスクを表示し、空の日には「+」ボタンで即座にタスク追加可能。
  - **全タスク (Tasks):** クライアントに関連する全タスクをリスト表示。

- **Credentials & Resources Management:**
  - アカウント情報（サービス名、ID、パスワード）の管理。パスワードは目のアイコンで表示/非表示切り替え可能。
  - リソースリンク（タイトル、URL）の管理。

- **Monthly List Schedule (月次進行表):**
  - 1日から月末までの日付を縦に並べたテーブル形式。
  - 土曜日は青系、日曜日は赤系の背景色で視認性向上。
  - 各日付に親タスク（`is_milestone: true`）を表示。
  - タスクがない日には「+」ボタンで新規タスクを即座に作成可能。

- **Personal Dashboard Filtering:**
  - ダッシュボードのカレンダーとタスクリストは、ログインユーザーが担当者になっているタスクのみを表示（個人のToDoリストとして機能）。

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database & Auth:** Supabase (PostgreSQL + SSR)
- **UI:** Tailwind CSS, Shadcn UI
- **Date Handling:** date-fns, date-fns-tz (Asia/Tokyo Standard)
- **Calendar:** react-big-calendar
- **Drag & Drop:** @dnd-kit/core

## Key Features (v10.0)

### ✅ 実装済み機能

- **認証 & チーム管理**
  - Supabase Auth による認証
  - 招待URL によるチームメンバー追加
  - ゲストユーザー管理（アカウント不要のアクセス）
  - ロールベースのアクセス制御（Owner / Admin / Member）

- **クライアント管理**
  - クライアント情報の CRUD
  - スプレッドシートURL の管理（外部シートへのハブ機能）
  - アカウント情報（credentials）とリソースリンク（resources）の管理
  - タブ構成の案件コックピット（概要、進行表、全タスク）
  - ソフトデリート対応

- **ルーチン & タスク自動生成**
  - 曜日・時刻指定のルーチン設定
  - ルーチンからのタスク自動生成（週次）
  - デフォルト担当者の自動割り当て
  - 重複防止（UNIQUE制約による冪等性）

- **カレンダー型ダッシュボード**
  - `react-big-calendar` による月次ビュー
  - タスクのドラッグ&ドロップによる日付変更
  - 担当者アイコン表示
  - ステータス別の色分け
  - 個人のタスクのみをフィルタリング表示

- **タスク管理**
  - タスク詳細ダイアログによる編集
  - 複数担当者のアサイン機能（`task_assignments`）
  - カスタムフィールド（JSONB による柔軟なスキーマ）
  - チーム設定に応じた動的ステータス選択
  - 親子タスク構造（`parent_id`、`is_milestone`）
  - サブタスク管理
  - 優先度・ステータス管理
  - ソフトデリート対応

- **チーム設定**
  - ワークフローステータスのカスタマイズ
  - カスタム入力項目の定義（テキスト、URL、日付、選択肢）
  - 設定内容はタスクダイアログに自動反映

- **メンバー管理**
  - メンバー詳細ダイアログ
  - 未完了タスク一覧表示
  - 期限切れタスクのハイライト
  - ロール変更機能（権限に応じて）

- **ユーザープロフィール**
  - プロフィール編集ダイアログ
  - 名前の変更（ゲストユーザーも対応）

## Database Schema

主要テーブル:
- `users` - ユーザー情報
- `teams` - チーム情報（`settings` JSONB でワークフロー設定を保存）
- `team_members` - チームメンバー（ロール管理）
- `team_invitations` - チーム招待URL
- `clients` - クライアント情報（`credentials`, `resources` JSONB で拡張情報を保存）
- `routines` - ルーチン設定
- `tasks` - タスク（`attributes` JSONB でカスタムフィールド対応、`workflow_status`, `parent_id`, `is_milestone`, `is_private` で階層構造とワークフロー管理）
- `task_assignments` - タスク担当者（複数割り当て対応）
- `guest_users` - ゲストユーザー情報
- `projects` - プロジェクト（将来の拡張用）
- `notifications` - 通知（将来の拡張用）
- `system_logs` - システムログ

すべてのテーブルで `deleted_at` によるソフトデリートを実装。

## Current Status (v10.0)

- [x] Authentication & Team Invite
- [x] Guest User Management
- [x] Client Management (Hub)
- [x] Client Cockpit (Tabs: Overview, Schedule, Tasks)
- [x] Credentials & Resources Management
- [x] Monthly List Schedule (Vertical Format)
- [x] Routine & Task Auto-Generation
- [x] Auto-Assign Logic
- [x] Calendar & Member List View
- [x] Personal Dashboard Filtering
- [x] Task Detail Dialog & Edit
- [x] Dynamic Task Dialog (Team Settings Integration)
- [x] Subtask Management
- [x] Member Detail Console
- [x] Drag & Drop (Date Reschedule)
- [x] Custom Fields (Per-Task & Team-Defined)
- [x] Web App Architecture (Persistent Layout)
- [x] Team Settings (Workflow Statuses & Custom Fields)
- [ ] Notifications
- [ ] Filter & Highlight
- [ ] Analytics Dashboard

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database migrations
npx supabase db push
```

## Project Structure

```
SocialOps/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Persistent layout with Header
│   │   ├── dashboard/page.tsx  # Personal dashboard (filtered tasks)
│   │   ├── clients/
│   │   │   ├── page.tsx        # Client list
│   │   │   └── [id]/page.tsx   # Client Cockpit (Tabs)
│   │   └── settings/
│   │       └── team/page.tsx   # Team settings
│   ├── login/
│   └── access/[token]/         # Guest access
├── components/
│   ├── dashboard/
│   │   ├── header.tsx          # Persistent header with navigation
│   │   ├── calendar-board.tsx  # Main calendar view
│   │   ├── team-panel.tsx      # Member list sidebar
│   │   └── my-tasks.tsx        # Personal task list
│   ├── clients/
│   │   ├── client-overview.tsx         # Client details, credentials, resources
│   │   └── monthly-list-schedule.tsx   # Monthly schedule (vertical list)
│   ├── tasks/
│   │   └── task-dialog.tsx     # Dynamic task dialog
│   ├── settings/
│   │   └── task-settings.tsx   # Team settings for workflows
│   └── ui/                     # Shadcn UI components
├── actions/
│   ├── tasks.ts                # Task-related server actions
│   ├── clients.ts              # Client-related server actions
│   └── teams.ts                # Team-related server actions
├── supabase/
│   └── migrations/             # Database migration files
└── types/
    └── database.types.ts       # Supabase type definitions
```

## License

ISC
