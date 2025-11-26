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
import { getTeamSettings } from "@/actions/teams";
import { TaskFieldManager, TaskField } from "./task-field-manager";

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

    const isEditMode = !!task;

    useEffect(() => {
        if (open) {
            setError(null);
            // Fetch clients and settings when dialog opens
            startTransition(async () => {
                const [fetchedClients, settings] = await Promise.all([
                    getClients(),
                    getTeamSettings()
                ]);
                setClients(fetchedClients);
                setCustomFields(settings.task_fields || []);
            });
        }
    }, [open]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const formData = new FormData(event.currentTarget);
        // No need to manually construct data object here as we pass formData directly to actions
        // But for updateTask we need an object.

        startTransition(async () => {
            try {
                let result;
                if (isEditMode) {
                    // For update, we need to construct the object manually because updateTask expects an object
                    // This is a bit inconsistent with createTask but let's follow existing pattern or adapt.
                    // The existing updateTask takes (taskId, data object).
                    // We need to extract everything from formData.
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

                    // Merge existing attributes if any? 
                    // For now, let's assume we are sending what we want to update.
                    // Ideally updateTask should handle formData too, but let's stick to object for now.

                    result = await updateTask(task.id, data);
                } else {
                    // createTask expects (prevState, formData) signature if used with useActionState,
                    // but here we call it directly. We need to adapt or call it as a function.
                    // The current createTask implementation takes (prevState, formData).
                    // We can pass null as prevState.
                    result = await createTask(null, formData);
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
                        <TaskFieldManager initialFields={customFields} />
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

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="assigned_to" className="text-right">
                            担当者
                        </Label>
                        <select
                            id="assigned_to"
                            name="assigned_to"
                            defaultValue={task?.assigned_to || ""}
                            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">(未割り当て)</option>
                            {members.map((member) => (
                                <option key={member.user.id} value={member.user.id}>
                                    {member.user.name || member.user.email}
                                </option>
                            ))}
                        </select>
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
                        <div key={field.id} className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor={`custom_${field.id}`} className="text-right">
                                {field.label}
                            </Label>
                            {field.type === 'select' ? (
                                <select
                                    id={`custom_${field.id}`}
                                    name={`custom_${field.label}`} // Use label as key for readability in attributes, or ID? Plan said ID but label is friendlier. Let's use label for now as ID is random.
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
