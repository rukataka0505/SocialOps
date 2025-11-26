"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { createRoutine, RoutineState } from "@/actions/routines";
import { Loader2, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DAYS = [
    { id: "Mon", label: "月" },
    { id: "Tue", label: "火" },
    { id: "Wed", label: "水" },
    { id: "Thu", label: "木" },
    { id: "Fri", label: "金" },
    { id: "Sat", label: "土" },
    { id: "Sun", label: "日" },
];

interface RoutineDialogProps {
    clientId: string;
}

const initialState: RoutineState = {};

export function RoutineDialog({ clientId }: RoutineDialogProps) {
    const [open, setOpen] = useState(false);

    const createRoutineWithId = createRoutine.bind(null, clientId);
    const [state, formAction, isPending] = useActionState(createRoutineWithId, initialState);

    useEffect(() => {
        if (state.success) {
            setOpen(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.success]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    ルーチン追加
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>ルーチン追加</DialogTitle>
                    <DialogDescription>
                        新しいルーチンを設定します。
                    </DialogDescription>
                </DialogHeader>

                <form action={formAction} className="grid gap-4 py-4">
                    {state.error && (
                        <Alert variant="destructive">
                            <AlertDescription>{state.error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                            ルーチン名 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="title"
                            name="title"
                            placeholder="例: 朝の挨拶"
                            className="col-span-3"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="time" className="text-right">
                            投稿時間 <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="time"
                            name="time"
                            type="time"
                            className="col-span-3"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <Label className="text-right pt-2">
                            曜日 <span className="text-red-500">*</span>
                        </Label>
                        <div className="col-span-3 grid grid-cols-3 gap-2">
                            {DAYS.map((day) => (
                                <div key={day.id} className="flex items-center space-x-2">
                                    <Checkbox id={`day-${day.id}`} name="days" value={day.id} />
                                    <Label htmlFor={`day-${day.id}`} className="font-normal cursor-pointer">
                                        {day.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            ルーチンを作成
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
