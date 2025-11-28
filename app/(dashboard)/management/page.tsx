import { getClients } from "@/actions/clients";
import { ClientDialog } from "@/components/clients/client-dialog";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
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

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">案件名</TableHead>
                            <TableHead>登録日</TableHead>
                            <TableHead>メモ</TableHead>
                            <TableHead className="text-right">アクション</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    案件が見つかりません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            clients.map((client: any) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">
                                        <Link
                                            href={`/clients/${client.id}/settings`}
                                            className="hover:underline text-primary"
                                        >
                                            {client.name}
                                        </Link>
                                        {client.company && (
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                {client.company}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(client.created_at), "yyyy/MM/dd")}
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate text-muted-foreground">
                                        {client.notes || "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/clients/${client.id}/settings`}>
                                                <Settings className="mr-2 h-3 w-3" />
                                                設定
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
