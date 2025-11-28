import { getClient } from "@/actions/clients";
import { getRoutines } from "@/actions/routines";
import { getTeamMembers } from "@/actions/teams";
import { ClientOverview } from "@/components/clients/client-overview";
import { RoutineList } from "@/components/routines/routine-list";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ClientSettingsPage({ params }: PageProps) {
    const { id } = await params;
    const client = await getClient(id);

    if (!client) {
        notFound();
    }

    const routines = await getRoutines(id);
    const teamMembers = await getTeamMembers(client.team_id);

    return (
        <div className="space-y-6">
            <ClientOverview client={client} />
            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">ルーチン設定</h3>
                <RoutineList clientId={client.id} routines={routines} staffMembers={teamMembers} />
            </div>
        </div>
    );
}
