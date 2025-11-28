"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient, updateClient, ClientState } from "@/actions/clients";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Client = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    notes: string | null;
    spreadsheet_url: string | null;
    attributes: Record<string, any>;
};

interface ClientDialogProps {
    client?: Client;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const initialState: ClientState = {};

export function ClientDialog({
    client,
    trigger,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    settings
}: ClientDialogProps & { settings?: any }) {
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? controlledOnOpenChange : setInternalOpen;

    const handleOpenChange = (newOpen: boolean) => {
        setOpen?.(newOpen);
    };

    // Determine which action to use
    const actionFn = client
        ? updateClient.bind(null, client.id)
        : createClient;

    const [state, formAction, isPending] = useActionState(actionFn, initialState);

    // Close dialog on success
    useEffect(() => {
        if (state.success) {
            setOpen?.(false);
        }
    }, [state.success, setOpen]);

    // Parse attributes if editing
    const attributes = client?.attributes as Record<string, any> || {};

    // Get client fields from settings or use defaults
    const clientFields = settings?.client_fields || [
        { id: 'name', label: '案件名', type: 'text', required: true, system: true },
        { id: 'email', label: 'メールアドレス', type: 'text', system: true },
        { id: 'phone', label: '電話番号', type: 'text', system: true },
        { id: 'spreadsheet_url', label: '管理シートURL', type: 'url', system: true },
        { id: 'notes', label: 'メモ', type: 'textarea', system: true },
    ];

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant={client ? "ghost" : "default"} size={client ? "sm" : "default"}>
                        {client ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                        {client ? "編集" : "案件追加"}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{client ? "案件編集" : "新規案件登録"}</DialogTitle>
                    <DialogDescription>
                        {client
                            ? "以下の案件情報を更新してください。"
                            : "新規案件の情報を入力してください。"}
                    </DialogDescription>
                </DialogHeader>

                <form action={formAction} className="grid gap-4 py-4">
                    {state.error && (
                        <Alert variant="destructive">
                            <AlertDescription>{state.error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Hidden input for field definitions snapshot */}
                    <input type="hidden" name="_fields" value={JSON.stringify(clientFields)} />

                    {clientFields.map((field: any) => {
                        const value = field.system
                            ? (client as any)?.[field.id]
                            : attributes[field.id];

                        return (
                            <div key={field.id} className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor={field.id} className="text-right">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </Label>
                                {field.type === 'textarea' ? (
                                    <Textarea
                                        id={field.id}
                                        name={field.id}
                                        defaultValue={value || ""}
                                        className="col-span-3"
                                        required={field.required}
                                    />
                                ) : field.type === 'select' ? (
                                    <div className="col-span-3">
                                        <select
                                            id={field.id}
                                            name={field.id}
                                            defaultValue={value || ""}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            required={field.required}
                                        >
                                            <option value="">選択してください</option>
                                            {field.options?.map((opt: string) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <Input
                                        id={field.id}
                                        name={field.id}
                                        type={field.type === 'url' ? 'url' : field.type === 'number' ? 'number' : 'text'}
                                        defaultValue={value || ""}
                                        className="col-span-3"
                                        required={field.required}
                                    />
                                )}
                            </div>
                        );
                    })}

                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {client ? "変更を保存" : "案件を作成"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
