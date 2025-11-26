"use client";

import { useState } from "react";
import { StaffMember, assignStaff, updateStaffRole, removeStaff } from "@/actions/staffing";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface StaffSectionProps {
    clientId: string;
    staff: StaffMember[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    teamMembers: any[]; // Type from actions/teams
}

export function StaffSection({ clientId, staff, teamMembers }: StaffSectionProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [selectedRole, setSelectedRole] = useState("Editor");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleAddStaff = async () => {
        if (!selectedUserId || !selectedRole) return;
        setIsSubmitting(true);
        try {
            await assignStaff(clientId, selectedUserId, selectedRole);
            setIsDialogOpen(false);
            setSelectedUserId("");
            setSelectedRole("Editor");
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to add staff");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveStaff = async (staffId: string) => {
        if (!confirm("本当に削除しますか？")) return;
        try {
            await removeStaff(staffId);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to remove staff");
        }
    };

    const handleRoleChange = async (staffId: string, newRole: string) => {
        try {
            await updateStaffRole(staffId, newRole);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to update role");
        }
    };

    // Filter out users who are already staff
    const availableMembers = teamMembers.filter(
        (member) => !staff.some((s) => s.user.id === member.user.id)
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-medium">担当チーム</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            担当者を追加
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>担当者を追加</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="user">チームメンバー</Label>
                                <select
                                    id="user"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                >
                                    <option value="" disabled>選択してください</option>
                                    {availableMembers.map((member) => (
                                        <option key={member.user.id} value={member.user.id}>
                                            {member.user.name || member.user.email}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="role">役割</Label>
                                <select
                                    id="role"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                >
                                    <option value="Director">Director</option>
                                    <option value="Editor">Editor</option>
                                    <option value="Planner">Planner</option>
                                    <option value="Analyst">Analyst</option>
                                    <option value="Designer">Designer</option>
                                </select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAddStaff} disabled={!selectedUserId || isSubmitting}>
                                追加
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-3">
                {staff.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted overflow-hidden">
                                {s.user.avatar_url ? (
                                    <img src={s.user.avatar_url} alt={s.user.name || ""} className="h-full w-full object-cover" />
                                ) : (
                                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                                )}
                            </div>
                            <div>
                                <div className="font-medium text-sm">{s.user.name || s.user.email}</div>
                                <div className="text-xs text-muted-foreground">
                                    <select
                                        value={s.role_name}
                                        onChange={(e) => handleRoleChange(s.id, e.target.value)}
                                        className="bg-transparent border-none p-0 h-auto text-xs focus:ring-0 cursor-pointer hover:underline text-muted-foreground"
                                    >
                                        <option value="Director">Director</option>
                                        <option value="Editor">Editor</option>
                                        <option value="Planner">Planner</option>
                                        <option value="Analyst">Analyst</option>
                                        <option value="Designer">Designer</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveStaff(s.id)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                    </div>
                ))}
                {staff.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
                        担当者はまだ割り当てられていません
                    </div>
                )}
            </div>
        </div>
    );
}
