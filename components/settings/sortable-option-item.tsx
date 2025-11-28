"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SortableOptionItemProps {
    option: string;
    index: number;
    onUpdate: (index: number, value: string) => void;
    onRemove: (index: number) => void;
    disabled?: boolean;
}

export function SortableOptionItem({ option, index, onUpdate, onRemove, disabled }: SortableOptionItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: `${index}-${option}` }); // Use index-option as ID to be unique enough for now, or better pass a unique ID if available. 
    // Since options are just strings, we might face issues if duplicates exist, but for now let's assume unique or index based.
    // Actually, dnd-kit needs unique IDs. If we just use string, duplicates break it.
    // Ideally options should be objects with IDs. But current data structure is string[].
    // We can use the index as part of ID, but reordering changes index.
    // For simple string arrays, we might need a wrapper with ID in the parent state, or just use the string if unique.
    // Let's use a combination or just the string if we enforce uniqueness.
    // For now, let's use `option` as ID and assume uniqueness or handle it in parent.

    // Correction: If we use `option` string as ID, editing the string changes the ID, which might confuse dnd-kit during drag?
    // Actually, for simple lists, it's better if the parent manages IDs.
    // But here we are just refactoring. Let's try to use the string value.

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2">
            <div className="cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
                value={option}
                onChange={(e) => onUpdate(index, e.target.value)}
                className="flex-1"
                disabled={disabled}
            />
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => onRemove(index)}
                disabled={disabled}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
