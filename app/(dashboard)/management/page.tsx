import { getClients } from "@/actions/clients";
import { getTeamSettings } from "@/actions/teams";
import { ClientRibbonList } from "@/components/clients/client-ribbon-list";

export default async function ManagementPage() {
    const clients = await getClients();
    const settings = await getTeamSettings();

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">案件設定 (Case Settings)</h1>
            </div>

            <ClientRibbonList clients={clients} settings={settings} />
        </div>
    );
}
