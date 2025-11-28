"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Eye, EyeOff } from "lucide-react";
import { ClientDialog } from "./client-dialog";
import { Label } from "@/components/ui/label";

interface ClientSettingsViewProps {
    client: any;
    settings?: any;
}

export function ClientSettingsView({ client, settings }: ClientSettingsViewProps) {
    const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});

    const togglePasswordVisibility = (index: number) => {
        setVisiblePasswords(prev => ({ ...prev, [index]: !prev[index] }));
    };

    // Get client fields from settings or use defaults
    const clientFields = settings?.client_fields || [
        { id: 'name', label: '案件名', type: 'text', required: true, system: true },
        { id: 'email', label: 'メールアドレス', type: 'text', system: true },
        { id: 'phone', label: '電話番号', type: 'text', system: true },
        { id: 'notes', label: 'メモ', type: 'textarea', system: true },
    ];

    const credentials = client.credentials || [];
    const resources = client.resources || [];
    const attributes = client.attributes || {};

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">基本設定</h2>
                <ClientDialog client={client} settings={settings} />
            </div>

            {/* Basic Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">基本情報</CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {clientFields.map((field: any) => {
                            const value = field.system
                                ? client[field.id]
                                : attributes[field.id];

                            if (!value && !field.required) return null;

                            return (
                                <div key={field.id} className={field.type === 'textarea' ? 'col-span-2' : ''}>
                                    <dt className="text-muted-foreground mb-1">{field.label}</dt>
                                    {field.type === 'url' && value ? (
                                        <dd className="font-medium">
                                            <a
                                                href={value}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline flex items-center gap-1"
                                            >
                                                {value}
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </dd>
                                    ) : field.type === 'textarea' ? (
                                        <dd className="whitespace-pre-wrap bg-muted/30 p-3 rounded-md">{value || "-"}</dd>
                                    ) : (
                                        <dd className="font-medium">{value || "-"}</dd>
                                    )}
                                </div>
                            );
                        })}
                    </dl>
                </CardContent>
            </Card>

            {/* Credentials */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">アカウント情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {credentials.length === 0 && (
                        <p className="text-sm text-muted-foreground">登録されたアカウント情報はありません。</p>
                    )}

                    {credentials.map((cred: any, index: number) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-b pb-4 last:border-0 last:pb-0">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">サービス名</Label>
                                <div className="font-medium">{cred.service}</div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">ID / Email</Label>
                                <div className="font-mono text-sm">{cred.id}</div>
                            </div>
                            <div className="space-y-1 relative">
                                <Label className="text-xs text-muted-foreground">Password</Label>
                                <div className="flex items-center gap-2">
                                    <div className="font-mono text-sm flex-1 truncate">
                                        {visiblePasswords[index] ? cred.password : "••••••••"}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => togglePasswordVisibility(index)}
                                    >
                                        {visiblePasswords[index] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Resources */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">リソースリンク</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {resources.length === 0 && (
                        <p className="text-sm text-muted-foreground">登録されたリソースはありません。</p>
                    )}

                    {resources.map((res: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 border-b pb-2 last:border-0 last:pb-0">
                            <a href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline group w-full">
                                <span className="font-medium min-w-[100px]">{res.title}</span>
                                <span className="text-sm text-muted-foreground truncate flex-1">{res.url}</span>
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
