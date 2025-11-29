"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ClientDialog } from "@/components/clients/client-dialog";
import { Database } from "@/types/database.types";

type Client = Database['public']['Tables']['clients']['Row'];

interface ClientRibbonListProps {
    clients: Client[];
    settings: any;
}

export function ClientRibbonList({ clients, settings }: ClientRibbonListProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Filter clients based on search query
    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.notes && client.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleClientClick = (client: Client) => {
        setSelectedClient(client);
        setIsDialogOpen(true);
    };

    const handleCreateClick = () => {
        setSelectedClient(null);
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="案件を検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button onClick={handleCreateClick}>
                    <Plus className="mr-2 h-4 w-4" />
                    案件を追加
                </Button>
            </div>

            <div className="grid gap-4">
                {filteredClients.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-muted/10">
                        <p className="text-muted-foreground">案件が見つかりません</p>
                    </div>
                ) : (
                    filteredClients.map((client) => (
                        <div
                            key={client.id}
                            onClick={() => handleClientClick(client)}
                            className="group relative flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 cursor-pointer"
                        >
                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-lg truncate">{client.name}</h3>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        登録日: {client.created_at ? format(new Date(client.created_at), "yyyy/MM/dd") : "-"}
                                    </span>
                                </div>

                                {client.notes && (
                                    <p className="text-sm text-muted-foreground truncate max-w-[80%]">
                                        {client.notes}
                                    </p>
                                )}

                                {/* Display some attributes as badges if available */}
                                {client.attributes && Object.keys(client.attributes).length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {Object.entries(client.attributes)
                                            .filter(([key]) => key !== '_fields')
                                            .slice(0, 3)
                                            .map(([key, value]) => {
                                                // Find label from settings if possible
                                                const field = settings?.client_fields?.find((f: any) => f.id === key);
                                                const label = field?.label || key;
                                                if (!value) return null;
                                                return (
                                                    <Badge key={key} variant="secondary" className="text-xs font-normal">
                                                        {label}: {String(value)}
                                                    </Badge>
                                                );
                                            })}
                                        {Object.keys(client.attributes).length > 3 && (
                                            <Badge variant="outline" className="text-xs font-normal">
                                                +{Object.keys(client.attributes).length - 3}
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity px-2 text-primary text-sm font-medium">
                                編集
                            </div>
                        </div>
                    ))
                )}
            </div>

            <ClientDialog
                client={selectedClient ? {
                    ...selectedClient,
                    attributes: (selectedClient.attributes || {}) as Record<string, any>,
                    credentials: ((selectedClient.attributes as any)?.credentials || []) as any[],
                    resources: ((selectedClient.attributes as any)?.resources || []) as any[]
                } : undefined}
                open={isDialogOpen}
                onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) setSelectedClient(null);
                }}
                trigger={<span className="hidden" />}
                settings={settings}
            />
        </div>
    );
}
