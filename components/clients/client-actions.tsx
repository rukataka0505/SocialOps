"use client";

import { useState, useTransition } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash, Loader2 } from "lucide-react";
import { ClientDialog } from "./client-dialog";
import { deleteClient } from "@/actions/clients";

type Client = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    notes: string | null;
};

interface ClientActionsProps {
    client: Client;
}

export function ClientActions({ client }: ClientActionsProps) {
    const [isPending, startTransition] = useTransition();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this client?")) {
            startTransition(async () => {
                await deleteClient(client.id);
            });
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={(e) => {
                        e.preventDefault();
                        setIsDialogOpen(true);
                    }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={handleDelete}
                        disabled={isPending}
                        className="text-red-600 focus:text-red-600"
                    >
                        {isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Trash className="mr-2 h-4 w-4" />
                        )}
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Controlled Dialog for Edit */}
            {isDialogOpen && (
                <ClientDialog
                    client={client}
                    trigger={<span className="hidden" />} // Hidden trigger as we control open state via parent? 
                // Actually ClientDialog controls its own state internally.
                // We need to refactor ClientDialog to accept open/onOpenChange if we want to control it from outside
                // OR we can just render it and let it be.
                // But wait, ClientDialog uses a Trigger.
                // If I want to open it from DropdownMenuItem, I should probably put the DialogTrigger inside the MenuItem?
                // No, nesting DialogTrigger in DropdownMenuItem can be tricky with closing behavior.
                // Best practice: State control.
                />
            )}
        </>
    );
}
