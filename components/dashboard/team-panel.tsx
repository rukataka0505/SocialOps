'use client';

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MemberDetail } from "@/components/dashboard/member-detail";
import { cn } from "@/lib/utils";
import { Menu, Users, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface TeamPanelProps {
    members: any[];
    currentUserRole?: string;
}

export function TeamPanel({ members, currentUserRole }: TeamPanelProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <aside
            className={cn(
                "h-full border-l border-slate-100 bg-white shadow-sm transition-all duration-300 ease-in-out flex flex-col z-10",
                isOpen ? "w-80" : "w-16"
            )}
        >
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className={cn(
                    "flex items-center h-16 border-b border-slate-100",
                    isOpen ? "px-4 justify-between" : "justify-center"
                )}>
                    {isOpen ? (
                        <>
                            <div className="flex items-center gap-2 font-bold text-slate-800">
                                <span className="w-1 h-4 bg-blue-500 rounded-full" />
                                <span>Members</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {(currentUserRole === 'admin' || currentUserRole === 'owner') && (
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href="/team/members">メンバー管理</Link>
                                    </Button>
                                )}
                                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                    <ChevronRight className="h-4 w-4 text-slate-500" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
                            <Menu className="h-4 w-4 text-slate-500" />
                        </Button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {!isOpen ? (
                        // Collapsed State
                        <div className="flex flex-col items-center py-4 gap-4">
                            <div className="p-2 rounded-lg bg-slate-50 text-slate-400">
                                <Users className="h-5 w-5" />
                            </div>
                            {/* Optional: Show avatars in collapsed mode if desired, or just keep it minimal as requested */}
                        </div>
                    ) : (
                        // Expanded State
                        <div className="flex flex-col h-full">


                            {/* Members List */}
                            <ScrollArea className="flex-1">
                                <div className="p-2 space-y-1">
                                    {members.map((member) => {
                                        if (!member || !member.user) return null;
                                        return (
                                            <MemberDetail key={member.user.id} member={member} currentUserRole={currentUserRole}>
                                                <div className="flex items-center gap-3 p-2.5 hover:bg-blue-50/50 rounded-xl cursor-pointer transition-all group">
                                                    <Avatar className="h-9 w-9 border border-slate-100 group-hover:border-blue-200 transition-colors">
                                                        <AvatarImage src={member.user.avatar_url || ""} />
                                                        <AvatarFallback className="bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600">
                                                            {member.user.name?.[0] || "?"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="overflow-hidden">
                                                        <p className="text-sm font-medium leading-none truncate text-slate-700 group-hover:text-blue-700">
                                                            {member.user.name || member.user.email}
                                                        </p>
                                                        <p className="text-xs text-slate-400 capitalize mt-1 group-hover:text-blue-400">
                                                            {member.role}
                                                        </p>
                                                    </div>
                                                </div>
                                            </MemberDetail>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
