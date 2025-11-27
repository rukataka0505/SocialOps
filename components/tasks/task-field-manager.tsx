"use client";

import { useState, useTransition } from "react";
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
import { Settings, Plus, Trash2, Save } from "lucide-react";
import { updateTeamSettings } from "@/actions/teams";
import { useRouter } from "next/navigation";

export type TaskField = {
    id: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'url';
    options?: string[]; // For select type, comma separated string in UI
};

interface TaskFieldManagerProps {
    initialFields: TaskField[];
}

export function TaskFieldManager({ initialFields }: TaskFieldManagerProps) {
    const [open, setOpen] = useState(false);
    const [fields, setFields] = useState<TaskField[]>(initialFields || []);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const addField = () => {
        const newField: TaskField = {
            id: crypto.randomUUID(),
            label: "新しい項目",
            type: "text",
        };
        setFields([...fields, newField]);
    };

    const removeField = (id: string) => {
        setFields(fields.filter((f) => f.id !== id));
    };

    const updateField = (id: string, updates: Partial<TaskField>) => {
        setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    };

    const handleSave = () => {
        startTransition(async () => {
            await updateTeamSettings({ task_fields: fields });
            setOpen(false);
            router.refresh();
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    項目設定
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>タスク項目のカスタマイズ</DialogTitle>
                    <DialogDescription>
                        タスク追加フォームに表示する項目をカスタマイズします。
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                    {fields.map((field) => (
                        <div key={field.id} className="flex items-start gap-3 p-3 border rounded-md bg-muted/20">
                            <div className="grid gap-2 flex-1">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-xs">項目名</Label>
                                        <Input
                                            value={field.label}
                                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                                            placeholder="項目名"
                                            className="h-8"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">タイプ</Label>
                                        <select
                                            value={field.type}
                                            onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                                            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="text">テキスト</option>
                                            <option value="number">数値</option>
                                            <option value="date">日付</option>
                                            <option value="select">選択肢</option>
                                            <option value="url">URL</option>
                                        </select>
                                    </div>
                                </div>
                                {field.type === "select" && (
                                    <div>
                                        <Label className="text-xs">選択肢 (カンマ区切り)</Label>
                                        <Input
                                            value={field.options?.join(",") || ""}
                                            onChange={(e) =>
                                                updateField(field.id, {
                                                    options: e.target.value.split(",").map((s) => s.trim()),
                                                })
                                            }
                                            placeholder="例: オプションA, オプションB"
                                            className="h-8"
                                        />
                                    </div>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="mt-6 text-destructive hover:text-destructive/90"
                                onClick={() => removeField(field.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}

                    <Button variant="outline" className="w-full border-dashed" onClick={addField}>
                        <Plus className="mr-2 h-4 w-4" />
                        項目を追加
                    </Button>
                </div>

                <DialogFooter>
                    <Button onClick={handleSave} disabled={isPending}>
                        {isPending && <span className="mr-2 animate-spin">⏳</span>}
                        保存
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
