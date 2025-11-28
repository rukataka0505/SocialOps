import { createClient } from '@/lib/supabase/server';
import { ClientSettingsView } from '@/components/clients/client-settings-view';
import { getTeamSettings } from "@/actions/teams";

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

    const settings = await getTeamSettings();

    return (
        <div className="mx-auto max-w-4xl space-y-8 pb-10">
            {/* 基本情報・契約情報・Credentials */}
            <section>
                <ClientSettingsView client={client} settings={settings} />
            </section>
        </div>
    );
}
