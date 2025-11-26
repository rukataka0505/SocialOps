"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash, Loader2, Clock, Calendar } from "lucide-react";
import { deleteRoutine } from "@/actions/routines";
import { RoutineDialog } from "./routine-dialog";

interface StaffMember {
    user: {
        id: string;
        name: string | null;
        email: string;
    };
    role_name: string;
}

type Routine = {
    id: string;
    title: string;
    frequency: { days: string[]; time: string };
    created_at: string;
};

interface RoutineListProps {
    clientId: string;
    routines: Routine[];
    staffMembers: StaffMember[];
}

export function RoutineList({ clientId, routines, staffMembers }: RoutineListProps) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = (routineId: string) => {
        if (confirm("このルーチンを削除してもよろしいですか？")) {
            startTransition(async () => {
                await deleteRoutine(routineId, clientId);
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">ルーチン設定</h3>
                <RoutineDialog clientId={clientId} staffMembers={staffMembers} />
            </div>

            {routines.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8 border rounded-md border-dashed">
                    ルーチンが設定されていません。
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {routines.map((routine) => (
                        <Card key={routine.id}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {routine.title}
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-red-600"
                                    onClick={() => handleDelete(routine.id)}
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash className="h-4 w-4" />
                                    )}
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
                                    <div className="flex items-center">
                                        <Clock className="mr-2 h-4 w-4" />
                                        {routine.frequency?.time || "時間未設定"}
                                    </div>
                                    <div className="flex items-center">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        <div className="flex flex-wrap gap-1">
                                            {Array.isArray(routine.frequency?.days)
                                                ? routine.frequency.days.join(", ")
                                                : "曜日未設定"}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
