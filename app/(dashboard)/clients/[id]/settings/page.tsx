import { createClient } from '@/lib/supabase/server';
import { ClientOverview } from '@/components/clients/client-overview';
import { RoutineList } from '@/components/routines/routine-list';
import { getRoutines } from "@/actions/routines";
import { getTeamMembers, getTeamSettings } from "@/actions/teams";

export default async function ClientSettingsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: client } = await (supabase as any)
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

    if (!client) return null;

    // Fetch additional data required by RoutineList
    const routines = await getRoutines(id);
    const teamMembers = await getTeamMembers(client.team_id);
    const settings = await getTeamSettings();

    return (
        <div className="mx-auto max-w-4xl space-y-8 pb-10">
            {/* 基本情報・契約情報・Credentials */}
            <section>
                <h2 className="mb-4 text-lg font-semibold">基本設定</h2>
                <ClientOverview client={client} settings={settings} />
            </section>

            {/* ルーチン設定 */}
            <section>
                <h2 className="mb-4 text-lg font-semibold">自動作成ルーチン</h2>
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <RoutineList
                        clientId={id}
                        routines={routines}
                        staffMembers={teamMembers}
                    />
                </div>
            </section>
        </div>
    );
}
