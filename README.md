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

- **DB Flexibility:** `tasks.attributes` 実装済み。
- **Team Identity:** 招待URLによるメンバー追加機能。
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
  - **カスタム入力項目管理:** 「通常タスク」と「投稿タスク（マイルストーン）」それぞれに独自の入力項目（テキスト、テキストエリア、URL、日付、選択肢）を定義可能。必須項目の設定も対応。

- **Dynamic Task Dialog (動的タスクダイアログ):**
  - チーム設定に応じてステータス選択肢が自動で反映。
  - タスク種別（通常/投稿）に応じたカスタムフィールドが初期表示。
  - タスク個別のフィールド追加・編集・削除が可能（チーム設定で必須化された項目を除く）。
  - サブタスク管理機能（親タスクに紐づく子タスクの追加・表示）。

### ✅ Phase 7: Client Cockpit (案件コックピット) (Completed)

クライアント詳細画面を「案件コックピット」として大幅強化。

- **Separation of Concerns (Ops vs Management):**
  - **投稿管理 (Ops):** `/ops` からアクセス。余計な設定項目を排除し、カレンダー（進行表）のみを表示。
  - **案件設定 (Management):** `/management` からアクセス。リボン（カード）形式の一覧から直感的に設定・編集が可能。

- **Client Cockpit (案件コックピット):**
  - **進行表 (Schedule):** 月次の縦並びリスト形式で投稿予定を管理。日付ごとに親タスクを表示し、空の日には「+」ボタンで即座にタスク追加可能。

- **Case Settings (案件設定):**
  - **概要 (Overview):** 基本情報、アカウント情報（credentials）、リソースリンク（resources）、ルーチン設定。

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
  - アカウント情報（credentials）とリソースリンク（resources）の管理
  - 案件コックピット（進行表のみのシンプルUI）
  - 案件設定一覧（リボン形式での管理）
  - ソフトデリート対応

- **カレンダー & ボード統合ダッシュボード**
  - **月次カレンダー:** スマートスタック表示（3件以下は全表示、4件以上は省略表示）。
  - **日別タスクリスト:** 日付クリックでその日のタスク一覧をポップアップ表示。
  - **週次カンバンボード:** 曜日ごとのリスト形式でタスクを管理。ドラッグ&ドロップで直感的に日程変更。
  - **シームレスな切り替え:** 「月」と「週」をタブで瞬時に切り替え。
  - 担当者アイコン表示、ステータス別色分け、個人タスクフィルタリング。

- **タスク管理**
  - タスク詳細ダイアログによる編集
  - 複数担当者のアサイン機能（`task_assignments`）
  - カスタムフィールド（JSONB による柔軟なスキーマ）
  - チーム設定に応じた動的ステータス選択
  - 親子タスク構造（`parent_id`、`is_milestone`）
  - サブタスク管理
  - 提出物管理（URL提出・編集）
  - タスクコメント機能（チャット形式）
  - 優先度・ステータス管理
  - ソフトデリート対応
  - **案件コックピットUI**（クライアント選択の自動化、サブタスク担当者の必須化）

- **通知システム**
  - ヘッダーのベルアイコンによるリアルタイム通知
  - 「自分に関係のあるタスク」のみを通知（担当割り当て、コメント、提出）
  - 未読管理と一括既読化
  - 通知クリックで該当タスクへディープリンク遷移

- **ワークフロー自動化**
  - 子タスク完了時の親タスク自動進行（全サブタスク完了 → 親タスク「確認待ち」）
  - 子タスク差し戻し時の親タスク自動復帰（サブタスク未完了 → 親タスク「進行中」）
  - ステータス自動変更時の通知送信

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
- `tasks` - タスク（`attributes` JSONB でカスタムフィールド対応、`workflow_status`, `parent_id`, `is_milestone`, `is_private` で階層構造とワークフロー管理）
- `task_assignments` - タスク担当者（複数割り当て対応）
- `guest_users` - ゲストユーザー情報
- `projects` - プロジェクト（将来の拡張用）
- `notifications` - 通知（ユーザー別、リアルタイム更新対応）
- `system_logs` - システムログ

すべてのテーブルで `deleted_at` によるソフトデリートを実装。

## Current Status (v10.0)

