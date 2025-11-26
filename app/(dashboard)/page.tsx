import { getTodayTasks } from "@/actions/tasks";
import { TaskItem } from "@/components/tasks/task-item";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export default async function DashboardPage() {
    const tasks = await getTodayTasks();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userName = "User";
    if (user) {
        // Try to get name from profile, fallback to email username
        const { data: profile } = await (supabase as any).from("users").select("name").eq("id", user.id).single();
        if (profile?.name) {
            userName = profile.name;
        } else if (user.email) {
            userName = user.email.split('@')[0];
        }
    }

    // Date for header (JST)
    const timeZone = 'Asia/Tokyo';
    const now = new Date();
    const zonedNow = toZonedTime(now, timeZone);
    const dateStr = format(zonedNow, 'MMM d, EEEE');

    return (
        <div className="max-w-3xl mx-auto py-10 px-4">
            {/* Header */}
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Good Morning, {userName}</h1>
                <p className="text-gray-500 mt-2 text-lg font-medium">{dateStr}</p>
            </header>

            {/* Task List */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                        Today's Tasks
                        <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">
                            {tasks.length}
                        </span>
                    </h2>
                </div>

                {tasks.length > 0 ? (
                    <div className="space-y-3">
                        {tasks.map((task: any) => (
                            <TaskItem key={task.id} task={task} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
                        <div className="text-5xl mb-4">🎉</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">All tasks completed!</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            You have no pending tasks for today. Enjoy your day or check back later!
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}
