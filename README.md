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

## Architecture & Roadmap (v8.4)

### ✅ Phase 1-3: Foundation (Completed)

- **DB Flexibility:** `tasks.attributes`, `clients.spreadsheet_url` 実装済み。
- **Team Identity:** 招待URLによるメンバー追加機能。
- **Auto-Assign:** ルーチン設定時に担当者を指定し、タスク生成時に自動割り当て。

### 📌 Phase 4: Calendar + Member Console Dashboard (Current Focus)

ダッシュボードを「リスト型」から  
**「カレンダー＋メンバーリストの2ペイン構成」**へ完全リニューアルする。

---

#### Step 1: View Layer (表示)

まずは「データが正しく見える」状態を作る。

- **Main Calendar (CalendarBoard):**  
  - `react-big-calendar` を使用。JST基準でタスクを帯表示。  
  - 月ビューを基本とし、日付ごとにタスクのタイトルと担当者アイコンを表示する。
- **Member List (TeamPanel):**  
  - 画面右側に常駐するサイドバー。  
  - チームメンバーのリスト（名前 / アバター / ロールなど）を表示する。  
  - この段階ではクリックは任意（後続ステップで詳細ダイアログに接続）。

- **Data Fetching:**  
  - `getTasks(start, end)` で期間指定のタスクを一括取得し、  
    カレンダーとメンバーリストの両方に同じデータを渡す（Single Source of Truth）。

---

#### Step 2: Detail & Edit Layer (TaskDialog)

「タスクをクリックして詳細を見て、その場で編集できる」体験を実装する。

- **Task Dialog (Edit Mode):**
  - カレンダー上のタスククリック → `TaskDialog` を開く。
  - 以下の項目を編集可能にする：
    - タイトル
    - 期限（`due_date`）
    - 担当者（プルダウン / 未割り当て含む）
    - 優先度
    - スプシURL / 制作物URL など
    - ステータス / 完了チェック
  - 「削除」ボタンを追加し、タスク削除も可能にする。

- **Server Actions:**
  - `updateTask(taskId, payload)`（部分更新 / PATCH）
  - `deleteTask(taskId)`

- **Interaction Rules:**
  - カレンダー上のドラッグ＆ドロップ → `due_date` のみ更新（リスケ専用）。  
  - 担当者変更は必ず `TaskDialog` から行う（カレンダー上での People D&D は行わない）。

---

#### Step 3: Member Console (Member Detail)

マネジメント向けに「人軸で深掘りできる」コンソールを実装する。

- **Member Detail Dialog (`MemberDetailDialog`):**
  - 右側の `TeamPanel` でメンバーをクリック → メンバー詳細ダイアログを開く。
  - Header:
    - アバター
    - 名前
    - メールアドレス
    - ロール（Owner / Admin / Member など）
  - Body:
    - そのメンバーにアサインされた **未完了タスク一覧** を表示。  
      （タイトル・期限などの要約を表示）
    - 各タスクをクリックすると `TaskDialog` を開き、その場で担当変更 / リスケができる。
    - 権限がある場合、ロールドロップダウンからメンバーのロールを変更できる。
  - Footer:
    - 「このメンバーでカレンダーを絞り込む」ボタン（初期はUIのみ、ロジックは後続対応）。

---

### 📌 Phase 5: Polish

- **Notifications:** 期限切れアラート等の通知機能。
- **Filter & Highlight:** メンバー / クライアント / チャンネル別のフィルタリングとハイライト。

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** Supabase (PostgreSQL)
- **UI:** Tailwind CSS, Shadcn UI
- **Logic:** date-fns-tz (Asia/Tokyo Standard)
- **Libs:** react-big-calendar, @dnd-kit

## Current Status

- [x] Authentication & Team Invite
- [x] Client Management (Hub)
- [x] Routine & Task Auto-Generation
- [x] Auto-Assign Logic
- [ ] **Calendar & Member List View (Phase 4 - Step 1)**
- [ ] Task Detail Dialog & Edit (Phase 4 - Step 2)
- [ ] Member Detail Console (Phase 4 - Step 3)
- [ ] Drag & Drop (Date Reschedule Only)
