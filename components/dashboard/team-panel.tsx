import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemberDetail } from "@/components/dashboard/member-detail";

interface TeamPanelProps {
    members: any[];
    currentUserRole?: string;
}

export function TeamPanel({ members, currentUserRole }: TeamPanelProps) {
    return (
        <Card className="h-full border-l rounded-none border-y-0 border-r-0 shadow-none bg-slate-50/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Members</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {members.map((member, index) => {
                        // Guard: Skip if member or user data is missing
                        if (!member || !member.user) {
                            console.warn('Missing user data for member at index:', index, member);
                            return (
                                <div key={`unknown-${index}`} className="flex items-center gap-3 p-2 bg-yellow-50 rounded-md border border-yellow-200">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>?</AvatarFallback>
                                    </Avatar>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium leading-none truncate text-yellow-700">Unknown User</p>
                                        <p className="text-xs text-yellow-600 capitalize mt-1">{member?.role || 'member'}</p>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <MemberDetail key={member.user.id} member={member} currentUserRole={currentUserRole}>
                                <div className="flex items-center gap-3 p-2 hover:bg-white rounded-md cursor-pointer transition-all border border-transparent hover:border-slate-200 hover:shadow-sm">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={member.user.avatar_url || ""} />
                                        <AvatarFallback>{member.user.name?.[0] || "?"}</AvatarFallback>
                                    </Avatar>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium leading-none truncate">{member.user.name || member.user.email}</p>
                                        <p className="text-xs text-muted-foreground capitalize mt-1">{member.role}</p>
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
