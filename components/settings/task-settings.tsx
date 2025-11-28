"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { updateTeamSettings } from "@/actions/teams";
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { SYSTEM_FIELDS } from "@/lib/constants";

interface TaskSettingsProps {
    initialSettings: {
        workflow_statuses?: string[];
        custom_field_definitions?: CustomFieldDefinition[]; // Legacy support
        regular_task_fields?: CustomFieldDefinition[];
        post_task_fields?: CustomFieldDefinition[];
    };
}

interface CustomFieldDefinition {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'url' | 'date' | 'select' | 'user';
    options?: string[]; // For select type
    required?: boolean; // New: Cannot be deleted if true
    system?: boolean; // New: System field flag
}

export function TaskSettings({ initialSettings }: TaskSettingsProps) {
    const [statuses, setStatuses] = useState<string[]>(
        initialSettings.workflow_statuses || ['未着手', '進行中', '確認待ち', '完了']
    );

    // Initialize fields: Use new keys if available, otherwise fallback to legacy or empty
    // If empty, use SYSTEM_FIELDS
    const [regularFields, setRegularFields] = useState<CustomFieldDefinition[]>(
        (initialSettings.regular_task_fields && initialSettings.regular_task_fields.length > 0)
            ? initialSettings.regular_task_fields
            : (initialSettings.custom_field_definitions && initialSettings.custom_field_definitions.length > 0)
                ? [...SYSTEM_FIELDS, ...initialSettings.custom_field_definitions] as CustomFieldDefinition[]
                : [...SYSTEM_FIELDS] as CustomFieldDefinition[]
    );

    const [postFields, setPostFields] = useState<CustomFieldDefinition[]>(
        (initialSettings.post_task_fields && initialSettings.post_task_fields.length > 0)
            ? initialSettings.post_task_fields
            : (initialSettings.custom_field_definitions && initialSettings.custom_field_definitions.length > 0)
                ? [...SYSTEM_FIELDS.filter(f => f.id !== 'assigned_to'), ...initialSettings.custom_field_definitions] as CustomFieldDefinition[]
                : [...SYSTEM_FIELDS.filter(f => f.id !== 'assigned_to')] as CustomFieldDefinition[]
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

    // Custom Field Management Helper
    const createFieldManager = (
        fields: CustomFieldDefinition[],
        setFields: React.Dispatch<React.SetStateAction<CustomFieldDefinition[]>>
    ) => ({
        add: () => {
            const newField: CustomFieldDefinition = {
                id: crypto.randomUUID(),
                label: "新しい項目",
                type: "text",
                required: false,
            };
            setFields([...fields, newField]);
        },
        update: (index: number, field: Partial<CustomFieldDefinition>) => {
            const newFields = [...fields];
            newFields[index] = { ...newFields[index], ...field };
            setFields(newFields);
        },
        remove: (index: number) => {
            setFields(fields.filter((_, i) => i !== index));
        }
    });

    const regularManager = createFieldManager(regularFields, setRegularFields);
    const postManager = createFieldManager(postFields, setPostFields);

    const handleSave = () => {
        startTransition(async () => {
            const settings = {
                ...initialSettings,
                workflow_statuses: statuses,
                regular_task_fields: regularFields,
                post_task_fields: postFields,
                // Keep legacy field updated with regular fields as fallback/sync if needed, 
                // or just leave it as is. For now, let's sync it to regularFields to be safe for older clients.
                custom_field_definitions: regularFields,
            };
            await updateTeamSettings(settings);
            router.refresh();
        });
    };

    const renderFieldEditor = (
        fields: CustomFieldDefinition[],
        manager: ReturnType<typeof createFieldManager>
    ) => (
        <div className="space-y-6">
            {fields.map((field, index) => (
                <div key={field.id} className={`p-4 border rounded-lg space-y-4 ${field.system ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50/50'}`}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                            <div className="space-y-2">
                                <Label>項目名</Label>
                                <Input
                                    value={field.label}
                                    onChange={(e) => manager.update(index, { label: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>データ型</Label>
                                <Select
                                    value={field.type}
                                    onValueChange={(value: any) => manager.update(index, { type: value })}
                                    disabled={field.system}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">テキスト</SelectItem>
                                        <SelectItem value="textarea">テキストエリア</SelectItem>
                                        <SelectItem value="url">URL</SelectItem>
                                        <SelectItem value="date">日付</SelectItem>
                                        <SelectItem value="select">選択肢</SelectItem>
                                        {field.system && <SelectItem value="user">ユーザー選択</SelectItem>}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => manager.remove(index)}
                            className="text-muted-foreground hover:text-destructive mt-8"
                            disabled={field.required}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id={`required-${field.id}`}
                            checked={field.required}
                            onCheckedChange={(checked) => manager.update(index, { required: !!checked })}
                            disabled={field.system} // System fields required status is fixed for now, or at least some are
                        />
                        <Label htmlFor={`required-${field.id}`} className="text-sm font-normal text-muted-foreground">
                            必須項目（タスク作成後に削除不可）
                        </Label>
                    </div>

                    {field.type === 'select' && (
                        <div className="space-y-2">
                            <Label>選択肢 (カンマ区切り)</Label>
                            <Input
                                value={field.options?.join(', ') || ''}
                                onChange={(e) => manager.update(index, {
                                    options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                })}
                                placeholder="例: Twitter, Instagram, TikTok"
                                disabled={field.system}
                            />
                        </div>
                    )}
                </div>
            ))}
            <Button variant="outline" size="sm" onClick={manager.add}>
                <Plus className="mr-2 h-4 w-4" />
                項目を追加
            </Button>
        </div>
    );

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
                <CardContent>
                    <Tabs defaultValue="regular" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="regular">通常タスク (Regular)</TabsTrigger>
                            <TabsTrigger value="post">投稿タスク (Post)</TabsTrigger>
                        </TabsList>
                        <TabsContent value="regular">
                            <div className="mb-4 text-sm text-muted-foreground">
                                通常のタスク（ToDoなど）で使用されるデフォルトの入力項目です。
                            </div>
                            {renderFieldEditor(regularFields, regularManager)}
                        </TabsContent>
                        <TabsContent value="post">
                            <div className="mb-4 text-sm text-muted-foreground">
                                投稿タスク（案件タスク）で使用されるデフォルトの入力項目です。
                            </div>
                            {renderFieldEditor(postFields, postManager)}
                        </TabsContent>
                    </Tabs>
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
