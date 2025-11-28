import { createClient } from '@/lib/supabase/server';
import { MonthlyListSchedule } from '@/components/clients/monthly-list-schedule';
import { getTeamMembers, getTeamSettings } from "@/actions/teams";

export default async function ClientOpsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    // 必要なデータのみ取得（投稿管理に特化）
    const { data: client } = await (supabase as any)
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

    if (!client) return null;

    // Fetch additional data required by MonthlyListSchedule
    const teamMembers = await getTeamMembers(client.team_id);
    const settings = await getTeamSettings();

    return (
        <div className="space-y-6">
            {/* 進行表カレンダーをメインに配置 */}
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                <div className="p-6">
                    <MonthlyListSchedule
                        clientId={id}
                        members={teamMembers}
                        settings={settings}
                    />
                </div>
            </div>
        </div>
    );
}
