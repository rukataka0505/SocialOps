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
import { Loader2, Plus, Pencil, Eye, EyeOff, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Client = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    notes: string | null;
    attributes: Record<string, any>;
    credentials: any[];
    resources: any[];
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
    const [credentials, setCredentials] = useState<any[]>(client?.credentials as any[] || []);
    const [resources, setResources] = useState<any[]>(client?.resources as any[] || []);
    const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? controlledOnOpenChange : setInternalOpen;

    const handleOpenChange = (newOpen: boolean) => {
        setOpen?.(newOpen);
        if (newOpen) {
            // Reset state when opening
            setCredentials(client?.credentials as any[] || []);
            setResources(client?.resources as any[] || []);
        }
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
        { id: 'notes', label: 'メモ', type: 'textarea', system: true },
    ];

    // Credential Helpers
    const addCredential = () => setCredentials([...credentials, { service: "", id: "", password: "" }]);
    const updateCredential = (index: number, field: string, value: string) => {
        const newCreds = [...credentials];
        newCreds[index] = { ...newCreds[index], [field]: value };
        setCredentials(newCreds);
    };
    const removeCredential = (index: number) => setCredentials(credentials.filter((_, i) => i !== index));
    const togglePasswordVisibility = (index: number) => {
        setVisiblePasswords(prev => ({ ...prev, [index]: !prev[index] }));
    };

    // Resource Helpers
    const addResource = () => setResources([...resources, { title: "", url: "" }]);
    const updateResource = (index: number, field: string, value: string) => {
        const newRes = [...resources];
        newRes[index] = { ...newRes[index], [field]: value };
        setResources(newRes);
    };
    const removeResource = (index: number) => setResources(resources.filter((_, i) => i !== index));

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
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{client ? "案件編集" : "新規案件登録"}</DialogTitle>
                    <DialogDescription>
                        {client
                            ? "以下の案件情報を更新してください。"
                            : "新規案件の情報を入力してください。"}
                    </DialogDescription>
                </DialogHeader>

                <form action={formAction} className="space-y-6 py-4">
                    {state.error && (
                        <Alert variant="destructive">
                            <AlertDescription>{state.error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Hidden inputs */}
                    <input type="hidden" name="_fields" value={JSON.stringify(clientFields)} />
                    <input type="hidden" name="credentials" value={JSON.stringify(credentials)} />
                    <input type="hidden" name="resources" value={JSON.stringify(resources)} />

                    {/* Basic Info Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">基本情報</h3>
                        <div className="grid gap-4">
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
                        </div>
                    </div>

                    {/* Credentials Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-sm font-medium text-muted-foreground">アカウント情報</h3>
                            <Button type="button" variant="ghost" size="sm" onClick={addCredential}>
                                <Plus className="h-4 w-4 mr-1" /> 追加
                            </Button>
                        </div>

                        {credentials.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-2">アカウント情報は登録されていません</p>
                        )}

                        <div className="space-y-3">
                            {credentials.map((cred, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-start bg-muted/30 p-3 rounded-md">
                                    <div className="col-span-4 space-y-1">
                                        <Input
                                            value={cred.service}
                                            onChange={(e) => updateCredential(index, 'service', e.target.value)}
                                            placeholder="サービス名"
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="col-span-4 space-y-1">
                                        <Input
                                            value={cred.id}
                                            onChange={(e) => updateCredential(index, 'id', e.target.value)}
                                            placeholder="ID / Email"
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="col-span-3 space-y-1 relative">
                                        <div className="relative">
                                            <Input
                                                type={visiblePasswords[index] ? "text" : "password"}
                                                value={cred.password}
                                                onChange={(e) => updateCredential(index, 'password', e.target.value)}
                                                placeholder="Password"
                                                className="h-8 text-xs pr-8"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => togglePasswordVisibility(index)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {visiblePasswords[index] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeCredential(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resources Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-sm font-medium text-muted-foreground">リソースリンク</h3>
                            <Button type="button" variant="ghost" size="sm" onClick={addResource}>
                                <Plus className="h-4 w-4 mr-1" /> 追加
                            </Button>
                        </div>

                        {resources.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-2">リソースは登録されていません</p>
                        )}

                        <div className="space-y-3">
                            {resources.map((res, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-start bg-muted/30 p-3 rounded-md">
                                    <div className="col-span-4">
                                        <Input
                                            value={res.title}
                                            onChange={(e) => updateResource(index, 'title', e.target.value)}
                                            placeholder="タイトル"
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="col-span-7">
                                        <Input
                                            value={res.url}
                                            onChange={(e) => updateResource(index, 'url', e.target.value)}
                                            placeholder="URL"
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => removeResource(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t">
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
