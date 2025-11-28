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
import { Loader2, Plus, Trash2, CheckSquare, Link as LinkIcon, Paperclip, Send, ExternalLink, Edit2, User, UserPlus, Calendar, Settings2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { getClients } from "@/actions/clients";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { TaskFieldEditor, TaskField } from "./task-field-editor";

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
}

export function TaskDialog({ members, task, open: controlledOpen, onOpenChange: setControlledOpen, trigger, settings }: TaskDialogProps) {
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
                            if (hierarchyTask.attributes?._fields) {
                                setCustomFields(hierarchyTask.attributes._fields);
                            } else {
                                // Fallback to team settings if not defined in task
                                const isPost = hierarchyTask.is_milestone;
                                const defaultFields = isPost
                                    ? (settings?.post_task_fields || settings?.custom_field_definitions || [])
                                    : (settings?.regular_task_fields || settings?.custom_field_definitions || []);
                                setCustomFields(defaultFields);
                            }
                        } else {
                            // Fallback if fetch fails (shouldn't happen usually)
                            setCurrentTask(task);
                            setCustomFields(settings?.custom_field_definitions || []);
                        }
                    } else {
                        // New task creation
                        setCurrentTask(task);
                        setAssignees([]);
                        setSubtasks([]);
                        setComments([]);

                        // Initialize Custom Fields for New Task
                        const isPost = task?.is_milestone === true;
                        const defaultFields = isPost
                            ? (settings?.post_task_fields || settings?.custom_field_definitions || [])
                            : (settings?.regular_task_fields || settings?.custom_field_definitions || []);
                        setCustomFields(defaultFields);
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
            <DialogContent className={`sm:max-w-[900px] ${isEditMode ? 'h-[80vh]' : 'max-h-[90vh]'} overflow-hidden flex flex-col`}>
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>{isEditMode ? "タスク詳細" : "タスク追加"}</DialogTitle>
                    </div>
                    <DialogDescription>
                        {isEditMode ? "タスクの進捗管理とコミュニケーションを行います。" : "新しいタスクを作成します。"}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center py-8 flex-1 items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden">
                        <form id="task-form" key={currentTask?.id} onSubmit={handleSubmit} className="h-full flex flex-col lg:flex-row gap-6">
                            {/* Left Column: Task Info & Subtasks */}
                            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                                <ScrollArea className="flex-1 pr-4">
                                    <div className="space-y-6 p-1">
                                        {error && (
                                            <Alert variant="destructive">
                                                <AlertDescription>{error}</AlertDescription>
                                            </Alert>
                                        )}

                                        {/* Header Area: Title, Due Date, Assignee */}
                                        <div className="grid gap-4 p-4 bg-slate-50 rounded-lg border">
                                            <div className="grid gap-2">
                                                <Label htmlFor="title" className="font-bold text-lg">タイトル</Label>
                                                <Input
                                                    id="title"
                                                    name="title"
                                                    defaultValue={currentTask?.title}
                                                    placeholder="タスク名を入力"
                                                    className="text-lg font-medium"
                                                    required
                                                />
                                            </div>

                                            {/* Client Selector (Hidden if client_id exists) */}
                                            {currentTask?.client_id ? (
                                                <input type="hidden" name="client_id" value={currentTask.client_id} />
                                            ) : (
                                                <div className="grid gap-2">
                                                    <Label htmlFor="client_id">クライアント</Label>
                                                    <select
                                                        id="client_id"
                                                        name="client_id"
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                    >
                                                        <option value="">(選択なし)</option>
                                                        {clients.map((client) => (
                                                            <option key={client.id} value={client.id}>{client.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="due_date">期限</Label>
                                                    <Input
                                                        id="due_date"
                                                        name="due_date"
                                                        type="date"
                                                        defaultValue={currentTask?.due_date?.split("T")[0]}
                                                        required
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="workflow_status">ステータス</Label>
                                                    <select
                                                        id="workflow_status"
                                                        name="workflow_status"
                                                        defaultValue={currentTask?.workflow_status || workflowStatuses[0]}
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                    >
                                                        {workflowStatuses.map((status) => (
                                                            <option key={status} value={status}>{status}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Assignees - Hidden for Milestones */}
                                            {!isMilestone && (
                                                <div className="grid gap-2">
                                                    <Label>担当者</Label>
                                                    <div className="space-y-2">
                                                        {assignees.map((assignee, index) => (
                                                            <div key={index} className="flex gap-2 items-center">
                                                                <select
                                                                    value={assignee.userId}
                                                                    onChange={(e) => updateAssignee(index, 'userId', e.target.value)}
                                                                    className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
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
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={addAssignee}
                                                            className="w-full"
                                                        >
                                                            <Plus className="mr-2 h-4 w-4" /> 担当者を追加
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Hidden Fields */}
                                            <input type="hidden" name="status" value="in_progress" />
                                            {currentTask?.is_milestone && <input type="hidden" name="is_milestone" value="true" />}

                                            {/* Progress & Metadata */}
                                            {isEditMode && subtasks.length > 0 && (
                                                <div className="mt-2 space-y-2">
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>進捗状況</span>
                                                        <span>{Math.round((subtasks.filter(s => s.status === 'completed').length / subtasks.length) * 100)}%</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 transition-all duration-500"
                                                            style={{ width: `${(subtasks.filter(s => s.status === 'completed').length / subtasks.length) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {isEditMode && currentTask?.created_at && (
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t border-dashed">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>作成日: {format(new Date(currentTask.created_at), "yyyy/MM/dd HH:mm", { locale: ja })}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Custom Fields Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold flex items-center gap-2">
                                                    <Settings2 className="h-4 w-4" /> カスタム項目
                                                </h3>
                                                <TaskFieldEditor
                                                    onSave={handleAddCustomField}
                                                    trigger={
                                                        <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                                                            <Plus className="h-3 w-3 mr-1" /> 項目を追加
                                                        </Button>
                                                    }
                                                />
                                            </div>
                                            <div className="grid gap-4 p-4 bg-slate-50 rounded-lg border">
                                                {customFields.map((field) => (
                                                    <div key={field.id} className="grid gap-2 relative group">
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor={`custom_${field.id}`}>{field.label}</Label>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <TaskFieldEditor
                                                                    field={field}
                                                                    onSave={handleUpdateCustomField}
                                                                    onDelete={field.required ? undefined : handleDeleteCustomField} // Prevent deletion if required
                                                                    trigger={
                                                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6">
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
                                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                            >
                                                                <option value="">選択してください</option>
                                                                {field.options?.map((opt) => (
                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                ))}
                                                            </select>
                                                        ) : field.type === 'textarea' ? ( // Added textarea support
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
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                                {customFields.length === 0 && (
                                                    <div className="text-center text-sm text-muted-foreground py-4 border border-dashed rounded-lg">
                                                        カスタム項目はありません
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Subtasks Section (Only in Edit Mode) */}
                                        {isEditMode && (
                                            <div className="space-y-4">
                                                <h3 className="font-semibold flex items-center gap-2">
                                                    <CheckSquare className="h-4 w-4" /> 制作プロセス
                                                </h3>
                                                <div className="space-y-2">

                                                    {subtasks.map((subtask) => (
                                                        <div
                                                            key={subtask.id}
                                                            className={`grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors group ${subtask.status === 'completed' ? 'opacity-60 bg-slate-50' : ''}`}
                                                        >
                                                            <Checkbox
                                                                checked={subtask.status === 'completed'}
                                                                onCheckedChange={() => handleToggleSubtask(subtask.id, subtask.status)}
                                                            />
                                                            <div className="min-w-0">
                                                                <div className={`text-sm font-medium truncate ${subtask.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                                                    {subtask.title}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                                                    <span>{subtask.due_date ? format(new Date(subtask.due_date), "MM/dd", { locale: ja }) : '-'}</span>
                                                                </div>
                                                            </div>

                                                            {/* Assignee Selector (Avatar Dropdown) */}
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                                                        {subtask.assignments?.[0]?.user ? (
                                                                            <Avatar className="h-7 w-7">
                                                                                <AvatarImage src={subtask.assignments[0].user.avatar_url || ""} />
                                                                                <AvatarFallback>{subtask.assignments[0].user.name?.[0] || "?"}</AvatarFallback>
                                                                            </Avatar>
                                                                        ) : (
                                                                            <UserPlus className="h-4 w-4 text-muted-foreground" />
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

                                                            {/* Submission UI */}
                                                            <div className="flex items-center gap-2">
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
                                                                            <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1">
                                                                                <LinkIcon className="h-3 w-3" /> 提出
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

                                                    {/* Inline Add Subtask */}
                                                    <div className="flex items-center gap-2 p-2 border border-dashed rounded-lg bg-slate-50/50">
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
                                                            className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-2 h-8"
                                                        />
                                                        <Input
                                                            type="date"
                                                            value={subtaskDueDate}
                                                            onChange={(e) => setSubtaskDueDate(e.target.value)}
                                                            className="w-[130px] border-0 bg-transparent focus-visible:ring-0 h-8"
                                                        />

                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                                                                    {subtaskAssignee ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <Avatar className="h-5 w-5">
                                                                                <AvatarImage src={members.find(m => m.user.id === subtaskAssignee)?.user.avatar_url || ""} />
                                                                                <AvatarFallback>{members.find(m => m.user.id === subtaskAssignee)?.user.name?.[0] || "?"}</AvatarFallback>
                                                                            </Avatar>
                                                                            <span className="text-xs">{members.find(m => m.user.id === subtaskAssignee)?.user.name}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-1">
                                                                            <UserPlus className="h-4 w-4" />
                                                                            <span className="text-xs">担当者</span>
                                                                        </div>
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
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>

                                {/* Footer Actions */}
                                <div className="border-t pt-4 flex justify-between items-center">
                                    {isEditMode ? (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleDelete}
                                            disabled={isPending}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> 削除
                                        </Button>
                                    ) : <div></div>}
                                    <Button type="submit" disabled={isPending}>
                                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isEditMode ? "保存" : "作成"}
                                    </Button>
                                </div>
                            </div >

                            {/* Right Column: Comments (Only in Edit Mode) */}
                            {
                                isEditMode && (
                                    <div className="w-full lg:w-[350px] flex flex-col border-l pl-0 lg:pl-6 h-full">
                                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                                            コメント ({comments.length})
                                        </h3>
                                        <ScrollArea className="flex-1 pr-4 -mr-4 mb-4">
                                            <div className="space-y-4 pr-4">
                                                {comments.map((comment) => (
                                                    <div key={comment.id} className="flex gap-3">
                                                        <Avatar className="h-8 w-8 mt-1">
                                                            <AvatarImage src={comment.user?.avatar_url || ""} />
                                                            <AvatarFallback>{comment.user?.name?.[0] || "?"}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium">{comment.user?.name || "Unknown"}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {format(new Date(comment.created_at), "MM/dd HH:mm", { locale: ja })}
                                                                </span>
                                                            </div>
                                                            <div className="text-sm mt-1 bg-slate-50 p-2 rounded-lg text-slate-700 whitespace-pre-wrap">
                                                                {comment.content}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div ref={commentsEndRef} />
                                                {comments.length === 0 && (
                                                    <div className="text-center text-sm text-muted-foreground py-8">
                                                        コメントはまだありません
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                        <div className="mt-auto">
                                            <div className="relative">
                                                <Textarea
                                                    placeholder="コメントを入力..."
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    className="min-h-[80px] pr-10 resize-none"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                                            handleAddComment();
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    className="absolute bottom-2 right-2 h-8 w-8"
                                                    onClick={handleAddComment}
                                                    disabled={!newComment.trim() || isPending}
                                                >
                                                    <Send className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 text-right">
                                                Ctrl + Enter で送信
                                            </p>
                                        </div>
                                    </div>
                                )
                            }
                        </form >
                    </div >
                )
                }
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
