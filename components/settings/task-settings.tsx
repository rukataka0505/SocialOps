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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SYSTEM_FIELDS } from "@/lib/constants";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableFieldItem } from "./sortable-field-item";
import { SortableOptionItem } from "./sortable-option-item";

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
        reorder: (oldIndex: number, newIndex: number) => {
            setFields((items) => arrayMove(items, oldIndex, newIndex));
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

    const handleDragEnd = (event: DragEndEvent, fields: CustomFieldDefinition[], manager: ReturnType<typeof createFieldManager>) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = fields.findIndex((f) => f.id === active.id);
            const newIndex = fields.findIndex((f) => f.id === over?.id);
            manager.reorder(oldIndex, newIndex);
        }
    };

    const renderFieldEditor = (
        fields: CustomFieldDefinition[],
        manager: ReturnType<typeof createFieldManager>
    ) => {
        const sensors = useSensors(
            useSensor(PointerSensor),
            useSensor(KeyboardSensor, {
                coordinateGetter: sortableKeyboardCoordinates,
            })
        );

        return (
            <div className="space-y-6">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, fields, manager)}
                >
                    <SortableContext
                        items={fields.map(f => f.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {fields.map((field, index) => (
                            <SortableFieldItem
                                key={field.id}
                                field={field}
                                index={index}
                                onUpdate={manager.update}
                                onRemove={manager.remove}
                            >
                                {/* Options Editor */}
                                {(field.type === 'select' || field.id === 'workflow_status') && (
                                    <div className="space-y-2 pl-10">
                                        <Label>選択肢</Label>

                                        {field.id === 'workflow_status' ? (
                                            <div className="space-y-2">
                                                <div className="text-xs text-muted-foreground mb-2">
                                                    ステータスの選択肢を管理します。
                                                </div>
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={(event) => {
                                                        const { active, over } = event;
                                                        if (active.id !== over?.id) {
                                                            // For options, we are using the string value as ID in SortableOptionItem
                                                            // But here we need to find index.
                                                            // Wait, SortableOptionItem uses `${index}-${option}` as ID? No, I implemented it to use `option` string?
                                                            // Let's check SortableOptionItem implementation.
                                                            // I implemented it using `useSortable({ id: `${index}-${option}` })`.
                                                            // So the ID is `${index}-${option}`.
                                                            // This is tricky because index changes.
                                                            // Ideally we should use a unique ID for each option.
                                                            // But options are just strings.
                                                            // Let's try to use just the option string as ID if they are unique.
                                                            // If I change SortableOptionItem to use option string as ID.

                                                            // Let's assume for now I will update SortableOptionItem to use option string as ID.
                                                            // Or better, let's use the index based logic but correctly.
                                                            // Actually, dnd-kit recommends unique IDs.
                                                            // If I use index, reordering messes it up.

                                                            // Let's rely on the fact that for now options are unique strings usually.
                                                            // I will update SortableOptionItem to use `option` as ID.

                                                            const oldIndex = (field.options || []).indexOf(active.id as string);
                                                            const newIndex = (field.options || []).indexOf(over?.id as string);

                                                            if (oldIndex !== -1 && newIndex !== -1) {
                                                                const newOptions = arrayMove(field.options || [], oldIndex, newIndex);
                                                                manager.update(index, { options: newOptions });
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <SortableContext
                                                        items={field.options || []}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        {(field.options || []).map((option, optIndex) => (
                                                            <SortableOptionItem
                                                                key={option}
                                                                option={option}
                                                                index={optIndex}
                                                                onUpdate={(idx, val) => {
                                                                    const newOptions = [...(field.options || [])];
                                                                    newOptions[idx] = val;
                                                                    manager.update(index, { options: newOptions });
                                                                }}
                                                                onRemove={(idx) => {
                                                                    const newOptions = (field.options || []).filter((_, i) => i !== idx);
                                                                    manager.update(index, { options: newOptions });
                                                                }}
                                                                disabled={optIndex === 0 && field.id === 'workflow_status' ? false : false}
                                                            />
                                                        ))}
                                                    </SortableContext>
                                                </DndContext>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        const newOptions = [...(field.options || []), `ステータス ${(field.options?.length || 0) + 1}`];
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
                            </SortableFieldItem>
                        ))}
                    </SortableContext>
                </DndContext>
                <Button variant="outline" size="sm" onClick={manager.add}>
                    <Plus className="mr-2 h-4 w-4" />
                    項目を追加
                </Button>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>タスク入力項目設定</CardTitle>
                    <CardDescription>
                        タスク作成時に入力する項目を定義します。ドラッグ＆ドロップで並べ替えが可能です。
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
