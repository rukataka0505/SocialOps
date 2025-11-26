import { getTasks } from "@/actions/tasks";
import { getTeamMembers } from "@/actions/teams";
import { CalendarBoard } from "@/components/dashboard/calendar-board";
import { TeamPanel } from "@/components/dashboard/team-panel";
import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, subMonths, addMonths, format } from "date-fns";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { logout } from "@/actions/auth";
import { TaskDialog } from "@/components/tasks/task-dialog";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get team_id
    const { data: teamMember } = await (supabase as any)
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id)
        .single();

    const teamId = teamMember?.team_id;
    const members = teamId ? await getTeamMembers(teamId) : [];

    // Fetch tasks for a broad range (Current Month +/- 1-2 months)
    const now = new Date();
    const start = startOfMonth(subMonths(now, 1));
    const end = endOfMonth(addMonths(now, 2));
    const tasks = await getTasks(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));

    const userName = user?.user_metadata.full_name || user?.email || 'ゲスト';

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-3 border-b bg-white shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900">
                        SocialOps
                    </h1>
                    <span className="text-sm text-gray-500">
                        {userName}さん
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <TaskDialog members={members} />
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/clients">
                            クライアント管理
                        </Link>
                    </Button>
                    <form action={logout}>
                        <Button variant="ghost" size="sm" className="text-gray-500" type="submit">
                            ログアウト
                        </Button>
                    </form>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Calendar Area */}
                <main className="flex-1 p-4 overflow-hidden bg-gray-50/50">
                    <CalendarBoard tasks={tasks} members={members} />
                </main>

                {/* Side Panel */}
                <aside className="w-72 border-l bg-white overflow-y-auto hidden md:block">
                    <TeamPanel members={members} />
                </aside>
            </div>
        </div>
    );
}
