"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateTeamSettings } from "@/actions/teams";
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";

interface TaskSettingsProps {
    initialSettings: {
        workflow_statuses?: string[];
        custom_field_definitions?: CustomFieldDefinition[];
    };
}

interface CustomFieldDefinition {
    id: string;
    label: string;
    type: 'text' | 'url' | 'date' | 'select';
    options?: string[]; // For select type
}

export function TaskSettings({ initialSettings }: TaskSettingsProps) {
    const [statuses, setStatuses] = useState<string[]>(
        initialSettings.workflow_statuses || ['未着手', '進行中', '確認待ち', '完了']
    );
    const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>(
        initialSettings.custom_field_definitions || []
    );
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Status Management
    const addStatus = () => {
        setStatuses([...statuses, "新しいステータス"]);
    };

    const updateStatus = (index: number, value: string) => {
        const newStatuses = [...statuses];
        newStatuses[index] = value;
        setStatuses(newStatuses);
    };

    const removeStatus = (index: number) => {
        setStatuses(statuses.filter((_, i) => i !== index));
    };

    const moveStatus = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === statuses.length - 1) return;

        const newStatuses = [...statuses];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newStatuses[index], newStatuses[targetIndex]] = [newStatuses[targetIndex], newStatuses[index]];
        setStatuses(newStatuses);
    };

    // Custom Field Management
    const addCustomField = () => {
        const newField: CustomFieldDefinition = {
            id: crypto.randomUUID(),
            label: "新しい項目",
            type: "text",
        };
        setCustomFields([...customFields, newField]);
    };

    const updateCustomField = (index: number, field: Partial<CustomFieldDefinition>) => {
        const newFields = [...customFields];
        newFields[index] = { ...newFields[index], ...field };
        setCustomFields(newFields);
    };

    const removeCustomField = (index: number) => {
        setCustomFields(customFields.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        startTransition(async () => {
            const settings = {
                ...initialSettings,
                workflow_statuses: statuses,
                custom_field_definitions: customFields,
            };
            await updateTeamSettings(settings);
            router.refresh();
        });
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>ワークフローステータス</CardTitle>
                    <CardDescription>
                        タスクの進捗状況を表すステータスを管理します。上から順に表示されます。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {statuses.map((status, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className="flex flex-col gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => moveStatus(index, 'up')}
                                    disabled={index === 0}
                                >
                                    ▲
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => moveStatus(index, 'down')}
                                    disabled={index === statuses.length - 1}
                                >
                                    ▼
                                </Button>
                            </div>
                            <Input
                                value={status}
                                onChange={(e) => updateStatus(index, e.target.value)}
                                className="flex-1"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeStatus(index)}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addStatus}>
                        <Plus className="mr-2 h-4 w-4" />
                        ステータスを追加
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>カスタム入力項目</CardTitle>
                    <CardDescription>
                        タスクに追加情報を入力するためのカスタムフィールドを定義します。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {customFields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-lg space-y-4 bg-slate-50/50">
                            <div className="flex items-start justify-between gap-4">
                                <div className="grid grid-cols-2 gap-4 flex-1">
                                    <div className="space-y-2">
                                        <Label>項目名</Label>
                                        <Input
                                            value={field.label}
                                            onChange={(e) => updateCustomField(index, { label: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>データ型</Label>
                                        <Select
                                            value={field.type}
                                            onValueChange={(value: any) => updateCustomField(index, { type: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="text">テキスト</SelectItem>
                                                <SelectItem value="url">URL</SelectItem>
                                                <SelectItem value="date">日付</SelectItem>
                                                <SelectItem value="select">選択肢</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeCustomField(index)}
                                    className="text-muted-foreground hover:text-destructive mt-8"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            {field.type === 'select' && (
                                <div className="space-y-2">
                                    <Label>選択肢 (カンマ区切り)</Label>
                                    <Input
                                        value={field.options?.join(', ') || ''}
                                        onChange={(e) => updateCustomField(index, {
                                            options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                        })}
                                        placeholder="例: Twitter, Instagram, TikTok"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addCustomField}>
                        <Plus className="mr-2 h-4 w-4" />
                        項目を追加
                    </Button>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isPending} size="lg">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    設定を保存
                </Button>
            </div>
        </div>
    );
}
