"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash2 } from "lucide-react";

interface TaskHeaderProps {
    title?: string;
    status?: string;
    isPrivate: boolean;
    isMilestone: boolean;
    isEditMode: boolean;
    subtasks: any[];
    workflowStatuses: string[];
    onScopeChange: (scope: 'team' | 'private') => void;
    onDelete: () => void;
    isPending: boolean;
}

export function TaskHeader({
    title,
    status,
    isPrivate,
    isMilestone,
    isEditMode,
    subtasks,
    workflowStatuses,
    onScopeChange,
    onDelete,
    isPending
}: TaskHeaderProps) {
    return (
        <div className="flex-none p-6 border-b bg-white z-10">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                    {/* Title & Status */}
                    <div className="flex items-center gap-3">
                        <Input
                            id="title"
                            name="title"
                            defaultValue={title}
                            placeholder="タスク名を入力"
                            className="text-2xl font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
                            required
                        />
                        <select
                            id="workflow_status"
                            name="workflow_status"
                            defaultValue={status || workflowStatuses[0]}
                            className="h-8 rounded-full border border-input bg-background px-3 text-xs font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            {workflowStatuses.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {/* Scope Toggle (Only for regular tasks) */}
                    {!isMilestone && (
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => onScopeChange('team')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${!isPrivate ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                                >
                                    👥 チーム
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onScopeChange('private')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${isPrivate ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                                >
                                    🔒 個人
                                </button>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                                {isPrivate ? "自分と担当者のみ閲覧可能" : "チーム全員が閲覧可能"}
                            </span>
                        </div>
                    )}

                    {/* Progress Bar */}
                    {isEditMode && subtasks.length > 0 && (
                        <div className="flex items-center gap-3 max-w-md">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-500"
                                    style={{ width: `${(subtasks.filter(s => s.status === 'completed').length / subtasks.length) * 100}%` }}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                                {Math.round((subtasks.filter(s => s.status === 'completed').length / subtasks.length) * 100)}%
                            </span>
                        </div>
                    )}
                </div>

                {/* Close/Save Actions */}
                <div className="flex items-center gap-2">
                    {isEditMode && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onDelete}
                            disabled={isPending}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        type="button"
                        disabled={isPending}
                        onClick={(e) => {
                            const form = document.getElementById('task-form') as HTMLFormElement;
                            if (form) form.requestSubmit();
                        }}
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditMode ? "保存" : "作成"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
