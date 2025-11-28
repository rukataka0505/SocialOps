"use client";

import { useState, useEffect, useTransition } from "react";
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
import { createTask, updateTask, deleteTask, getSubtasks, toggleTaskStatus } from "@/actions/tasks";
import { Loader2, Plus, Trash2, CheckSquare } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";

import { getClients } from "@/actions/clients";

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
        custom_field_definitions?: {
            id: string;
            label: string;
            type: 'text' | 'url' | 'date' | 'select';
            options?: string[];
        }[];
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

    const [clients, setClients] = useState<any[]>([]);
    const [assignees, setAssignees] = useState<{ userId: string; role: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Subtask state
    const [subtaskTitle, setSubtaskTitle] = useState("");
    const [subtaskAssignee, setSubtaskAssignee] = useState("");
    const [subtaskDueDate, setSubtaskDueDate] = useState("");
    const [subtasks, setSubtasks] = useState<any[]>([]); // This would ideally be fetched

    const isEditMode = !!(task && task.id);

    useEffect(() => {
        if (open && isEditMode) {
            startTransition(async () => {
                const fetchedSubtasks = await getSubtasks(task.id);
                setSubtasks(fetchedSubtasks);
            });
        }
    }, [open, task, isEditMode]);

    useEffect(() => {
        if (open) {
            setError(null);
            setIsLoading(true);
            startTransition(async () => {
                try {
                    const fetchedClients = await getClients();
                    setClients(fetchedClients);

                    if (task && task.assignments) {
                        setAssignees(task.assignments.map((a: any) => ({
                            userId: a.user_id,
                            role: a.role || ""
                        })));
                    } else if (task && task.assigned_to) {
                        setAssignees([{ userId: task.assigned_to, role: "" }]);
                    } else {
                        setAssignees([]);
                    }

                    // If we had an API to fetch subtasks, we would do it here
                    // For now, we'll assume they might be passed in task.subtasks or we need to fetch them
                    // Since we don't have a fetchSubtasks action yet, we'll skip fetching for now or assume empty
                } finally {
                    setIsLoading(false);
                }
            });
        }
    }, [open, task]);

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

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
            try {
                let result;
                if (isEditMode) {
                    const data: any = {};
                    const uuidFields = ['client_id', 'project_id', 'routine_id', 'assigned_to', 'parent_id'];

                    formData.forEach((value, key) => {
                        // Skip undefined or null values
                        if (value === undefined || value === null) return;

                        // Convert empty strings and "undefined" strings to null for UUID fields
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

                    // Include assignees
                    data.assignees = assignees.filter(a => a.userId);

                    // Debug: Log the data being sent
                    console.log('Data being sent to updateTask:', JSON.stringify(data, null, 2));

                    result = await updateTask(task.id, data);
                } else {
                    // Add assignees to formData
                    const formDataWithAssignees = new FormData(event.currentTarget);
                    formDataWithAssignees.set('assignees', JSON.stringify(assignees.filter(a => a.userId)));
                    result = await createTask(null, formDataWithAssignees);
                }

                if (result.success) {
                    setOpen(false);
                    router.refresh();
                } else {
                    // Handle error object properly
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
            const result = await deleteTask(task.id);
            if (result.success) {
                setOpen(false);
                router.refresh();
            } else {
                setError("削除に失敗しました");
            }
        });
    }

    async function handleAddSubtask() {
        if (!subtaskTitle || !subtaskDueDate) return;

        startTransition(async () => {
            const formData = new FormData();
            formData.append('title', subtaskTitle);
            formData.append('due_date', subtaskDueDate);
            formData.append('parent_id', task.id);
            formData.append('status', 'in_progress'); // Default status

            if (subtaskAssignee) {
                formData.append('assignees', JSON.stringify([{ userId: subtaskAssignee, role: '' }]));
            }

            const result = await createTask(null, formData);
            if (result.success) {
                setSubtaskTitle("");
                setSubtaskAssignee("");
                setSubtaskDueDate("");

                // Refresh subtasks
                const fetchedSubtasks = await getSubtasks(task.id);
                setSubtasks(fetchedSubtasks);

                router.refresh();
            } else {
                setError("サブタスクの追加に失敗しました");
            }
        });
    }

    async function handleToggleSubtask(subtaskId: string, currentStatus: string) {
        const isCompleted = currentStatus === 'completed';
        const newStatus = isCompleted ? 'pending' : 'completed'; // Toggle

        // Optimistic update
        setSubtasks(subtasks.map(t =>
            t.id === subtaskId ? { ...t, status: newStatus } : t
        ));

        const result = await toggleTaskStatus(subtaskId, !isCompleted);
        if (!result.success) {
            // Revert on error
            setSubtasks(subtasks.map(t =>
                t.id === subtaskId ? { ...t, status: currentStatus } : t
            ));
            setError("ステータスの更新に失敗しました");
        } else {
            router.refresh();
        }
    }

    const workflowStatuses = settings?.workflow_statuses || ['未着手', '進行中', '確認待ち', '完了'];
    const customFieldDefinitions = settings?.custom_field_definitions || [];

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
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>{isEditMode ? "タスク編集" : "タスク追加"}</DialogTitle>
                    </div>
                    <DialogDescription>
                        {isEditMode ? "タスクの内容を編集します。" : "新しいタスクを手動で追加します。"}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="w-full">

                        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="title" className="text-right">
                                    タイトル <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    name="title"
                                    defaultValue={task?.title}
                                    placeholder="例: 投稿確認"
                                    className="col-span-3"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="client_id" className="text-right">
                                    クライアント
                                </Label>
                                <select
                                    id="client_id"
                                    name="client_id"
                                    defaultValue={task?.client_id || ""}
                                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">(選択なし)</option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>
                                            {client.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="workflow_status" className="text-right">
                                    ステータス
                                </Label>
                                <select
                                    id="workflow_status"
                                    name="workflow_status"
                                    defaultValue={task?.workflow_status || workflowStatuses[0]}
                                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {workflowStatuses.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                                {/* Legacy status field hidden or mapped */}
                                <input type="hidden" name="status" value="in_progress" />
                                {task?.is_milestone && <input type="hidden" name="is_milestone" value="true" />}
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="due_date" className="text-right">
                                    期限 <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="due_date"
                                    name="due_date"
                                    type="date"
                                    defaultValue={task?.due_date?.split("T")[0]}
                                    className="col-span-3"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="priority" className="text-right">
                                    優先度
                                </Label>
                                <select
                                    id="priority"
                                    name="priority"
                                    defaultValue={task?.priority || "medium"}
                                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="urgent">緊急</option>
                                    <option value="high">高</option>
                                    <option value="medium">中</option>
                                    <option value="low">低</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right pt-2">
                                    担当者
                                </Label>
                                <div className="col-span-3 space-y-2">
                                    {assignees.map((assignee, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <select
                                                value={assignee.userId}
                                                onChange={(e) => updateAssignee(index, 'userId', e.target.value)}
                                                className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="">(担当者を選択)</option>
                                                {members.map((member) => (
                                                    <option key={member.user.id} value={member.user.id}>
                                                        {member.user.name || member.user.email}
                                                    </option>
                                                ))}
                                            </select>
                                            <Input
                                                value={assignee.role}
                                                onChange={(e) => updateAssignee(index, 'role', e.target.value)}
                                                placeholder="役割"
                                                className="flex-1"
                                            />
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
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        担当者を追加
                                    </Button>
                                </div>
                            </div>

                            {/* Custom Fields */}
                            {customFieldDefinitions.map((field) => (
                                <div key={field.id} className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor={`custom_${field.label}`} className="text-right">
                                        {field.label}
                                    </Label>
                                    {field.type === 'select' ? (
                                        <select
                                            id={`custom_${field.label}`}
                                            name={`custom_${field.label}`}
                                            defaultValue={task?.attributes?.[field.label] || ""}
                                            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">(選択なし)</option>
                                            {field.options?.map((opt) => (
                                                <option key={opt} value={opt}>
                                                    {opt}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <Input
                                            id={`custom_${field.label}`}
                                            name={`custom_${field.label}`}
                                            type={field.type}
                                            defaultValue={task?.attributes?.[field.label] || ""}
                                            className="col-span-3"
                                        />
                                    )}
                                </div>
                            ))}

                            <DialogFooter className="flex justify-between sm:justify-between mt-4">
                                {isEditMode ? (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={handleDelete}
                                        disabled={isPending}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        削除
                                    </Button>
                                ) : (
                                    <div></div>
                                )}
                                <Button type="submit" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isEditMode ? "更新" : "作成"}
                                </Button>
                            </DialogFooter>
                        </form>


                        {isEditMode && (
                            <div className="border-t pt-6 mt-2">
                                <h3 className="font-medium mb-4">サブタスク ({subtasks.length})</h3>
                                <div className="space-y-4">
                                    {/* Subtask List */}
                                    <div className="space-y-2">
                                        {subtasks.map((subtask) => (
                                            <div key={subtask.id} className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                                                <Checkbox
                                                    checked={subtask.status === 'completed'}
                                                    onCheckedChange={() => handleToggleSubtask(subtask.id, subtask.status)}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-sm font-medium truncate ${subtask.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                                        {subtask.title}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                                        <span>期限: {subtask.due_date ? new Date(subtask.due_date).toLocaleDateString() : 'なし'}</span>
                                                    </div>
                                                </div>
                                                {subtask.assignments?.[0]?.user && (
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={subtask.assignments[0].user.avatar_url || ""} />
                                                        <AvatarFallback>{subtask.assignments[0].user.name?.[0] || "?"}</AvatarFallback>
                                                    </Avatar>
                                                )}
                                            </div>
                                        ))}
                                        {subtasks.length === 0 && (
                                            <div className="text-sm text-muted-foreground text-center py-4 italic">
                                                サブタスクはありません
                                            </div>
                                        )}
                                    </div>

                                    {/* Inline Add Form */}
                                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-slate-50/50">
                                        <Input
                                            placeholder="新しい作業を追加... (Enterで追加)"
                                            value={subtaskTitle}
                                            onChange={(e) => setSubtaskTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                                    e.preventDefault();
                                                    handleAddSubtask();
                                                }
                                            }}
                                            className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-0"
                                        />
                                        <Input
                                            type="date"
                                            value={subtaskDueDate}
                                            onChange={(e) => setSubtaskDueDate(e.target.value)}
                                            className="w-auto border-0 bg-transparent focus-visible:ring-0"
                                        />
                                        <select
                                            value={subtaskAssignee}
                                            onChange={(e) => setSubtaskAssignee(e.target.value)}
                                            className="w-[120px] text-sm border-0 bg-transparent focus:ring-0 cursor-pointer"
                                        >
                                            <option value="">担当者</option>
                                            {members.map((member) => (
                                                <option key={member.user.id} value={member.user.id}>
                                                    {member.user.name || member.user.email}
                                                </option>
                                            ))}
                                        </select>
                                        <Button
                                            onClick={handleAddSubtask}
                                            disabled={isPending || !subtaskTitle || !subtaskDueDate}
                                            size="sm"
                                            variant="ghost"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog >
    );
}
