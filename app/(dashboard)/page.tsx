import { getTodayTasks } from "@/actions/tasks";
import { TaskItem } from "@/components/tasks/task-item";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { ja } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { logout } from "@/actions/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const tasks = await getTodayTasks();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const userName = user?.user_metadata.full_name || user?.email || 'ゲスト';

    // Date for header (JST)
    const timeZone = 'Asia/Tokyo';
    const now = new Date();
    const zonedNow = toZonedTime(now, timeZone);
    // Japanese date format: 11月27日 (水)
    const dateStr = format(zonedNow, 'M月d日 (E)', { locale: ja });

    // Stats
    const totalTasks = tasks.length;

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            {/* Header */}
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        おはようございます、<span className="text-indigo-600">{userName}</span>さん
                    </h1>
                    <p className="text-gray-500 mt-3 text-lg font-medium flex items-center gap-2">
                        <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                            📅 {dateStr}
                        </span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-10 px-5" asChild>
                        <Link href="/clients">
                            クライアント管理
                        </Link>
                    </Button>
                    <form action={logout}>
                        <Button variant="ghost" className="h-10 px-5 text-gray-500 hover:text-gray-900" type="submit">
                            ログアウト
                        </Button>
                    </form>
                </div>
            </header>

            {/* Task List */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        今日のタスク
                        <span className="bg-indigo-100 text-indigo-700 text-sm font-bold px-3 py-1 rounded-full">
                            残り {totalTasks} 件
                        </span>
                    </h2>
                </div>

                {tasks.length > 0 ? (
                    <div className="space-y-4">
                        {tasks.map((task: any) => (
                            <TaskItem key={task.id} task={task} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-gradient-to-b from-white to-indigo-50/30 rounded-[2rem] border border-dashed border-indigo-100 shadow-sm">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600 rounded-full mb-6 animate-bounce">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">今日のタスクはすべて完了です！</h3>
                        <p className="text-gray-500 max-w-md mx-auto text-lg leading-relaxed">
                            素晴らしい進捗です🎉<br />
                            ゆっくり休むか、明日の準備をしましょう。
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}
