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
import { Loader2, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Client = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    notes: string | null;
    spreadsheet_url: string | null;
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
    onOpenChange: controlledOnOpenChange
}: ClientDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? controlledOnOpenChange : setInternalOpen;

    // Ensure setOpen is defined if controlledOnOpenChange is undefined (though types suggest it should be passed if open is passed)
    // But for safety in JS/loose usage:
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

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        クライアント追加
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{client ? "クライアント編集" : "新規クライアント登録"}</DialogTitle>
                    <DialogDescription>
                        {client
                            ? "以下のクライアント情報を更新してください。"
                            : "新規クライアントの情報を入力してください。"}
                    </DialogDescription>
                </DialogHeader>

                <form action={formAction} className="grid gap-4 py-4">
                    {state.error && (
                        <Alert variant="destructive">
                            <AlertDescription>{state.error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            名前 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={client?.name}
                            className="col-span-3"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">
                            メールアドレス
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={client?.email || ""}
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                            電話番号
                        </Label>
                        <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            defaultValue={client?.phone || ""}
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="spreadsheet_url" className="text-right">
                            管理シートURL
                        </Label>
                        <Input
                            id="spreadsheet_url"
                            name="spreadsheet_url"
                            type="url"
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            defaultValue={client?.spreadsheet_url || ""}
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="notes" className="text-right">
                            メモ
                        </Label>
                        <Textarea
                            id="notes"
                            name="notes"
                            defaultValue={client?.notes || ""}
                            className="col-span-3"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {client ? "変更を保存" : "クライアントを作成"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
