import { getClient } from "@/actions/clients";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientTabs } from "@/components/clients/client-tabs";

interface LayoutProps {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}

export default async function ClientLayout({ children, params }: LayoutProps) {
    const { id } = await params;
    const client = await getClient(id);

    if (!client) {
        notFound();
    }

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

            <ClientTabs clientId={client.id} />

            <div className="mt-6">
                {children}
            </div>
        </div>
    );
}
