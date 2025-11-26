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
import { createTask, updateTask, deleteTask } from "@/actions/tasks";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

import { getClients } from "@/actions/clients";
import { TaskFieldEditor } from "./task-field-editor";
import { TaskField } from "./task-field-manager";

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
    task?: any; // Replace with proper Task type if available
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function TaskDialog({ members, task, open: controlledOpen, onOpenChange: setControlledOpen, trigger }: TaskDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const [clients, setClients] = useState<any[]>([]);
    const [customFields, setCustomFields] = useState<TaskField[]>([]);
    const [assignees, setAssignees] = useState<{ userId: string; role: string }[]>([]);

    const isEditMode = !!task;

    useEffect(() => {
        if (open) {
            setError(null);
            // Fetch clients when dialog opens
            startTransition(async () => {
                const fetchedClients = await getClients();
                setClients(fetchedClients);

                // Load custom fields from task attributes if editing
                if (task && task.attributes && task.attributes._fields) {
                    setCustomFields(task.attributes._fields);
                } else {
                    setCustomFields([]);
                }

                if (task && task.assignments) {
                    setAssignees(task.assignments.map((a: any) => ({
                        userId: a.user_id,
                        role: a.role || ""
                    })));
                } else if (task && task.assigned_to) {
                    // Backward compatibility
                    setAssignees([{ userId: task.assigned_to, role: "" }]);
                } else {
                    setAssignees([]);
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

    const addCustomField = (field: TaskField) => {
        setCustomFields([...customFields, field]);
    };

    const updateCustomField = (field: TaskField) => {
        setCustomFields(customFields.map(f => f.id === field.id ? field : f));
    };

    const deleteCustomField = (fieldId: string) => {
        setCustomFields(customFields.filter(f => f.id !== fieldId));
    };

    const handleSaveField = (field: TaskField) => {
        const existingField = customFields.find(f => f.id === field.id);
        if (existingField) {
            updateCustomField(field);
        } else {
            addCustomField(field);
        }
    };

    const handleDeleteField = (fieldId: string) => {
        deleteCustomField(fieldId);
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
                    formData.forEach((value, key) => {
                        if (key.startsWith('custom_')) {
                            if (!data.attributes) data.attributes = {};
                            data.attributes[key.replace('custom_', '')] = value;
                        } else if (key === 'management_url') {
                            if (!data.attributes) data.attributes = {};
                            data.attributes.management_url = value;
                        } else {
                            data[key] = value;
                        }
                    });

                    // Save custom field definitions
                    if (!data.attributes) data.attributes = {};
                    data.attributes._fields = customFields;

                    result = await updateTask(task.id, data);
                } else {
                    // Add custom field definitions to formData
                    const formDataWithFields = new FormData(event.currentTarget);
                    formDataWithFields.set('_fields', JSON.stringify(customFields));
                    result = await createTask(null, formDataWithFields);
                }

                if (result.success) {
                    setOpen(false);
                    router.refresh();
                } else {
                    setError(result.error?.toString() || "エラーが発生しました");
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>{isEditMode ? "タスク編集" : "タスク追加"}</DialogTitle>
                    </div>
                    <DialogDescription>
                        {isEditMode ? "タスクの内容を編集します。" : "新しいタスクを手動で追加します。"}
                    </DialogDescription>
                </DialogHeader>

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
                        <Label htmlFor="status" className="text-right">
                            ステータス
                        </Label>
                        <select
                            id="status"
                            name="status"
                            defaultValue={task?.status || "in_progress"}
                            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="in_progress">進行中</option>
                            <option value="pending">確認待ち</option>
                            <option value="completed">完了</option>
                        </select>
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
                                        placeholder="役割 (例: レビュアー)"
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
                            <input type="hidden" name="assignees" value={JSON.stringify(assignees.filter(a => a.userId))} />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="management_url" className="text-right">
                            管理URL
                        </Label>
                        <Input
                            id="management_url"
                            name="management_url"
                            defaultValue={task?.attributes?.management_url || ""}
                            placeholder="https://docs.google.com/..."
                            className="col-span-3"
                        />
                    </div>

                    {customFields.map((field) => (
                        <div key={field.id} className="grid grid-cols-4 items-center gap-4 group">
                            <div className="text-right flex items-center justify-end gap-2">
                                <TaskFieldEditor
                                    field={field}
                                    onSave={handleSaveField}
                                    onDelete={handleDeleteField}
                                    trigger={
                                        <Label htmlFor={`custom_${field.id}`} className="cursor-pointer hover:underline hover:text-primary">
                                            {field.label}
                                        </Label>
                                    }
                                />
                            </div>
                            {field.type === 'select' ? (
                                <select
                                    id={`custom_${field.id}`}
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
                                    id={`custom_${field.id}`}
                                    name={`custom_${field.label}`}
                                    type={field.type}
                                    defaultValue={task?.attributes?.[field.label] || ""}
                                    className="col-span-3"
                                />
                            )}
                        </div>
                    ))}

                    <div className="flex justify-center py-2">
                        <TaskFieldEditor
                            onSave={handleSaveField}
                            trigger={
                                <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                    <Plus className="mr-2 h-4 w-4" />
                                    項目を追加
                                </Button>
                            }
                        />
                    </div>

                    <DialogFooter className="flex justify-between sm:justify-between">
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
                            <div></div> // Spacer
                        )}
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditMode ? "更新" : "作成"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
