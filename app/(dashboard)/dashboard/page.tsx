import { getTasks, getMemberTasks } from "@/actions/tasks";
import { getTeamMembers } from "@/actions/teams";
import { CalendarBoard } from "@/components/dashboard/calendar-board";
import { TeamPanel } from "@/components/dashboard/team-panel";
import { MyTasks } from "@/components/dashboard/my-tasks";
import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get team_id and role
    const { data } = await supabase
        .from("team_members")
        .select("team_id, role, team:teams(name)")
        .eq("user_id", user.id)
        .single();

    const teamMember = data as { team_id: string; role: 'owner' | 'admin' | 'member'; team: { name: string } } | null;

    const teamId = teamMember?.team_id;
    const currentUserRole = teamMember?.role;
    const teamName = teamMember?.team?.name || 'Team';
    const members = teamId ? await getTeamMembers(teamId) : [];

    // Fetch tasks for the current month (for Calendar)
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const tasks = await getTasks(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));

    // Fetch tasks for the current user (for My Tasks)
    const myTasks = await getMemberTasks(user.id);

    // Prioritize user_metadata.name (or full_name) over email
    // This fixes the issue where guests see their dummy email
    const userName = user?.user_metadata.name || user?.user_metadata.full_name || user?.email || 'ゲスト';

    return (
        <div className="flex flex-col h-full bg-slate-50">

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Column: My Tasks + Calendar */}
                <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
                    {/* Top: My Tasks */}
                    <section className="h-64 px-6 py-4 border-b border-slate-100 bg-white/50 shrink-0">
                        <MyTasks tasks={myTasks} members={members} currentUserId={user.id} />
                    </section>

                    {/* Center: Calendar */}
                    <section className="flex-1 p-6 overflow-hidden">
                        <CalendarBoard tasks={tasks} members={members} currentUserId={user.id} />
                    </section>
                </main>

                {/* Right: Team Panel */}
                <aside className="w-80 border-l border-slate-100 bg-white overflow-y-auto shadow-sm z-10">
                    <TeamPanel members={members} currentUserRole={currentUserRole} />
                </aside>
            </div>
        </div>
    );
}
