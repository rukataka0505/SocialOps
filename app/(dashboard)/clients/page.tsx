/* eslint-disable @typescript-eslint/no-explicit-any */
import { getClients } from "@/actions/clients";
import { ClientDialog } from "@/components/clients/client-dialog";
import { ClientActions } from "@/components/clients/client-actions";
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

export default async function ClientsPage() {
    const clients = await getClients();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Clients</h2>
                    <p className="text-muted-foreground">
                        Manage your clients and their contact information.
                    </p>
                </div>
                <ClientDialog />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Memo</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No clients found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            clients.map((client: any) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/clients/${client.id}`} className="hover:underline">
                                            {client.name}
                                        </Link>
                                        {client.company && (
                                            <div className="text-xs text-muted-foreground">
                                                {client.company}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            {client.email && <span>{client.email}</span>}
                                            {client.phone && (
                                                <span className="text-muted-foreground">{client.phone}</span>
                                            )}
                                            {!client.email && !client.phone && "-"}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate">
                                        {client.notes || "-"}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(client.created_at), "yyyy/MM/dd")}
                                    </TableCell>
                                    <TableCell>
                                        <ClientActions client={client} />
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
