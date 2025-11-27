"use client";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, User, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface TaskTooltipProps {
    task: any;
}

export function TaskTooltip({ task }: TaskTooltipProps) {
    if (!task) return null;

    const statusColors: Record<string, string> = {
        in_progress: "bg-blue-500",
        pending: "bg-amber-500",
        completed: "bg-slate-400",
        cancelled: "bg-slate-300",
    };

    const statusLabels: Record<string, string> = {
        in_progress: "進行中",
        pending: "確認待ち",
        completed: "完了",
        cancelled: "キャンセル",
    };

    const priorityLabels: Record<string, string> = {
        urgent: "緊急",
        high: "高",
        medium: "中",
        low: "低",
    };

    const priorityColors: Record<string, string> = {
        urgent: "text-red-600 bg-red-50 border-red-200",
        high: "text-orange-600 bg-orange-50 border-orange-200",
        medium: "text-blue-600 bg-blue-50 border-blue-200",
        low: "text-slate-600 bg-slate-50 border-slate-200",
    };

    const assignments = task.assignments || [];
    const assignee = task.assignee; // Backward compatibility

    const customFields = task.attributes?._fields || [];
    const managementUrl = task.attributes?.management_url;

    return (
        <div className="w-[300px] space-y-3 p-1">
            <div className="space-y-1">
                <h4 className="text-sm font-bold leading-tight line-clamp-2">
                    {task.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${statusColors[task.status] || "bg-gray-500"} border-0 text-[10px] px-1.5 py-0`}>
                        {statusLabels[task.status] || task.status}
                    </Badge>
                    <Badge variant="outline" className={`${priorityColors[task.priority] || "text-slate-600"} text-[10px] px-1.5 py-0`}>
                        {priorityLabels[task.priority] || task.priority}
                    </Badge>
                </div>
            </div>

            <div className="grid gap-2">
                {/* Due Date */}
                <div className="flex items-center gap-2 text-xs">
                    <CalendarIcon className="h-3 w-3 text-slate-500" />
                    <span className="font-medium">
                        {task.due_date ? format(new Date(task.due_date), "yyyy年M月d日 (E)", { locale: ja }) : "-"}
                    </span>
                </div>

                {/* Client */}
                <div className="space-y-0.5">
                    <h5 className="text-[10px] font-medium text-muted-foreground">クライアント</h5>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-medium">
                            {task.client?.name || "-"}
                        </span>
                    </div>
                </div>

                {/* Custom Fields */}
                {customFields.map((field: any) => {
                    const value = task.attributes?.[field.label];
                    if (!value) return null;

                    if (field.type === 'url') {
                        return (
                            <div key={field.id} className="space-y-0.5">
                                <h5 className="text-[10px] font-medium text-muted-foreground">{field.label}</h5>
                                <div className="flex items-center gap-1 text-xs text-blue-600">
                                    <ExternalLink className="h-2.5 w-2.5" />
                                    <span className="truncate max-w-[200px]">{value}</span>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={field.id} className="space-y-0.5">
                            <h5 className="text-[10px] font-medium text-muted-foreground">{field.label}</h5>
                            <p className="text-xs line-clamp-2">{value}</p>
                        </div>
                    );
                })}

                {/* Assignees */}
                <div className="space-y-1">
                    <h5 className="text-[10px] font-medium text-muted-foreground">担当者</h5>
                    <div className="flex flex-wrap gap-1">
                        {assignments.length > 0 ? (
                            assignments.map((assignment: any) => (
                                <div key={assignment.user_id} className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                    <Avatar className="h-4 w-4">
                                        <AvatarImage src={assignment.user?.avatar_url || ""} />
                                        <AvatarFallback className="text-[8px]">{assignment.user?.name?.[0] || "?"}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs">{assignment.user?.name || "不明"}</span>
                                </div>
                            ))
                        ) : assignee ? (
                            <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                <Avatar className="h-4 w-4">
                                    <AvatarImage src={assignee.avatar_url || ""} />
                                    <AvatarFallback className="text-[8px]">{assignee.name?.[0] || "?"}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs">{assignee.name}</span>
                            </div>
                        ) : (
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                <User className="h-3 w-3" /> 未割り当て
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
