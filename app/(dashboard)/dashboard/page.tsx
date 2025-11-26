import { getTasks } from "@/actions/tasks";
import { getTeamMembers } from "@/actions/teams";
import { CalendarBoard } from "@/components/dashboard/calendar-board";
import { TeamPanel } from "@/components/dashboard/team-panel";
import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { logout } from "@/actions/auth";
import { TaskDialog } from "@/components/tasks/task-dialog";

import { UserProfileDialog } from "@/components/dashboard/user-profile-dialog";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get team_id and role
    const { data } = await supabase
        .from("team_members")
        .select("team_id, role")
        .eq("user_id", user.id)
        .single();

    const teamMember = data as { team_id: string; role: 'owner' | 'admin' | 'member' } | null;

    const teamId = teamMember?.team_id;
    const currentUserRole = teamMember?.role;
    const members = teamId ? await getTeamMembers(teamId) : [];

    // Fetch tasks for the current month
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const tasks = await getTasks(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));

    // Prioritize user_metadata.name (or full_name) over email
    // This fixes the issue where guests see their dummy email
    const userName = user?.user_metadata.name || user?.user_metadata.full_name || user?.email || 'ゲスト';

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Header */}
            <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-6">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        SocialOps
                    </h1>
                    <div className="h-6 w-px bg-slate-200" />
                    <UserProfileDialog initialName={userName}>
                        <span className="text-sm font-medium text-slate-600 hover:text-blue-600 cursor-pointer flex items-center gap-2 transition-colors" title="プロフィールを編集">
                            {userName}
                            <span className="text-xs text-slate-400">▼</span>
                        </span>
                    </UserProfileDialog>
                </div>
                <div className="flex items-center gap-3">
                    <TaskDialog members={members} />
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600 hover:bg-blue-50" asChild>
                        <Link href="/settings/team">
                            チーム設定
                        </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600 hover:bg-blue-50" asChild>
                        <Link href="/clients">
                            クライアント
                        </Link>
                    </Button>
                    <form action={logout}>
                        <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 hover:bg-red-50" type="submit">
                            ログアウト
                        </Button>
                    </form>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Calendar Area */}
                <main className="flex-1 p-6 overflow-hidden">
                    <CalendarBoard tasks={tasks} members={members} currentUserId={user.id} />
                </main>

                {/* Side Panel */}
                <aside className="w-80 border-l border-slate-100 bg-white overflow-y-auto shadow-sm z-10">
                    <TeamPanel members={members} currentUserRole={currentUserRole} />
                </aside>
            </div>
        </div>
    );
}
