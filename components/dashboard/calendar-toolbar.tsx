"use client";

import { ToolbarProps } from "react-big-calendar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CalendarToolbar(props: ToolbarProps) {
    const { date, onNavigate, onView, view, label } = props;

    const goToBack = () => {
        onNavigate("PREV");
    };

    const goToNext = () => {
        onNavigate("NEXT");
    };

    const goToToday = () => {
        onNavigate("TODAY");
    };

    const handleViewChange = (value: string) => {
        onView(value as any);
    };

    // Custom label formatting based on view
    const getLabel = () => {
        if (view === 'month') {
            return format(date, "yyyy年 M月", { locale: ja });
        }
        if (view === 'week') {
            return label; // Default week label is usually fine, or customize if needed
        }
        if (view === 'day') {
            return format(date, "yyyy年 M月 d日 (E)", { locale: ja });
        }
        return label;
    };

    return (
        <div className="relative flex items-center justify-center mb-4 px-2">
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToToday}>
                    今日
                </Button>
                <div className="flex items-center bg-slate-50 rounded-md border border-slate-200 p-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToBack}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-bold px-3 min-w-[120px] text-center">
                        {getLabel()}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNext}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="absolute right-2 flex items-center gap-2">
                <Select value={view} onValueChange={handleViewChange}>
                    <SelectTrigger className="h-8 w-[100px]">
                        <SelectValue placeholder="表示切替" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="month">月</SelectItem>
                        <SelectItem value="week">週</SelectItem>
                        <SelectItem value="day">日</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
