'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemberDetail } from "@/components/dashboard/member-detail";

interface TeamPanelProps {
    members: any[];
    currentUserRole?: string;
}

export function TeamPanel({ members, currentUserRole }: TeamPanelProps) {
    return (
        <Card className="h-full border-none rounded-none shadow-none bg-white">
            <CardHeader className="pb-4 pt-6 px-6">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full" />
                    Members
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
                <div className="space-y-1">
                    {members.map((member, index) => {
                        // Guard: Skip if member or user data is missing
                        if (!member || !member.user) {
                            return null;
                        }

                        return (
                            <MemberDetail key={member.user.id} member={member} currentUserRole={currentUserRole}>
                                <div className="flex items-center gap-3 p-2.5 hover:bg-blue-50/50 rounded-xl cursor-pointer transition-all group">
                                    <Avatar className="h-9 w-9 border border-slate-100 group-hover:border-blue-200 transition-colors">
                                        <AvatarImage src={member.user.avatar_url || ""} />
                                        <AvatarFallback className="bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600">{member.user.name?.[0] || "?"}</AvatarFallback>
                                    </Avatar>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium leading-none truncate text-slate-700 group-hover:text-blue-700">{member.user.name || member.user.email}</p>
                                        <p className="text-xs text-slate-400 capitalize mt-1 group-hover:text-blue-400">{member.role}</p>
                                    </div>
                                </div>
                            </MemberDetail>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
