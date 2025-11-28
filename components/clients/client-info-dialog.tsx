"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, ExternalLink, Info } from "lucide-react";
import { toast } from "sonner";

interface ClientInfoDialogProps {
    client: any; // Using any for flexibility with DB types
    settings?: any;
    trigger?: React.ReactNode;
}

export function ClientInfoDialog({ client, settings, trigger }: ClientInfoDialogProps) {
    const attributes = client.attributes || {};
    const credentials = client.credentials || [];
    const resources = client.resources || [];

    // Get client fields from settings or use defaults
    const clientFields = settings?.client_fields || [
        { id: 'name', label: '案件名', type: 'text', required: true, system: true },
        { id: 'email', label: 'メールアドレス', type: 'text', system: true },
        { id: 'phone', label: '電話番号', type: 'text', system: true },
        { id: 'spreadsheet_url', label: '管理シートURL', type: 'url', system: true },
        { id: 'notes', label: 'メモ', type: 'textarea', system: true },
    ];

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label}をコピーしました`);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" title="案件情報">
                        <Info className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>案件情報: {client.name}</DialogTitle>
                    <DialogDescription>
                        案件の詳細情報とリンク集です。
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Custom Fields & System Fields */}
                    <div className="space-y-4">
                        <h3 className="font-semibold border-b pb-2">基本情報</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {clientFields.map((field: any) => {
                                const value = field.system
                                    ? client[field.id]
                                    : attributes[field.id];

                                if (!value) return null;

                                return (
                                    <div key={field.id} className="space-y-1">
                                        <div className="text-sm text-muted-foreground">{field.label}</div>
                                        {field.type === 'url' ? (
                                            <a
                                                href={value}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-primary hover:underline flex items-center gap-1"
                                            >
                                                {field.label || "(タイトルなし)"}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        ) : (
                                            <div className="font-medium break-all whitespace-pre-wrap p-2 bg-muted/50 rounded-md text-sm">
                                                {value}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Resources */}
                    {resources.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold border-b pb-2">リソースリンク</h3>
                            <div className="grid gap-2">
                                {resources.map((res: any, index: number) => (
                                    <a
                                        key={index}
                                        href={res.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-primary hover:underline flex items-center gap-1 p-2 rounded-md hover:bg-muted/50 transition-colors"
                                    >
                                        {res.title || "(タイトルなし)"}
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Credentials */}
                    {credentials.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold border-b pb-2">ログイン情報</h3>
                            <div className="grid gap-3">
                                {credentials.map((cred: any, index: number) => (
                                    <div key={index} className="p-3 border rounded-md bg-slate-50 dark:bg-slate-900">
                                        <div className="font-medium mb-2">{cred.service || "サービス名なし"}</div>
                                        <div className="grid grid-cols-[auto,1fr,auto] gap-2 items-center text-sm">
                                            <span className="text-muted-foreground">ID:</span>
                                            <code className="bg-background px-2 py-1 rounded border">{cred.id || "-"}</code>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(cred.id || "", "ID")}>
                                                <Copy className="h-3 w-3" />
                                            </Button>

                                            <span className="text-muted-foreground">PW:</span>
                                            <code className="bg-background px-2 py-1 rounded border">••••••••</code>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(cred.password || "", "パスワード")}>
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
