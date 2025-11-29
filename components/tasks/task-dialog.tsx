"use client";

import { useState, useEffect, useTransition, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createTask, updateTask, deleteTask, getSubtasks, toggleTaskStatus, getTaskComments, addComment, submitDeliverable, getTaskWithHierarchy } from "@/actions/tasks";
import { Loader2, Plus, Trash2, CheckSquare, Link as LinkIcon, Paperclip, Send, ExternalLink, Edit2, User, UserPlus, Calendar, Settings2, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { getClients } from "@/actions/clients";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { TaskFieldEditor, TaskField } from "./task-field-editor";
import { SYSTEM_FIELDS } from "@/lib/constants";

interface TeamMember {
    role: string;
    user: {
        id: string;
        email: string;
        name: string | null;
        avatar_url: string | null;
    };
}

interface TaskDialogProps {
    members: TeamMember[];
    task?: any;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
    settings?: {
        workflow_statuses?: string[];
        custom_field_definitions?: TaskField[]; // Legacy
        regular_task_fields?: TaskField[];
        post_task_fields?: TaskField[];
    };
    defaultScope?: 'private' | 'team';
}

export function TaskDialog({ members, task, open: controlledOpen, onOpenChange: setControlledOpen, trigger, settings, defaultScope = 'team' }: TaskDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const [currentTask, setCurrentTask] = useState<any>(task);
    const [clients, setClients] = useState<any[]>([]);
    const [assignees, setAssignees] = useState<{ userId: string; role: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Custom Fields State
    const [customFields, setCustomFields] = useState<TaskField[]>([]);

    // Scope State
    const [isPrivate, setIsPrivate] = useState(false);

    // Subtask state
    const [subtaskTitle, setSubtaskTitle] = useState("");
    const [subtaskAssignee, setSubtaskAssignee] = useState("");
    const [subtaskDueDate, setSubtaskDueDate] = useState("");
    const [subtasks, setSubtasks] = useState<any[]>([]);

    // Comment state
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const commentsEndRef = useRef<HTMLDivElement>(null);

    const isEditMode = !!(currentTask && currentTask.id);
    const isMilestone = currentTask?.is_milestone === true;

    // Fetch data when dialog opens
    useEffect(() => {
        if (open) {
            setError(null);
            setIsLoading(true);
            startTransition(async () => {
                try {
                    const fetchedClients = await getClients();
                    setClients(fetchedClients);

                    if (task && task.id) {
                        // Always fetch the hierarchy (Parent Task)
                        const hierarchyTask = await getTaskWithHierarchy(task.id);

                        if (hierarchyTask) {
                            setCurrentTask(hierarchyTask);

                            // Initialize assignees from the fetched parent task
                            if (hierarchyTask.assignments) {
                                setAssignees(hierarchyTask.assignments.map((a: any) => ({
                                    userId: a.user_id,
                                    role: a.role || ""
                                })));
                            } else if (hierarchyTask.assigned_to) {
                                setAssignees([{ userId: hierarchyTask.assigned_to, role: "" }]);
                            } else {
                                setAssignees([]);
                            }

                            // Set subtasks and comments from the fetched parent task
                            setSubtasks(hierarchyTask.subtasks || []);
                            setComments(hierarchyTask.comments || []);

                            // Initialize Custom Fields
                            let fields: TaskField[] = [];
                            if (hierarchyTask.attributes?._fields && Array.isArray(hierarchyTask.attributes._fields)) {
                                fields = hierarchyTask.attributes._fields;
                            } else {
                                // Fallback to team settings if not defined in task
                                const isPost = hierarchyTask.is_milestone;
                                const customFields = isPost
                                    ? (settings?.post_task_fields || settings?.custom_field_definitions || [])
                                    : (settings?.regular_task_fields || settings?.custom_field_definitions || []);

                                // Always include system fields, then add custom fields
                                fields = [...SYSTEM_FIELDS, ...customFields.filter((f: any) => !f.system)] as TaskField[];
                            }
                            setCustomFields(fields);

                        } else {
                            // Fallback if fetch fails (shouldn't happen usually)
                            setCurrentTask(task);
                            setCustomFields(settings?.custom_field_definitions || []);
                        }

                        // Set isPrivate from task
                        setIsPrivate(task.is_private || false);
                    } else {
                        // New task creation
                        setCurrentTask(task);
                        setAssignees([]);
                        setSubtasks([]);
                        setComments([]);

                        // Set isPrivate from defaultScope
                        setIsPrivate(defaultScope === 'private');

                        // Initialize Custom Fields for New Task
                        const isPost = task?.is_milestone === true;
                        const customFields = isPost
                            ? (settings?.post_task_fields || settings?.custom_field_definitions || [])
                            : (settings?.regular_task_fields || settings?.custom_field_definitions || []);

                        // Always include system fields, then add custom fields
                        const fields = [...SYSTEM_FIELDS, ...customFields.filter((f: any) => !f.system)] as TaskField[];
                        setCustomFields(fields);
                    }
                } finally {
                    setIsLoading(false);
                }
            });
        } else {
            // Reset state when closed
            setCurrentTask(task);
        }
    }, [open, task, settings]);

    // Scroll to bottom of comments when they change
    useEffect(() => {
        if (open && isEditMode) {
            commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [comments, open, isEditMode]);

    const addAssignee = () => {
        setAssignees([...assignees, { userId: "", role: "" }]);
    };

    const removeAssignee = (index: number) => {
        setAssignees(assignees.filter((_, i) => i !== index));
    };

    const updateAssignee = (index: number, field: 'userId' | 'role', value: string) => {
        const newAssignees = [...assignees];
        newAssignees[index][field] = value;
        setAssignees(newAssignees);
    };

    // Custom Field Handlers
    const handleAddCustomField = (field: TaskField) => {
        setCustomFields([...customFields, field]);
    };

    const handleUpdateCustomField = (field: TaskField) => {
        setCustomFields(customFields.map(f => f.id === field.id ? field : f));
    };

    const handleDeleteCustomField = (id: string) => {
        setCustomFields(customFields.filter(f => f.id !== id));
    };

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const formData = new FormData(event.currentTarget);

        // Append _fields definition
        formData.append('_fields', JSON.stringify(customFields));

        startTransition(async () => {
            try {
                let result;
                if (isEditMode) {
                    const data: any = {};
                    const uuidFields = ['client_id', 'project_id', 'routine_id', 'assigned_to', 'parent_id'];

                    formData.forEach((value, key) => {
                        if (value === undefined || value === null) return;
                        let processedValue: FormDataEntryValue | null = value;
                        if (uuidFields.includes(key)) {
                            if (value === '' || value === 'undefined') {
                                processedValue = null;
                            }
                        }

                        if (key.startsWith('custom_')) {
                            if (!data.attributes) data.attributes = {};
                            data.attributes[key.replace('custom_', '')] = processedValue;
                        } else {
                            data[key] = processedValue;
                        }
                    });

                    data.is_private = isPrivate;

                    // Ensure attributes exists and add _fields
                    if (!data.attributes) data.attributes = {};
                    data.attributes._fields = customFields;

                    data.assignees = assignees.filter(a => a.userId);
                    result = await updateTask(currentTask.id, data);
                } else {
                    const formDataWithAssignees = new FormData(event.currentTarget);
                    formDataWithAssignees.set('assignees', JSON.stringify(assignees.filter(a => a.userId)));
                    // _fields is already appended to formDataWithAssignees because we appended to event.currentTarget which is the form? 
                    // No, new FormData(event.currentTarget) creates a snapshot. We need to append to the one we are sending.
                    formDataWithAssignees.set('_fields', JSON.stringify(customFields));
                    formDataWithAssignees.set('is_private', String(isPrivate));

                    result = await createTask(null, formDataWithAssignees);
                }

                if (result.success) {
                    setOpen(false);
                    router.refresh();
                } else {
                    const errorMsg = typeof result.error === 'string'
                        ? result.error
                        : (result.error as any)?.message || JSON.stringify(result.error) || "エラーが発生しました";
                    setError(errorMsg);
                }
            } catch (e) {
                setError("予期せぬエラーが発生しました");
            }
        });
    }

    async function handleDelete() {
        if (!confirm("本当にこのタスクを削除しますか？")) return;

        startTransition(async () => {
            const result = await deleteTask(currentTask.id);
            if (result.success) {
                setOpen(false);
                router.refresh();
            } else {
                setError("削除に失敗しました");
            }
        });
    }

    async function handleAddSubtask() {
        if (!subtaskTitle || !subtaskDueDate || !subtaskAssignee) {
            setError("サブタスクの追加には、タイトル・期限・担当者が必須です");
            return;
        }

        startTransition(async () => {
            const formData = new FormData();
            formData.append('title', subtaskTitle);
            formData.append('due_date', subtaskDueDate);
            formData.append('parent_id', currentTask.id);
            formData.append('status', 'in_progress');

            if (subtaskAssignee) {
                formData.append('assignees', JSON.stringify([{ userId: subtaskAssignee, role: '' }]));
            }

            const result = await createTask(null, formData);
            if (result.success) {
                setSubtaskTitle("");
                setSubtaskAssignee("");
                setSubtaskDueDate("");
                const fetchedSubtasks = await getSubtasks(currentTask.id);
                setSubtasks(fetchedSubtasks);
                router.refresh();
            } else {
                setError("サブタスクの追加に失敗しました");
            }
        });
    }

    async function handleToggleSubtask(subtaskId: string, currentStatus: string) {
        const isCompleted = currentStatus === 'completed';
        const newStatus = isCompleted ? 'pending' : 'completed';

        setSubtasks(subtasks.map(t =>
            t.id === subtaskId ? { ...t, status: newStatus } : t
        ));

        const result = await toggleTaskStatus(subtaskId, !isCompleted);
        if (!result.success) {
            setSubtasks(subtasks.map(t =>
                t.id === subtaskId ? { ...t, status: currentStatus } : t
            ));
            setError("ステータスの更新に失敗しました");
        } else {
            router.refresh();
        }
    }

    async function handleUpdateSubtaskAssignee(subtaskId: string, userId: string) {
        startTransition(async () => {
            // Optimistic update
            setSubtasks(subtasks.map(t => {
                if (t.id === subtaskId) {
                    const user = members.find(m => m.user.id === userId)?.user;
                    return {
                        ...t,
                        assignments: userId ? [{ user_id: userId, user }] : []
                    };
                }
                return t;
            }));

            const result = await updateTask(subtaskId, {
                assignees: userId ? [{ userId, role: '' }] : []
            });

            if (!result.success) {
                setError("担当者の更新に失敗しました");
                const fetchedSubtasks = await getSubtasks(currentTask.id);
                setSubtasks(fetchedSubtasks);
            } else {
                router.refresh();
            }
        });
    }

    async function handleSubmitUrl(subtaskId: string, url: string) {
        startTransition(async () => {
            const result = await submitDeliverable(subtaskId, url);
            if (result.success) {
                const fetchedSubtasks = await getSubtasks(currentTask.id);
                setSubtasks(fetchedSubtasks);
                router.refresh();
            } else {
                setError("提出URLの保存に失敗しました");
            }
        });
    }

    // Comment Handlers
    async function handleAddComment() {
        if (!newComment.trim()) return;

        startTransition(async () => {
            const result = await addComment(currentTask.id, newComment);
            if (result.success) {
                setNewComment("");
                const fetchedComments = await getTaskComments(currentTask.id);
                setComments(fetchedComments);
                router.refresh();
            } else {
                setError("コメントの送信に失敗しました");
            }
        });
    }

    const workflowStatuses = settings?.workflow_statuses || ['未着手', '進行中', '確認待ち', '完了'];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger ? (
                <DialogTrigger asChild>{trigger}</DialogTrigger>
            ) : (
                !isControlled && (
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            タスク追加
                        </Button>
                    </DialogTrigger>
                )
            )}
            <DialogContent className={`sm:max-w-[1000px] ${isEditMode ? 'h-[90vh]' : 'max-h-[90vh]'} flex flex-col p-0 gap-0`}>
                <DialogTitle className="sr-only">
                    {isEditMode ? `タスク編集: ${currentTask?.title || ''}` : '新規タスク作成'}
                </DialogTitle>
                {isLoading ? (
                    <div className="flex justify-center py-8 flex-1 items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <form id="task-form" key={currentTask?.id} onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                        {/* 1. Sticky Header Block */}
                        <div className="flex-none p-6 border-b bg-white z-10">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                    {/* Title & Status */}
                                    <div className="flex items-center gap-3">
                                        <Input
                                            id="title"
                                            name="title"
                                            defaultValue={currentTask?.title}
                                            placeholder="タスク名を入力"
                                            className="text-2xl font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
                                            required
                                        />
                                        <select
                                            id="workflow_status"
                                            name="workflow_status"
                                            defaultValue={(currentTask?.attributes as any)?.workflow_status || workflowStatuses[0]}
                                            className="h-8 rounded-full border border-input bg-background px-3 text-xs font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        >
                                            {workflowStatuses.map((status) => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </select>
                                </div>

                                {/* Scope Toggle (Only for regular tasks) */}
                                {!isMilestone && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex bg-slate-100 p-1 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => setIsPrivate(false)}
                                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${!isPrivate ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                                            >
                                                👥 チーム
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsPrivate(true)}
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
                                        onClick={handleDelete}
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

                        {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* 2. Left Column: Subtasks & Details (Scrollable) */}
                    <div className="flex-1 overflow-y-auto bg-slate-50/50">
                        <div className="p-6 space-y-8 max-w-3xl mx-auto">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* A. Production Process (Subtasks) - Priority 1 */}
                            {isEditMode ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                                            <CheckSquare className="h-5 w-5 text-blue-500" />
                                            制作プロセス
                                        </h3>
                                        <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded-full">
                                            {subtasks.filter(s => s.status === 'completed').length} / {subtasks.length} 完了
                                        </span>
                                    </div>

                                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                                        <div className="divide-y">
                                            {subtasks.map((subtask) => (
                                                <div
                                                    key={subtask.id}
                                                    className={`grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center p-4 hover:bg-slate-50/50 transition-colors group ${subtask.status === 'completed' ? 'bg-slate-50/80' : ''}`}
                                                >
                                                    <Checkbox
                                                        checked={subtask.status === 'completed'}
                                                        onCheckedChange={() => handleToggleSubtask(subtask.id, subtask.status)}
                                                        className="h-5 w-5"
                                                    />
                                                    <div className="min-w-0">
                                                        <div className={`font-medium truncate ${subtask.status === 'completed' ? 'line-through text-muted-foreground' : 'text-slate-700'}`}>
                                                            {subtask.title}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1.5">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {subtask.due_date ? format(new Date(subtask.due_date), "MM/dd", { locale: ja }) : '-'}
                                                            </span>
                                                            {subtask.assignments?.[0]?.user && (
                                                                <span className="flex items-center gap-1">
                                                                    <User className="h-3 w-3" />
                                                                    {subtask.assignments[0].user.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Assignee */}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                                {subtask.assignments?.[0]?.user ? (
                                                                    <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                                                                        <AvatarImage src={subtask.assignments[0].user.avatar_url || ""} />
                                                                        <AvatarFallback>{subtask.assignments[0].user.name?.[0] || "?"}</AvatarFallback>
                                                                    </Avatar>
                                                                ) : (
                                                                    <UserPlus className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground" />
                                                                )}
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleUpdateSubtaskAssignee(subtask.id, "")}>
                                                                <div className="flex items-center gap-2 w-full">
                                                                    <div className="h-6 w-6 rounded-full border border-dashed flex items-center justify-center">
                                                                        <User className="h-3 w-3 text-muted-foreground" />
                                                                    </div>
                                                                    <span>担当なし</span>
                                                                </div>
                                                            </DropdownMenuItem>
                                                            {members.map((member) => (
                                                                <DropdownMenuItem
                                                                    key={member.user.id}
                                                                    onClick={() => handleUpdateSubtaskAssignee(subtask.id, member.user.id)}
                                                                >
                                                                    <div className="flex items-center gap-2 w-full">
                                                                        <Avatar className="h-6 w-6">
                                                                            <AvatarImage src={member.user.avatar_url || ""} />
                                                                            <AvatarFallback>{member.user.name?.[0] || "?"}</AvatarFallback>
                                                                        </Avatar>
                                                                        <span>{member.user.name || member.user.email}</span>
                                                                    </div>
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-1">
                                                        {subtask.attributes?.submission_url ? (
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                                    onClick={() => window.open(subtask.attributes.submission_url, '_blank')}
                                                                >
                                                                    <Paperclip className="h-4 w-4" />
                                                                </Button>
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <Edit2 className="h-3 w-3" />
                                                                        </Button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent className="w-80">
                                                                        <SubtaskSubmissionForm
                                                                            initialUrl={subtask.attributes.submission_url}
                                                                            onSubmit={(url) => handleSubmitUrl(subtask.id, url)}
                                                                        />
                                                                    </PopoverContent>
                                                                </Popover>
                                                            </div>
                                                        ) : (
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground/50 hover:text-muted-foreground">
                                                                        <LinkIcon className="h-4 w-4" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-80">
                                                                    <SubtaskSubmissionForm
                                                                        onSubmit={(url) => handleSubmitUrl(subtask.id, url)}
                                                                    />
                                                                </PopoverContent>
                                                            </Popover>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Add Subtask Row */}
                                            <div className="p-3 bg-slate-50/50">
                                                <div className="flex items-center gap-3">
                                                    <Input
                                                        placeholder="新しい作業を追加..."
                                                        value={subtaskTitle}
                                                        onChange={(e) => setSubtaskTitle(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                                                e.preventDefault();
                                                                handleAddSubtask();
                                                            }
                                                        }}
                                                        className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-2 h-9 shadow-none"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="date"
                                                            value={subtaskDueDate}
                                                            onChange={(e) => setSubtaskDueDate(e.target.value)}
                                                            className="w-[130px] border-0 bg-transparent focus-visible:ring-0 h-9 shadow-none text-sm text-muted-foreground"
                                                        />
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-9 px-2 text-muted-foreground hover:text-foreground">
                                                                    {subtaskAssignee ? (
                                                                        <Avatar className="h-6 w-6">
                                                                            <AvatarImage src={members.find(m => m.user.id === subtaskAssignee)?.user.avatar_url || ""} />
                                                                            <AvatarFallback>{members.find(m => m.user.id === subtaskAssignee)?.user.name?.[0] || "?"}</AvatarFallback>
                                                                        </Avatar>
                                                                    ) : (
                                                                        <UserPlus className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {members.map((member) => (
                                                                    <DropdownMenuItem
                                                                        key={member.user.id}
                                                                        onClick={() => setSubtaskAssignee(member.user.id)}
                                                                    >
                                                                        <div className="flex items-center gap-2 w-full">
                                                                            <Avatar className="h-6 w-6">
                                                                                <AvatarImage src={member.user.avatar_url || ""} />
                                                                                <AvatarFallback>{member.user.name?.[0] || "?"}</AvatarFallback>
                                                                            </Avatar>
                                                                            <span>{member.user.name || member.user.email}</span>
                                                                        </div>
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                        <Button
                                                            type="button"
                                                            onClick={handleAddSubtask}
                                                            disabled={isPending || !subtaskTitle || !subtaskDueDate || !subtaskAssignee}
                                                            size="icon"
                                                            className="h-8 w-8 rounded-full"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center border-2 border-dashed rounded-xl text-muted-foreground bg-slate-50/50">
                                    <CheckSquare className="h-8 w-8 mx-auto mb-3 text-slate-300" />
                                    <p>タスクを作成すると、制作プロセス（サブタスク）を追加できるようになります。</p>
                                </div>
                            )}

                            {/* B. Details & Custom Fields (Collapsible) */}
                            <div className="space-y-4 pt-4 border-t">
                                <details className="group">
                                    <summary className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 list-none select-none">
                                        <div className="h-6 w-6 rounded-md bg-slate-100 flex items-center justify-center group-open:bg-slate-200 transition-colors">
                                            <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                                        </div>
                                        詳細情報・カスタム項目
                                    </summary>
                                    <div className="pt-6 space-y-6 pl-2">
                                        {/* Custom Fields */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-medium text-muted-foreground">カスタム項目</h4>
                                                <TaskFieldEditor
                                                    onSave={handleAddCustomField}
                                                    trigger={
                                                        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
                                                            <Plus className="h-3 w-3 mr-1" /> 項目を追加
                                                        </Button>
                                                    }
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {customFields.filter(f => !f.system).map((field) => (
                                                    <div key={field.id} className="grid gap-2 relative group">
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor={`custom_${field.id}`} className="text-xs text-muted-foreground">{field.label}</Label>
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <TaskFieldEditor
                                                                    field={field}
                                                                    onSave={handleUpdateCustomField}
                                                                    onDelete={field.required ? undefined : handleDeleteCustomField}
                                                                    trigger={
                                                                        <Button type="button" variant="ghost" size="icon" className="h-5 w-5">
                                                                            <Edit2 className="h-3 w-3" />
                                                                        </Button>
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                        {field.type === 'select' ? (
                                                            <select
                                                                id={`custom_${field.id}`}
                                                                name={`custom_${field.id}`}
                                                                defaultValue={currentTask?.attributes?.[field.id] || ""}
                                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                            >
                                                                <option value="">選択してください</option>
                                                                {field.options?.map((opt) => (
                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                ))}
                                                            </select>
                                                        ) : field.type === 'textarea' ? (
                                                            <Textarea
                                                                id={`custom_${field.id}`}
                                                                name={`custom_${field.id}`}
                                                                defaultValue={currentTask?.attributes?.[field.id] || ""}
                                                                className="min-h-[80px]"
                                                            />
                                                        ) : (
                                                            <Input
                                                                id={`custom_${field.id}`}
                                                                name={`custom_${field.id}`}
                                                                type={field.type === 'url' ? 'url' : field.type === 'date' ? 'date' : 'text'}
                                                                defaultValue={currentTask?.attributes?.[field.id] || ""}
                                                                className="h-9"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>

                    {/* 3. Right Column: Metadata & Comments */}
                    <div className="w-[320px] flex-none border-l bg-white flex flex-col h-full">
                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-6">
                                {/* Metadata Section */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">基本情報</h4>

                                    {/* Client */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">クライアント</Label>
                                        {currentTask?.client_id ? (
                                            <div className="text-sm font-medium">
                                                <input type="hidden" name="client_id" value={currentTask.client_id} />
                                                {clients.find(c => c.id === currentTask.client_id)?.name || "Unknown Client"}
                                            </div>
                                        ) : (
                                            <select
                                                name="client_id"
                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                                            >
                                                <option value="">(選択なし)</option>
                                                {clients.map((client) => (
                                                    <option key={client.id} value={client.id}>{client.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    {/* Due Date */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">期限</Label>
                                        <Input
                                            name="due_date"
                                            type="date"
                                            defaultValue={currentTask?.due_date?.split("T")[0]}
                                            className="h-9"
                                            required
                                        />
                                    </div>

                                    {/* Assignees */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-muted-foreground">{currentTask?.is_milestone ? "投稿管理担当者" : "担当者"}</Label>
                                        <div className="space-y-2">
                                            {assignees.map((assignee, index) => (
                                                <div key={index} className="flex gap-2 items-center">
                                                    <select
                                                        value={assignee.userId}
                                                        onChange={(e) => updateAssignee(index, 'userId', e.target.value)}
                                                        className="flex-1 h-8 rounded-md border border-input bg-background px-2 py-1 text-xs"
                                                    >
                                                        <option value="">(選択なし)</option>
                                                        {members.map((member) => (
                                                            <option key={member.user.id} value={member.user.id}>
                                                                {member.user.name || member.user.email}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeAssignee(index)}
                                                        className="h-8 w-8"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addAssignee}
                                                className="w-full h-8 text-xs"
                                            >
                                                <Plus className="mr-2 h-3 w-3" /> 担当者を追加
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Hidden Fields */}
                                    <input type="hidden" name="status" value="in_progress" />
                                    {currentTask?.is_milestone && <input type="hidden" name="is_milestone" value="true" />}
                                </div>

                                {/* Comments Section */}
                                {isEditMode && (
                                    <div className="pt-6 border-t space-y-4">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                                            コメント
                                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">{comments.length}</span>
                                        </h4>

                                        <div className="space-y-4">
                                            {comments.map((comment) => (
                                                <div key={comment.id} className="flex gap-3">
                                                    <Avatar className="h-6 w-6 mt-1">
                                                        <AvatarImage src={comment.user?.avatar_url || ""} />
                                                        <AvatarFallback>{comment.user?.name?.[0] || "?"}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-medium">{comment.user?.name || "Unknown"}</span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {format(new Date(comment.created_at), "MM/dd HH:mm", { locale: ja })}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs mt-1 bg-slate-50 p-2 rounded-lg text-slate-700 whitespace-pre-wrap">
                                                            {comment.content}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={commentsEndRef} />
                                            {comments.length === 0 && (
                                                <div className="text-center text-xs text-muted-foreground py-4">
                                                    コメントはまだありません
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Comment Input (Fixed at bottom of right column) */}
                        {isEditMode && (
                            <div className="p-3 border-t bg-white">
                                <div className="relative">
                                    <Textarea
                                        placeholder="コメントを入力..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        className="min-h-[80px] pr-10 resize-none text-sm"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                                handleAddComment();
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        size="icon"
                                        className="absolute bottom-2 right-2 h-7 w-7"
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim() || isPending}
                                    >
                                        <Send className="h-3 w-3" />
                                    </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1 text-right">
                                    Ctrl + Enter で送信
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </form >
                )}
        </DialogContent >
        </Dialog >
    );
}

function SubtaskSubmissionForm({ initialUrl, onSubmit }: { initialUrl?: string, onSubmit: (url: string) => void }) {
    const [url, setUrl] = useState(initialUrl || "");

    return (
        <div className="grid gap-4">
            <div className="space-y-2">
                <h4 className="font-medium leading-none">提出URL</h4>
                <p className="text-sm text-muted-foreground">
                    成果物のURLを入力してください。
                </p>
            </div>
            <div className="grid gap-2">
                <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="h-8"
                />
            </div>
            <Button size="sm" onClick={() => onSubmit(url)}>保存</Button>
        </div>
    );
}
