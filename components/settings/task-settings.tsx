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
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // Helper to merge system fields with custom fields
    const initializeFields = (
        customFields: CustomFieldDefinition[] | undefined,
        filterFn: (field: any) => boolean = () => true
    ) => {
        const systemFields = SYSTEM_FIELDS.filter(filterFn).map(sf => {
            // If it's the status field, populate options from initialSettings
            if (sf.id === 'workflow_status') {
                return {
                    ...sf,
                    options: initialSettings.workflow_statuses || ['未着手', '進行中', '確認待ち', '完了']
                };
            }
            return sf;
        });

        // If no custom fields, just return system fields
        if (!customFields || customFields.length === 0) {
            return systemFields as CustomFieldDefinition[];
        }

        // Merge logic:
        // 1. Start with system fields
        // 2. If a system field exists in customFields (by ID), use the custom definition (for label/options updates) but keep system flag
        // 3. Add remaining custom fields

        const merged = [...systemFields] as CustomFieldDefinition[];

        // Update system fields with saved values (e.g. label changes, status options)
        merged.forEach((sf, index) => {
            const saved = customFields.find(f => f.id === sf.id);
            if (saved) {
                merged[index] = { ...sf, ...saved, system: true, type: sf.type }; // Ensure type/system flag is preserved
            }
        });

        // Add non-system custom fields
        const nonSystem = customFields.filter(f => !SYSTEM_FIELDS.some(sf => sf.id === f.id));
        return [...merged, ...nonSystem];
    };

    const [regularFields, setRegularFields] = useState<CustomFieldDefinition[]>(
        initializeFields(
            initialSettings.regular_task_fields || initialSettings.custom_field_definitions
        )
    );

    const [postFields, setPostFields] = useState<CustomFieldDefinition[]>(
        initializeFields(
            initialSettings.post_task_fields || initialSettings.custom_field_definitions,
            (f) => f.id !== 'assigned_to' // Exclude assigned_to for post tasks by default
        )
    );

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
            if (!window.confirm("この項目を削除しますか？\n※入力済みのデータも失われる可能性があります。")) return;
            setFields(fields.filter((_, i) => i !== index));
        },
        move: (index: number, direction: 'up' | 'down') => {
            if (direction === 'up' && index === 0) return;
            if (direction === 'down' && index === fields.length - 1) return;
            const newFields = [...fields];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
            setFields(newFields);
        }
    });

    const regularManager = createFieldManager(regularFields, setRegularFields);
    const postManager = createFieldManager(postFields, setPostFields);

    const handleSave = () => {
        if (!window.confirm("設定を保存してよろしいですか？")) return;

        startTransition(async () => {
            // Extract workflow statuses from the regular task 'workflow_status' field
            // We assume regular task settings are the source of truth for team-wide statuses for now,
            // or we could check both. Let's use regularFields.
            const statusField = regularFields.find(f => f.id === 'workflow_status');
            const statuses = statusField?.options || ['未着手', '進行中', '確認待ち', '完了'];

            const settings = {
                ...initialSettings,
                workflow_statuses: statuses,
                regular_task_fields: regularFields,
                post_task_fields: postFields,
                custom_field_definitions: regularFields, // Legacy sync
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
                        <div className="flex flex-col gap-1 mt-8">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground"
                                onClick={() => manager.move(index, 'up')}
                                disabled={index === 0}
                            >
                                ▲
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground"
                                onClick={() => manager.move(index, 'down')}
                                disabled={index === fields.length - 1}
                            >
                                ▼
                            </Button>
                        </div>

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
                            disabled={field.required} // System required fields cannot be deleted
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex items-center space-x-2 pl-10">
                        <Checkbox
                            id={`required-${field.id}`}
                            checked={field.required}
                            onCheckedChange={(checked) => manager.update(index, { required: !!checked })}
                            disabled={field.system} // System fields required status is fixed
                        />
                        <Label htmlFor={`required-${field.id}`} className="text-sm font-normal text-muted-foreground">
                            必須項目（タスク作成後に削除不可）
                        </Label>
                    </div>

                    {/* Options Editor */}
                    {(field.type === 'select' || field.id === 'workflow_status') && (
                        <div className="space-y-2 pl-10">
                            <Label>選択肢</Label>

                            {field.id === 'workflow_status' ? (
                                <div className="space-y-2">
                                    <div className="text-xs text-muted-foreground mb-2">
                                        ステータスの選択肢を管理します。
                                    </div>
                                    {(field.options || []).map((option, optIndex) => (
                                        <div key={optIndex} className="flex items-center gap-2">
                                            <Input
                                                value={option}
                                                onChange={(e) => {
                                                    const newOptions = [...(field.options || [])];
                                                    newOptions[optIndex] = e.target.value;
                                                    manager.update(index, { options: newOptions });
                                                }}
                                                className="flex-1"
                                            />
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => {
                                                        if (optIndex === 0) return;
                                                        const newOptions = [...(field.options || [])];
                                                        [newOptions[optIndex], newOptions[optIndex - 1]] = [newOptions[optIndex - 1], newOptions[optIndex]];
                                                        manager.update(index, { options: newOptions });
                                                    }}
                                                    disabled={optIndex === 0}
                                                >
                                                    ▲
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => {
                                                        if (optIndex === (field.options?.length || 0) - 1) return;
                                                        const newOptions = [...(field.options || [])];
                                                        [newOptions[optIndex], newOptions[optIndex + 1]] = [newOptions[optIndex + 1], newOptions[optIndex]];
                                                        manager.update(index, { options: newOptions });
                                                    }}
                                                    disabled={optIndex === (field.options?.length || 0) - 1}
                                                >
                                                    ▼
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive"
                                                    onClick={() => {
                                                        const newOptions = (field.options || []).filter((_, i) => i !== optIndex);
                                                        manager.update(index, { options: newOptions });
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const newOptions = [...(field.options || []), "新しいステータス"];
                                            manager.update(index, { options: newOptions });
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> 追加
                                    </Button>
                                </div>
                            ) : field.id === 'client_id' ? (
                                <div className="p-2 bg-slate-100 rounded text-sm text-muted-foreground">
                                    (自動取得) 案件A, 案件B... ※案件マスタから自動的に取得されます
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Input
                                        value={field.options?.join(', ') || ''}
                                        onChange={(e) => manager.update(index, {
                                            options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                        })}
                                        placeholder="例: Twitter, Instagram, TikTok"
                                        disabled={field.system}
                                    />
                                    <p className="text-xs text-muted-foreground">カンマ区切りで入力してください</p>
                                </div>
                            )}
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
                    <CardTitle>タスク入力項目設定</CardTitle>
                    <CardDescription>
                        タスク作成時に入力する項目を定義します。システム標準の項目は削除できませんが、ラベルの変更や並べ替えが可能です。
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
                                通常のタスク（ToDoなど）で使用される入力項目です。
                            </div>
                            {renderFieldEditor(regularFields, regularManager)}
                        </TabsContent>
                        <TabsContent value="post">
                            <div className="mb-4 text-sm text-muted-foreground">
                                投稿タスク（案件タスク）で使用される入力項目です。
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
