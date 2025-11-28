import { getClients } from "@/actions/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function OpsPage() {
    const clients = await getClients();

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">投稿管理 (Post Management)</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {clients.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                        案件が見つかりません。
                    </div>
                ) : (
                    clients.map((client: any) => (
                        <Link key={client.id} href={`/clients/${client.id}`} className="block transition-transform hover:scale-[1.02]">
                            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                                <CardHeader>
                                    <CardTitle className="text-lg">{client.name}</CardTitle>
                                    {client.company && (
                                        <p className="text-sm text-muted-foreground">{client.company}</p>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {client.notes || "メモなし"}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
