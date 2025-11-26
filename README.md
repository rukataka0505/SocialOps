# SocialOps

## 1. Product Vision: "SocialOps"
**Concept:** "Calendar-First" Team OS for Social Media Agencies.
**Tagline:** 「スプシ地獄」と「チャット連絡」からチームを解放する、自動化されたワークスペース。

**The Problem (Before):**
- **タスク管理地獄:** スプレッドシートの行が増えすぎ、どれが最新かわからない。
- **担当者不明:** チャットで依頼が流れ、ボールが落ちる。
- **入力コスト:** 管理ツールの入力を維持するために残業している。

**The Solution (After):**
- **Zero Input:** タスクは「入力」するものではなく、ルーチンから「自動で降ってくる」もの。
- **Calendar First:** リストではなく「カレンダー」が主役。いつ・誰が・何を投稿するかを1枚の絵で支配する。
- **Spreadsheet Centric:** 複雑な分析や台割はスプシに任せ、本ツールは「最強のハブ」に徹する。

## 2. Core Philosophy (Iron Rules)
開発における意思決定の指針：
1. **Calendar is King:** 迷ったらリストよりカレンダーの見やすさを優先する。
2. **Don't Make Me Think:** ユーザーに複雑な設定をさせない。招待リンクを踏めば即参加、ルーチンを組めば即タスク生成。
3. **Flexible Data:** 項目（ジャンル・単価など）の増減に耐えうるよう、JSONBを活用してスキーマを硬直させない。

## 3. Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS, Shadcn UI
- **Timezone:** All logic based on **JST (Asia/Tokyo)** using `date-fns-tz`.

## 4. Architecture & Roadmap (v8.1)

### 📌 Phase 1: Foundation & Flexibility ✅
- **Schema Update:** `tasks.attributes` (JSONB) と `clients.spreadsheet_url` の実装。
- **Soft Delete:** 全テーブルで `deleted_at` による論理削除を徹底。

### 📌 Phase 2: Team & Identity ✅
- **Workspace:** データは `team_id` で完全に分離。
- **Invitation:** Slackライクな「招待リンク」によるメンバー追加機能。

### 📌 Phase 3: Automation & Assignment ✅
- **Client Staffing:** クライアントごとに「Aさん＝編集」のような役割定義。
- **Auto-Assign:** タスク自動生成時、上記設定に基づいて担当者(`assigned_to`)を自動解決。
- **Manual Task Creation:** ルーチン外の突発タスクを手動で追加可能。

### 📌 Phase 4: "The Matrix" Dashboard 🚧
**Core Concept:** 「いつ・誰が・何を」を1画面で支配する。

#### UI Structure (3-Pane Layout)
```
┌─────────────────────────────────────────────────────────┐
│ Header: Team Name | Period Filter | Menu               │
├──────────────────────────────────┬──────────────────────┤
│                                  │                      │
│  📅 Calendar View (Main)         │  👥 Team Workload    │
│                                  │     (Side Panel)     │
│  - Monthly/Weekly Grid           │                      │
│  - Task Cards on Dates           │  - Member List       │
│  - Drag to Change Due Date       │  - Task Count        │
│                                  │  - Drag to Assign    │
│                                  │                      │
└──────────────────────────────────┴──────────────────────┘
```

#### 1. Main Area: Calendar Board
- **Primary View:** 常に表示される主役。
- **Purpose:** 「いつ・何があるか」を俯瞰。
- **Interaction:** ドラッグ&ドロップで **締切日(Due Date)** を変更。
- **Library:** `react-big-calendar` または `FullCalendar`。

#### 2. Side Panel: Team Workload
- **Display:** 画面右側からスライドイン（PCではピン留め可）。
- **Purpose:** 「誰が・どれだけ抱えているか」を表示。
- **Structure:** メンバーごとの縦積みリスト（アコーディオン）。
- **Interaction:** ドラッグ&ドロップで **担当者(Assignee)** を変更。
- **Special Section:** 「未割り当て」タスクプール。

#### 3. User Flow: Check → Assign → Adjust
1. **Check:** カレンダーで全体の詰まり具合を確認。
2. **Assign:** サイドパネルを開き、「未割り当て」タスクを空いているメンバーにドラッグしてパス。
3. **Adjust:** 無理そうなスケジュールはカレンダー上でずらす。

#### Implementation Plan
- **Drag & Drop:** `dnd-kit` (cross-container dragging support)
- **Components:**
  - `CalendarBoard`: メインカレンダー表示
  - `TeamPanel`: 右側のメンバー別タスクリスト
  - `TaskCard`: 両方のビューで使われる共通部品
- **State Management:** Server Actions + Optimistic Updates
- **Real-time Sync:** Supabase Realtime (optional)

## 5. Current Development Status
- [x] Authentication (Login/Signup)
- [x] Dev Bypass Mode (Local Debug)
- [x] Client Management (Basic CRUD)
- [x] Routine Management (JSON Frequency)
- [x] Task Generation Engine v1
- [x] **Schema Flexibility (JSONB/Spreadsheet URL)**
- [x] Team Invitation System
- [x] Client Staffing & Role Assignment
- [x] Auto-Assign Logic
- [x] Manual Task Creation
- [ ] **"The Matrix" Dashboard UI**
  - [ ] Calendar Board Component
  - [ ] Team Workload Panel
  - [ ] Drag & Drop Integration
  - [ ] Period Filter (Week/Month)
