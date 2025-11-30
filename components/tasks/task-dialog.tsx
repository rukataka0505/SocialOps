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
import { TaskHeader } from "./dialog/task-header";
import { SubtaskList } from "./dialog/subtask-list";
import { TaskCommentSection } from "./dialog/task-comment-section";
import { TaskSubmissionSection } from "./dialog/task-submission-section";

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

    // Scope State - REMOVED
    // const [isPrivate, setIsPrivate] = useState(false);

    // Subtask state
    const [subtaskTitle, setSubtaskTitle] = useState("");
    const [subtaskAssignee, setSubtaskAssignee] = useState("");
    const [subtaskDueDate, setSubtaskDueDate] = useState("");
    const [subtasks, setSubtasks] = useState<any[]>([]);

    // Comment state
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");
    const commentsEndRef = useRef<HTMLDivElement>(null);

    // Loading state for progressive hydration
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);

    const isEditMode = !!(currentTask && currentTask.id);
    const isMilestone = currentTask?.is_milestone === true;
    const isChildTask = !!currentTask?.parent_id;

    // Subtask Edit State
    const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);

    // Fetch data when dialog opens
    useEffect(() => {
        if (open) {
            setError(null);
            // Don't block UI with isLoading
            // isLoading(true); 
            setIsDetailsLoading(true);

            startTransition(async () => {
                try {
                    // Parallel fetch for clients and task details
                    const clientsPromise = getClients();
                    const taskPromise = (task && task.id) ? getTaskWithHierarchy(task.id) : Promise.resolve(null);

                    const [fetchedClients, hierarchyTask] = await Promise.all([clientsPromise, taskPromise]);

                    setClients(fetchedClients);

                    if (hierarchyTask) {
                        // Merge strategy: Keep user input if any, but update details
                        // For now, we update the whole object but we should be careful if we had controlled inputs.
                        // Since inputs use defaultValue, updating state won't reset them unless we force it.
                        // However, we need to update subtasks and comments which are separate states.

                        setCurrentTask((prev: any) => ({
                            ...prev,
                            ...hierarchyTask,
                            attributes: {
                                ...(prev?.attributes as any || {}),
                                ...(hierarchyTask.attributes as any || {})
                            }
                        }));

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
                        if ((hierarchyTask.attributes as any)?._fields && Array.isArray((hierarchyTask.attributes as any)._fields)) {
                            fields = (hierarchyTask.attributes as any)._fields;
                        } else {
                            // Fallback to team settings if not defined in task
                            const isPost = hierarchyTask.is_milestone;
                            const customFields = isPost
                                ? (settings?.post_task_fields || [])
                                : (settings?.regular_task_fields || []);

                            // Always include system fields, then add custom fields
                            fields = [...SYSTEM_FIELDS, ...customFields.filter((f: any) => !f.system)] as TaskField[];
                        }
                        setCustomFields(fields);

                        // Set isPrivate from task - REMOVED
                        // setIsPrivate(hierarchyTask.is_private || false);

                    } else if (task && task.id) {
                        // Fallback if fetch fails or returns null (shouldn't happen usually if task exists)
                        // Just use what we have
                        setCurrentTask(task);
                        setCustomFields(settings?.regular_task_fields || []);
                        // Set isPrivate from task - REMOVED
                        // setIsPrivate(task.is_private || false);
                    } else {
                        // New task creation
                        setCurrentTask(task);
                        setAssignees([]);
                        setSubtasks([]);
                        setComments([]);

                        // Set isPrivate from defaultScope - REMOVED
                        // setIsPrivate(defaultScope === 'private');

                        // Initialize Custom Fields for New Task
                        const isPost = task?.is_milestone === true;
                        const customFields = isPost
                            ? (settings?.post_task_fields || [])
                            : (settings?.regular_task_fields || []);

                        // Always include system fields, then add custom fields
                        const fields = [...SYSTEM_FIELDS, ...customFields.filter((f: any) => !f.system)] as TaskField[];
                        setCustomFields(fields);
                    }
                } catch (e) {
                    console.error("Failed to fetch task details", e);
                    setError("詳細データの取得に失敗しました");
                } finally {
                    setIsDetailsLoading(false);
                    setIsLoading(false); // Ensure this is false
                }
            });
        } else {
            // Reset state when closed
            setCurrentTask(task);
        }
    }, [open, task, settings, defaultScope]);

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

                    // data.is_private = isPrivate; // Removed

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
                    // formDataWithAssignees.set('is_private', String(isPrivate)); // Removed

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
                // If we are in the parent view, update the subtask list
                if (!isChildTask) {
                    const fetchedSubtasks = await getSubtasks(currentTask.id);
                    setSubtasks(fetchedSubtasks);
                } else {
                    // If we are in the child view (self), just refresh
                    router.refresh();
                }
            } else {
                setError("提出URLの保存に失敗しました");
            }
        });
    }

    async function handleDeleteSubtask(subtaskId: string) {
        if (!confirm("本当にこのサブタスクを削除しますか？")) return;

        startTransition(async () => {
            const result = await deleteTask(subtaskId);
            if (result.success) {
                const fetchedSubtasks = await getSubtasks(currentTask.id);
                setSubtasks(fetchedSubtasks);
                router.refresh();
            } else {
                setError("サブタスクの削除に失敗しました");
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

    // Scope Toggle Handler
    // Scope Toggle Handler - REMOVED
    /*
    const handleScopeChange = (scope: 'team' | 'private') => {
        if (scope === 'private') {
            if (confirm("このタスクを個人タスクに変更しますか？\nチームメンバーからは見えなくなります。")) {
                setIsPrivate(true);
            }
        } else {
            if (confirm("このタスクをチームタスクに変更しますか？\nチームメンバー全員に公開されます。")) {
                setIsPrivate(false);
            }
        }
    };
    */
    const handleScopeChange = (scope: 'team' | 'private') => {
        // No-op or show alert that this feature is removed
        console.log("Scope change is no longer supported");
    };

    const handleNewSubtaskChange = (field: 'title' | 'dueDate' | 'assignee', value: string) => {
        if (field === 'title') setSubtaskTitle(value);
        if (field === 'dueDate') setSubtaskDueDate(value);
        if (field === 'assignee') setSubtaskAssignee(value);
    };

    // 2. Child Task Mode
    if (isChildTask) {
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0 gap-0">
                    <DialogTitle className="sr-only">サブタスク: {currentTask?.title}</DialogTitle>
                    {isLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                        <div className="flex flex-col h-full overflow-hidden">
                            {/* Header */}
                            <div className="p-6 border-b bg-white flex-none">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span>親タスク:</span>
                                        <Button
                                            variant="link"
                                            className="p-0 h-auto font-medium text-blue-600"
                                            onClick={() => {
                                                setOpen(false);
                                                router.push(`/dashboard?taskId=${currentTask.parent_id}`);
                                            }}
                                        >
                                            {currentTask?.parent?.title || "親タスク"}
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isEditMode && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleDelete}
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button onClick={(e) => (document.getElementById('child-task-form') as HTMLFormElement)?.requestSubmit()} disabled={isPending}>
                                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            保存
                                        </Button>
                                    </div>
                                </div>
                                <form id="child-task-form" onSubmit={handleSubmit}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <Checkbox
                                            checked={currentTask?.status === 'completed'}
                                            onCheckedChange={async (checked) => {
                                                await toggleTaskStatus(currentTask.id, checked as boolean);
                                                router.refresh();
                                                setOpen(false);
                                            }}
                                            className="h-6 w-6"
                                        />
                                        <Input
                                            name="title"
                                            defaultValue={currentTask?.title}
                                            className="text-xl font-bold border-none shadow-none px-0 focus-visible:ring-0 h-auto"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="date"
                                                name="due_date"
                                                defaultValue={currentTask?.due_date}
                                                className="w-auto border-none shadow-none focus-visible:ring-0 p-0 h-auto"
                                            />
                                        </div>
                                        {/* Assignee Selector could go here */}
                                    </div>
                                </form>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 flex overflow-hidden">
                                <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 space-y-6">
                                    {/* Submission */}
                                    <TaskSubmissionSection
                                        url={currentTask?.attributes?.submission_url}
                                        onSubmitUrl={(url) => handleSubmitUrl(currentTask.id, url)}
                                        isPending={isPending}
                                    />

                                    {/* Chat */}
                                    <div className="bg-white p-4 rounded-lg border shadow-sm h-[400px] flex flex-col">
                                        <TaskCommentSection
                                            comments={comments}
                                            newComment={newComment}
                                            onNewCommentChange={setNewComment}
                                            onAddComment={handleAddComment}
                                            isPending={isPending}
                                            isLoading={isDetailsLoading}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                    }
                </DialogContent >
            </Dialog >
        );
    }

    return (
        <>
            {/* Nested Dialog for Subtask Editing */}
            {editingSubtaskId && (
                <TaskDialog
                    members={members}
                    task={{ id: editingSubtaskId }}
                    open={true}
                    onOpenChange={(open) => !open && setEditingSubtaskId(null)}
                    settings={settings}
                />
            )}

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
                        <form id="task-form" key={currentTask?.id || `new-${currentTask?.due_date}`} onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                            {/* 1. Sticky Header Block */}
                            <TaskHeader
                                title={currentTask?.title}
                                status={(currentTask?.attributes as any)?.workflow_status}
                                isPrivate={false} // Removed isPrivate
                                isMilestone={isMilestone}
                                isEditMode={isEditMode}
                                subtasks={subtasks}
                                workflowStatuses={workflowStatuses}
                                onScopeChange={handleScopeChange}
                                onDelete={handleDelete}
                                isPending={isPending}
                            />

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

                                        {/* A. Production Process (Subtasks) */}
                                        <SubtaskList
                                            subtasks={subtasks}
                                            members={members}
                                            isEditMode={isEditMode}
                                            isPending={isPending}
                                            isLoading={isDetailsLoading}
                                            newSubtask={{
                                                title: subtaskTitle,
                                                dueDate: subtaskDueDate,
                                                assignee: subtaskAssignee
                                            }}
                                            onNewSubtaskChange={handleNewSubtaskChange}
                                            onAddSubtask={handleAddSubtask}
                                            onToggleSubtask={handleToggleSubtask}
                                            onUpdateAssignee={handleUpdateSubtaskAssignee}
                                            onDeleteSubtask={handleDeleteSubtask}
                                            onEditSubtask={setEditingSubtaskId}
                                        />

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
                                                    {/* Custom Fields Logic */}
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
                                <TaskCommentSection
                                    comments={comments}
                                    newComment={newComment}
                                    onNewCommentChange={setNewComment}
                                    onAddComment={handleAddComment}
                                    isPending={isPending}
                                >
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
                                </TaskCommentSection>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog >
        </>
    );
}

function SubtaskSubmissionForm({ initialUrl = "", onSubmit }: { initialUrl?: string, onSubmit: (url: string) => void }) {
    const [url, setUrl] = useState(initialUrl);
    return (
        <div className="flex gap-2">
            <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="URLを入力..."
                className="h-8"
            />
            <Button size="sm" onClick={() => onSubmit(url)} className="h-8">保存</Button>
        </div>
    );
}
