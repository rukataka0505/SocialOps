import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getTeamMembers, getTeamSettings } from "@/actions/teams";
import { MonthlyListSchedule } from "@/components/clients/monthly-list-schedule";
import { notFound } from "next/navigation";
import { getClient } from "@/actions/clients";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
    const { id } = await params;
    const client = await getClient(id);

    if (!client) {
        notFound();
    }

    const teamMembers = await getTeamMembers(client.team_id);
    const settings = await getTeamSettings();

    return (
        <div className="space-y-6">
            <MonthlyListSchedule
                clientId={client.id}
                members={teamMembers}
                settings={settings}
            />
        </div>
    );
}

