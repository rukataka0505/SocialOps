"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface OptionInputProps {
    value?: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function OptionInput({ value = [], onChange, placeholder, disabled, className }: OptionInputProps) {
    const [text, setText] = useState(value.join(", "));

    // Sync local state when external value changes (e.g. initial load or reset)
    // We need to be careful not to overwrite user input while typing if value updates from parent
    // But here value is controlled by parent which updates only on blur usually.
    // However, if we want to support external updates, we can use useEffect.
    // To avoid cursor jumping or overwriting, we only update if the parsed value is different
    // or if we are not focused?
    // For simplicity in this specific use case (settings), we can just sync on mount or when value changes meaningfully.
    useEffect(() => {
        setText(value.join(", "));
    }, [value]);

    const handleBlur = () => {
        const newOptions = text.split(",").map(s => s.trim()).filter(Boolean);
        // Only trigger change if different to avoid unnecessary updates
        if (JSON.stringify(newOptions) !== JSON.stringify(value)) {
            onChange(newOptions);
        }
    };

    return (
        <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={className}
        />
    );
}
