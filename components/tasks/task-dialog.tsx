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

    const isEditMode = !!task;

    useEffect(() => {
        if (open) {
            setError(null);
        }
    }, [open]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        const formData = new FormData(event.currentTarget);
        const data = {
            title: formData.get("title") as string,
            due_date: formData.get("due_date") as string,
            priority: formData.get("priority") as string,
            assigned_to: (formData.get("assigned_to") as string) || null,
        };

        startTransition(async () => {
            try {
                let result;
                if (isEditMode) {
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "タスク編集" : "タスク追加"}</DialogTitle>
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
