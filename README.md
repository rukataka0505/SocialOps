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

## Architecture & Roadmap (v9.0)

### ✅ Phase 1-3: Foundation (Completed)

- **DB Flexibility:** `tasks.attributes`, `clients.spreadsheet_url` 実装済み。
- **Team Identity:** 招待URLによるメンバー追加機能。
- **Auto-Assign:** ルーチン設定時に担当者を指定し、タスク生成時に自動割り当て。
- **Guest User System:** アカウント不要のゲストユーザー管理機能。

### ✅ Phase 4: Calendar + Member Console Dashboard (Completed)

ダッシュボードを「リスト型」から  
**「カレンダー＋メンバーリストの2ペイン構成」**へ完全リニューアル完了。

---

#### ✅ Step 1: View Layer (表示) - 完了

- **Main Calendar (CalendarBoard):**  
  - `react-big-calendar` を使用。JST基準でタスクを帯表示。  
  - 月ビューを基本とし、日付ごとにタスクのタイトルと担当者アイコンを表示。
  - ドラッグ&ドロップによる日付変更機能実装済み。
- **Member List (TeamPanel):**  
  - 画面右側に常駐するサイドバー。  
  - チームメンバーのリスト（名前 / アバター / ロール）を表示。
- **Data Fetching:**  
  - `getTasks(start, end)` で期間指定のタスクを一括取得。

---

#### ✅ Step 2: Detail & Edit Layer (TaskDialog) - 完了

- **Task Dialog (Edit Mode):**
  - カレンダー上のタスククリック → `TaskDialog` を開く。
  - 編集可能項目：
    - タイトル、期限（`due_date`）、担当者（複数割り当て対応）
    - 優先度、ステータス、完了チェック
    - カスタムフィールド（タスクごとに柔軟に追加・編集可能）
    - スプシURL / 制作物URL など
  - 「削除」ボタンによるタスク削除機能。

- **Server Actions:**
  - `updateTask(taskId, payload)` - 部分更新
  - `deleteTask(taskId)` - ソフトデリート

- **Interaction Rules:**
  - カレンダー上のドラッグ&ドロップ → `due_date` のみ更新（リスケ専用）。  
  - 担当者変更は必ず `TaskDialog` から行う。

---

#### ✅ Step 3: Member Console (Member Detail) - 完了

- **Member Detail Dialog (`MemberDetailDialog`):**
  - 右側の `TeamPanel` でメンバーをクリック → メンバー詳細ダイアログを開く。
  - Header:
    - アバター、名前、メールアドレス、ロール（Owner / Admin / Member）
  - Body:
    - そのメンバーにアサインされた **未完了タスク一覧** を表示。
    - 各タスクの期限・優先度を表示。期限切れタスクは赤色でハイライト。
    - 権限がある場合、ロールドロップダウンからメンバーのロールを変更可能。
  - Stats:
    - 未完了タスク数、期限切れタスク数を表示。

---

### 📌 Phase 5: Polish (Next Steps)

- **Notifications:** 期限切れアラート等の通知機能。
- **Filter & Highlight:** メンバー / クライアント / チャンネル別のフィルタリングとハイライト。
- **Analytics:** チーム全体の稼働状況を可視化するダッシュボード。

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database & Auth:** Supabase (PostgreSQL + SSR)
- **UI:** Tailwind CSS, Shadcn UI
- **Date Handling:** date-fns, date-fns-tz (Asia/Tokyo Standard)
- **Calendar:** react-big-calendar
- **Drag & Drop:** @dnd-kit/core

## Key Features (v9.0)

### ✅ 実装済み機能

- **認証 & チーム管理**
  - Supabase Auth による認証
  - 招待URL によるチームメンバー追加
  - ゲストユーザー管理（アカウント不要のアクセス）
  - ロールベースのアクセス制御（Owner / Admin / Member）

- **クライアント管理**
  - クライアント情報の CRUD
  - スプレッドシートURL の管理（外部シートへのハブ機能）
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

- **タスク管理**
  - タスク詳細ダイアログによる編集
  - 複数担当者のアサイン機能（`task_assignments`）
  - カスタムフィールド（JSONB による柔軟なスキーマ）
  - 優先度・ステータス管理
  - ソフトデリート対応

- **メンバー管理**
  - メンバー詳細ダイアログ
  - 未完了タスク一覧表示
  - 期限切れタスクのハイライト
  - ロール変更機能（権限に応じて）

- **ユーザープロフィール**
  - プロフィール編集ダイアログ
  - 名前の変更（ゲストユーザーも対応）

## Current Status (v9.0)

- [x] Authentication & Team Invite
- [x] Guest User Management
- [x] Client Management (Hub)
- [x] Routine & Task Auto-Generation
- [x] Auto-Assign Logic
- [x] Calendar & Member List View
- [x] Task Detail Dialog & Edit
- [x] Member Detail Console
- [x] Drag & Drop (Date Reschedule)
- [x] Custom Fields (Per-Task)
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
```

## Database Schema

主要テーブル:
- `users` - ユーザー情報
- `teams` - チーム情報
- `team_members` - チームメンバー（ロール管理）
- `team_invitations` - チーム招待URL
- `clients` - クライアント情報
- `routines` - ルーチン設定
- `tasks` - タスク（`attributes` JSONB でカスタムフィールド対応）
- `task_assignments` - タスク担当者（複数割り当て対応）
- `projects` - プロジェクト（将来の拡張用）
- `notifications` - 通知（将来の拡張用）
- `system_logs` - システムログ

すべてのテーブルで `deleted_at` によるソフトデリートを実装。