- [x] Authentication & Team Invite
- [x] Guest User Management
- [x] Client Management (Hub)
- [x] Client Cockpit (Tabs: Overview, Schedule, Tasks)
- [x] Credentials & Resources Management
- [x] Monthly List Schedule (Vertical Format)
- [x] Calendar Smart Stack View
- [x] Personal Dashboard Filtering
- [x] Task Detail Dialog & Edit
- [x] Dynamic Task Dialog (Team Settings Integration)
- [x] Subtask Management
- [x] Task Comments & Submission
- [x] Member Detail Console
- [x] Drag & Drop (Date Reschedule)
- [x] Weekly Kanban Board
- [x] Custom Fields (Per-Task & Team-Defined)
- [x] Web App Architecture (Persistent Layout)
- [x] Team Settings (Workflow Statuses & Custom Fields)
- [x] Notifications (Real-time, Deep Linking)
- [ ] Filter & Highlight
- [ ] Analytics Dashboard

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd SocialOps
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local.example`を`.env.local`にコピーし、必要な値を設定:

```bash
cp .env.local.example .env.local
```

以下の環境変数を設定してください:

- `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトのURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabaseの匿名キー
- `SUPABASE_SERVICE_ROLE_KEY`: Supabaseのサービスロールキー

### 4. Supabaseのセットアップ

Supabaseプロジェクトを作成し、マイグレーションを実行:

```bash
# Supabase CLIのインストール（未インストールの場合）
npm install -g supabase

# Supabaseプロジェクトにリンク
npx supabase link --project-ref <your-project-ref>

# マイグレーションの実行
npx supabase db push
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## Development

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
SocialOps/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx           # ログインページ
│   ├── (dashboard)/
│   │   ├── layout.tsx               # 共通レイアウト（Header含む）
│   │   ├── dashboard/page.tsx       # ダッシュボード（カレンダー + タスクリスト）
│   │   ├── ops/page.tsx             # 投稿管理（案件一覧カード表示）
│   │   ├── management/page.tsx      # 案件設定（案件一覧リボン + 追加）
│   │   ├── clients/
│   │   │   └── [id]/page.tsx        # クライアント詳細（案件コックピット）
│   │   └── settings/
│   │       └── team/page.tsx        # チーム設定
│   ├── access/[token]/              # ゲストアクセス
│   ├── invite/[token]/              # チーム招待
│   ├── onboarding/
│   │   └── create-team/page.tsx     # チーム作成ウィザード
│   ├── layout.tsx                   # ルートレイアウト
│   └── page.tsx                     # ランディングページ
├── components/
│   ├── dashboard/
│   │   ├── header.tsx               # ヘッダー（ナビゲーション）
│   │   ├── calendar-board.tsx       # カレンダービュー
│   │   ├── calendar-toolbar.tsx     # カレンダーツールバー
│   │   ├── team-panel.tsx           # メンバーリストサイドバー
│   │   ├── my-tasks.tsx             # 個人タスクリスト
│   │   ├── member-detail.tsx        # メンバー詳細ダイアログ
│   │   └── user-profile-dialog.tsx  # プロフィール編集ダイアログ
│   ├── clients/
│   │   ├── client-dialog.tsx        # クライアント作成・編集ダイアログ
│   │   └── monthly-list-schedule.tsx # 月次進行表
│   ├── tasks/
│   │   ├── task-dialog.tsx          # タスク作成・編集ダイアログ
│   │   ├── task-detail-dialog.tsx   # タスク詳細ダイアログ
│   │   └── task-field-editor.tsx    # カスタムフィールドエディター
│   ├── settings/
│   │   └── task-settings.tsx        # ワークフロー設定
│   ├── lp/                          # ランディングページコンポーネント
│   └── ui/                          # Shadcn UIコンポーネント
├── actions/
│   ├── auth.ts                      # 認証関連
│   ├── clients.ts                   # クライアント管理
│   ├── guest-auth.ts                # ゲスト認証
│   ├── guests.ts                    # ゲストユーザー管理
│   ├── onboarding.ts                # オンボーディング
│   ├── tasks.ts                     # タスク管理
│   ├── teams.ts                     # チーム管理
│   └── user.ts                      # ユーザープロフィール
├── lib/
│   ├── supabase/
│   │   ├── server.ts                # サーバーサイドSupabaseクライアント
│   │   └── client.ts                # クライアントサイドSupabaseクライアント
│   └── utils.ts                     # ユーティリティ関数
├── supabase/
│   └── migrations/                  # DBマイグレーションファイル
├── types/
│   └── database.types.ts            # Supabase型定義
└── middleware.ts                    # 認証・ルーティングミドルウェア
```

## License

ISC
