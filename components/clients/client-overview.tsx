"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Plus, Trash2, Save, Loader2, ExternalLink } from "lucide-react";
import { updateClient } from "@/actions/clients";
import { useRouter } from "next/navigation";

interface ClientOverviewProps {
    client: any;
}

export function ClientOverview({ client }: ClientOverviewProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [credentials, setCredentials] = useState<any[]>(client.credentials || []);
    const [resources, setResources] = useState<any[]>(client.resources || []);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Visibility states for passwords
    const [visiblePasswords, setVisiblePasswords] = useState<Record<number, boolean>>({});

    const togglePasswordVisibility = (index: number) => {
        setVisiblePasswords(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const handleSave = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("name", client.name); // Required
            formData.append("credentials", JSON.stringify(credentials));
            formData.append("resources", JSON.stringify(resources));

            await updateClient(client.id, null, formData);
            setIsEditing(false);
            router.refresh();
        });
    };

    // Credential Helpers
    const addCredential = () => setCredentials([...credentials, { service: "", id: "", password: "" }]);
    const updateCredential = (index: number, field: string, value: string) => {
        const newCreds = [...credentials];
        newCreds[index] = { ...newCreds[index], [field]: value };
        setCredentials(newCreds);
    };
    const removeCredential = (index: number) => setCredentials(credentials.filter((_, i) => i !== index));

    // Resource Helpers
    const addResource = () => setResources([...resources, { title: "", url: "" }]);
    const updateResource = (index: number, field: string, value: string) => {
        const newRes = [...resources];
        newRes[index] = { ...newRes[index], [field]: value };
        setResources(newRes);
    };
    const removeResource = (index: number) => setResources(resources.filter((_, i) => i !== index));

    return (
        <div className="space-y-6">
            {/* Basic Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">基本情報</CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <dt className="text-muted-foreground">メールアドレス</dt>
                            <dd className="font-medium">{client.email || "-"}</dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground">電話番号</dt>
                            <dd className="font-medium">{client.phone || "-"}</dd>
                        </div>
                        <div className="col-span-2">
                            <dt className="text-muted-foreground">メモ</dt>
                            <dd className="whitespace-pre-wrap bg-gray-50 p-2 rounded mt-1">{client.notes || "-"}</dd>
                        </div>
                    </dl>
                </CardContent>
            </Card>

            {/* Credentials */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">アカウント情報</CardTitle>
                    {!isEditing && (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            編集
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-4">
                    {credentials.length === 0 && !isEditing && (
                        <p className="text-sm text-muted-foreground">登録されたアカウント情報はありません。</p>
                    )}

                    {credentials.map((cred, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end border-b pb-4 last:border-0">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">サービス名</Label>
                                {isEditing ? (
                                    <Input
                                        value={cred.service}
                                        onChange={(e) => updateCredential(index, 'service', e.target.value)}
                                        placeholder="例: Instagram"
                                    />
                                ) : (
                                    <div className="font-medium">{cred.service}</div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">ID / Email</Label>
                                {isEditing ? (
                                    <Input
                                        value={cred.id}
                                        onChange={(e) => updateCredential(index, 'id', e.target.value)}
                                    />
                                ) : (
                                    <div className="font-mono text-sm">{cred.id}</div>
                                )}
                            </div>
                            <div className="space-y-1 relative">
                                <Label className="text-xs text-muted-foreground">Password</Label>
                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <Input
                                            type={visiblePasswords[index] ? "text" : "password"}
                                            value={cred.password}
                                            onChange={(e) => updateCredential(index, 'password', e.target.value)}
                                        />
                                    ) : (
                                        <div className="font-mono text-sm flex-1 truncate">
                                            {visiblePasswords[index] ? cred.password : "••••••••"}
                                        </div>
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => togglePasswordVisibility(index)}
                                    >
                                        {visiblePasswords[index] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                    {isEditing && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive"
                                            onClick={() => removeCredential(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isEditing && (
                        <Button variant="outline" size="sm" onClick={addCredential} className="w-full">
                            <Plus className="mr-2 h-4 w-4" /> アカウントを追加
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Resources */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">リソースリンク</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {resources.length === 0 && !isEditing && (
                        <p className="text-sm text-muted-foreground">登録されたリソースはありません。</p>
                    )}

                    {resources.map((res, index) => (
                        <div key={index} className="flex items-center gap-4 border-b pb-2 last:border-0">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                                {isEditing ? (
                                    <>
                                        <Input
                                            value={res.title}
                                            onChange={(e) => updateResource(index, 'title', e.target.value)}
                                            placeholder="タイトル (例: ロゴデータ)"
                                        />
                                        <Input
                                            value={res.url}
                                            onChange={(e) => updateResource(index, 'url', e.target.value)}
                                            placeholder="URL"
                                        />
                                    </>
                                ) : (
                                    <a href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline group col-span-2">
                                        <span className="font-medium">{res.title}</span>
                                        <span className="text-sm text-muted-foreground truncate max-w-[300px]">{res.url}</span>
                                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                )}
                            </div>
                            {isEditing && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => removeResource(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    ))}

                    {isEditing && (
                        <Button variant="outline" size="sm" onClick={addResource} className="w-full">
                            <Plus className="mr-2 h-4 w-4" /> リソースを追加
                        </Button>
                    )}
                </CardContent>
            </Card>

            {isEditing && (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isPending}>キャンセル</Button>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        保存
                    </Button>
                </div>
            )}
        </div>
    );
}
