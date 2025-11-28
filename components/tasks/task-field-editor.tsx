"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Trash2, Settings2 } from "lucide-react";

// TaskField type definition (moved from task-field-manager.tsx)
export interface TaskField {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'url';
    options?: string[];
    required?: boolean;
}

interface TaskFieldEditorProps {
    field?: TaskField;
    onSave: (field: TaskField) => void;
    onDelete?: (id: string) => void;
    trigger?: React.ReactNode;
}

export function TaskFieldEditor({ field, onSave, onDelete, trigger }: TaskFieldEditorProps) {
    const [open, setOpen] = useState(false);
    const [label, setLabel] = useState(field?.label || "");
    const [type, setType] = useState<TaskField['type']>(field?.type || "text");
    const [options, setOptions] = useState(field?.options?.join(", ") || "");

    const handleSave = () => {
        if (!label) return;

        const newField: TaskField = {
            id: field?.id || crypto.randomUUID(),
            label,
            type,
            options: type === 'select' ? options.split(",").map(s => s.trim()).filter(Boolean) : undefined,
            required: field?.required // Preserve required flag
        };

        onSave(newField);
        setOpen(false);
        if (!field) {
            // Reset if adding new
            setLabel("");
            setType("text");
            setOptions("");
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Settings2 className="h-3 w-3" />
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">{field ? "項目を編集" : "項目を追加"}</h4>
                        <p className="text-sm text-muted-foreground">
                            タスク項目の設定を行います。
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="label">項目名</Label>
                            <Input
                                id="label"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                className="col-span-2 h-8"
                            />
                        </div>
                        <div className="grid grid-cols-3 items-center gap-4">
                            <Label htmlFor="type">タイプ</Label>
                            <select
                                id="type"
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                                className="col-span-2 flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="text">テキスト</option>
                                <option value="textarea">テキストエリア</option>
                                <option value="number">数値</option>
                                <option value="date">日付</option>
                                <option value="select">選択肢</option>
                                <option value="url">URL</option>
                            </select>
                        </div>
                        {type === "select" && (
                            <div className="grid grid-cols-3 items-center gap-4">
                                <Label htmlFor="options">選択肢</Label>
                                <Input
                                    id="options"
                                    value={options}
                                    onChange={(e) => setOptions(e.target.value)}
                                    placeholder="A, B, C"
                                    className="col-span-2 h-8"
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between">
                        {field && onDelete ? (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                    onDelete(field.id);
                                    setOpen(false);
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        ) : <div></div>}
                        <Button size="sm" onClick={handleSave}>保存</Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
