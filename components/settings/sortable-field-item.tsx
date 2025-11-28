"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface CustomFieldDefinition {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'url' | 'date' | 'select' | 'user';
    options?: string[];
    required?: boolean;
    system?: boolean;
}

interface SortableFieldItemProps {
    field: CustomFieldDefinition;
    index: number;
    onUpdate: (index: number, field: Partial<CustomFieldDefinition>) => void;
    onRemove: (index: number) => void;
    children?: React.ReactNode; // For nested option editor
}

export function SortableFieldItem({ field, index, onUpdate, onRemove, children }: SortableFieldItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className={`p-4 border rounded-lg space-y-4 ${field.system ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50/50'}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1 mt-8 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
                    <GripVertical className="h-6 w-6 text-muted-foreground" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    <div className="space-y-2">
                        <Label>項目名</Label>
                        <Input
                            value={field.label}
                            onChange={(e) => onUpdate(index, { label: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>データ型</Label>
                        <Select
                            value={field.type}
                            onValueChange={(value: any) => onUpdate(index, { type: value })}
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
                    onClick={() => onRemove(index)}
                    className="text-muted-foreground hover:text-destructive mt-8"
                    disabled={field.required}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex items-center space-x-2 pl-10">
                <Checkbox
                    id={`required-${field.id}`}
                    checked={field.required}
                    onCheckedChange={(checked) => onUpdate(index, { required: !!checked })}
                    disabled={field.system}
                />
                <Label htmlFor={`required-${field.id}`} className="text-sm font-normal text-muted-foreground">
                    必須項目（タスク作成後に削除不可）
                </Label>
            </div>

            {children}
        </div>
    );
}
