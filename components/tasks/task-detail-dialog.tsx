"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarIcon, User, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface TaskDetailDialogProps {
    task: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEdit: () => void;
    members: any[];
}

export function TaskDetailDialog({ task, open, onOpenChange, onEdit, members }: TaskDetailDialogProps) {
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-bold leading-tight">
                                {task.title}
                            </DialogTitle>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge className={`${statusColors[task.status] || "bg-gray-500"} hover:${statusColors[task.status]} border-0`}>
                                    {statusLabels[task.status] || task.status}
                                </Badge>
                                <Badge variant="outline" className={`${priorityColors[task.priority] || "text-slate-600"}`}>
                                    {priorityLabels[task.priority] || task.priority}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Grid Layout for Details */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Due Date */}
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground">期限</h4>
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <CalendarIcon className="h-4 w-4 text-slate-500" />
                                {task.due_date ? format(new Date(task.due_date), "yyyy年M月d日 (E)", { locale: ja }) : "-"}
                            </div>
                        </div>

                        {/* Client */}
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium text-muted-foreground">クライアント</h4>
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium">
                                    {task.client?.name || "-"}
                                </span>
                                {task.client?.spreadsheet_url && (
                                    <a
                                        href={task.client.spreadsheet_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        管理シートを開く
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Management URL */}
                        {managementUrl && (
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-muted-foreground">管理URL</h4>
                                <a
                                    href={managementUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 break-all"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    {managementUrl}
                                </a>
                            </div>
                        )}

                        {/* Custom Fields */}
                        {customFields.map((field: any) => {
                            const value = task.attributes?.[field.label];
                            if (!value) return null;
                            if (field.type === 'url') {
                                return (
                                    <div key={field.id} className="space-y-1">
                                        <h4 className="text-sm font-medium text-muted-foreground">{field.label}</h4>
                                        <a
                                            href={value}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline flex items-center gap-1 break-all"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            {value}
                                        </a>
                                    </div>
                                );
                            }
                            return (
                                <div key={field.id} className="space-y-1">
                                    <h4 className="text-sm font-medium text-muted-foreground">{field.label}</h4>
                                    <p className="text-sm whitespace-pre-wrap">{value}</p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Assignees - Full Width */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">担当者</h4>
                        <div className="flex flex-wrap gap-2">
                            {assignments.length > 0 ? (
                                assignments.map((assignment: any) => (
                                    <div key={assignment.user_id} className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={assignment.user?.avatar_url || ""} />
                                            <AvatarFallback className="text-xs">{assignment.user?.name?.[0] || "?"}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{assignment.user?.name || "不明なユーザー"}</span>
                                            {assignment.role && <span className="text-[10px] text-muted-foreground">{assignment.role}</span>}
                                        </div>
                                    </div>
                                ))
                            ) : assignee ? (
                                <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={assignee.avatar_url || ""} />
                                        <AvatarFallback className="text-xs">{assignee.name?.[0] || "?"}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{assignee.name}</span>
                                </div>
                            ) : (
                                <span className="text-sm text-slate-400 flex items-center gap-1">
                                    <User className="h-4 w-4" /> 未割り当て
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between gap-2 border-t pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        閉じる
                    </Button>
                    <Button onClick={onEdit}>
                        編集する
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
