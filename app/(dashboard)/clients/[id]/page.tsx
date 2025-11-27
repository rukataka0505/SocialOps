import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getRoutines } from "@/actions/routines";
import { getTeamMembers, getTeamSettings } from "@/actions/teams";
import { RoutineList } from "@/components/routines/routine-list";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientOverview } from "@/components/clients/client-overview";
import { MonthlyListSchedule } from "@/components/clients/monthly-list-schedule";
import { getTasks } from "@/actions/tasks"; // We might need a specific getClientTasks action or reuse getTasks with client filter?
// Actually, getTasks filters by date range. We want ALL tasks for this client or a list view.
// Let's reuse the existing TaskList component if available, or just list them.
// The requirement says "Tab 3: All Tasks (List) - Existing task list component".
// I'll assume there is a TaskList component or I'll build a simple one.
// Looking at previous files, I haven't seen a generic TaskList component, but `app/(dashboard)/page.tsx` renders tasks.
// Let's create a simple ClientTaskList component inline or reuse logic.
// For now, I'll fetch tasks for a wide range or just use the MonthlySchedule for the main view and maybe a simple list for "All".
// Wait, `getTasks` takes start/end.
// I'll implement a simple list for Tab 3.

interface PageProps {
    params: Promise<{ id: string }>;
}

async function getClient(id: string) {
    const supabase = await createSupabaseClient();
    const { data: client, error } = await (supabase as any)
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !client) return null;
    return client;
}

async function getClientTasks(clientId: string) {
    const supabase = await createSupabaseClient();
    const { data: tasks } = await (supabase as any)
        .from("tasks")
        .select(`
            *,
            assignments:task_assignments(
                user_id,
                role,
                user:users(
                    id,
                    name,
                    avatar_url
                )
            )
        `)
        .eq("client_id", clientId)
        .is("deleted_at", null)
        .order("due_date", { ascending: false })
        .limit(50); // Limit for performance
    return tasks || [];
}

export default async function ClientDetailPage({ params }: PageProps) {
    const { id } = await params;
    const client = await getClient(id);

    if (!client) {
        notFound();
    }

    const routines = await getRoutines(id);
    const teamMembers = await getTeamMembers(client.team_id);
    const settings = await getTeamSettings();
    const allTasks = await getClientTasks(id);

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/clients">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{client.name}</h2>
                    <p className="text-muted-foreground">
                        {client.company ? `${client.company} - ` : ""}
                        案件コックピット
                    </p>
                </div>
                {client.spreadsheet_url && (
                    <Button className="ml-auto bg-green-600 hover:bg-green-700 text-white" asChild>
                        <a href={client.spreadsheet_url} target="_blank" rel="noopener noreferrer">
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            管理シート
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                )}
            </div>

            <Tabs defaultValue="schedule" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="overview">概要</TabsTrigger>
                    <TabsTrigger value="schedule">進行表</TabsTrigger>
                    <TabsTrigger value="tasks">全タスク</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                    <ClientOverview client={client} />
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">ルーチン設定</h3>
                        <RoutineList clientId={client.id} routines={routines} staffMembers={teamMembers} />
                    </div>
                </TabsContent>

                <TabsContent value="schedule" className="mt-6">
                    <MonthlyListSchedule
                        clientId={client.id}
                        members={teamMembers}
                        settings={settings}
                    />
                </TabsContent>

                <TabsContent value="tasks" className="mt-6">
                    <div className="bg-white rounded-lg border shadow-sm">
                        <div className="p-4 border-b">
                            <h3 className="font-semibold">タスク一覧 (最新50件)</h3>
                        </div>
                        <div className="divide-y">
                            {allTasks.map((task: any) => (
                                <div key={task.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div>
                                        <div className="font-medium">{task.title}</div>
                                        <div className="text-sm text-muted-foreground">
                                            期限: {task.due_date} / ステータス: {task.status}
                                        </div>
                                    </div>
                                    {/* Link to task detail or dialog? For now just static */}
                                </div>
                            ))}
                            {allTasks.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground">
                                    タスクはありません
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
