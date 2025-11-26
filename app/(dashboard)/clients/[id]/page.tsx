import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { getRoutines } from "@/actions/routines";
import { getStaff } from "@/actions/staffing";
import { getTeamMembers } from "@/actions/teams";
import { RoutineList } from "@/components/routines/routine-list";
import { StaffSection } from "@/components/clients/staff-section";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

async function getClient(id: string) {
    const supabase = await createSupabaseClient();
    const { data: client, error } = await (supabase as any)
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !client) return null;
    return client;
}

export default async function ClientDetailPage({ params }: PageProps) {
    const { id } = await params;
    const client = await getClient(id);

    if (!client) {
        notFound();
    }

    const routines = await getRoutines(id);
    const staff = await getStaff(id);
    const teamMembers = await getTeamMembers(client.team_id);

    return (
        <div className="space-y-6">
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
                        クライアント詳細 & ルーチン設定
                    </p>
                </div>
                {client.spreadsheet_url && (
                    <Button className="ml-auto bg-green-600 hover:bg-green-700 text-white" asChild>
                        <a href={client.spreadsheet_url} target="_blank" rel="noopener noreferrer">
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            管理シートを開く
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <div className="rounded-md border p-4">
                        <h3 className="font-medium mb-2">基本情報</h3>
                        <dl className="space-y-2 text-sm">
                            <div className="grid grid-cols-3">
                                <dt className="text-muted-foreground">メールアドレス:</dt>
                                <dd className="col-span-2">{client.email || "-"}</dd>
                            </div>
                            <div className="grid grid-cols-3">
                                <dt className="text-muted-foreground">電話番号:</dt>
                                <dd className="col-span-2">{client.phone || "-"}</dd>
                            </div>
                            <div className="grid grid-cols-3">
                                <dt className="text-muted-foreground">メモ:</dt>
                                <dd className="col-span-2 whitespace-pre-wrap">{client.notes || "-"}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                <div>
                    <StaffSection clientId={client.id} staff={staff} teamMembers={teamMembers} />
                </div>
            </div>

            <div className="border-t pt-6">
                <RoutineList clientId={client.id} routines={routines} staffMembers={staff} />
            </div>
        </div>
    );
}
