import { getClients } from "@/actions/clients";
import { ClientDialog } from "@/components/clients/client-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Settings } from "lucide-react";

export default async function ManagementPage() {
    const clients = await getClients();

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">案件設定 (Case Settings)</h1>
                <ClientDialog />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clients.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                        案件が見つかりません。
                    </div>
                ) : (
                    clients.map((client: any) => (
                        <Link key={client.id} href={`/clients/${client.id}/settings`} className="block transition-transform hover:scale-[1.02]">
                            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-lg font-medium">
                                        {client.name}
                                    </CardTitle>
                                    <Settings className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    {client.company && (
                                        <p className="text-sm text-muted-foreground mb-2">{client.company}</p>
                                    )}
                                    <div className="text-xs text-muted-foreground">
                                        <div>ID: {client.id.slice(0, 8)}...</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
