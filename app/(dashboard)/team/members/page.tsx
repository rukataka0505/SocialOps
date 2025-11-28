import { createClient } from '@/lib/supabase/server';
import { getTeamMembers } from '@/actions/teams';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MemberDetail } from "@/components/dashboard/member-detail";
import { InviteMemberDialog } from "@/components/dashboard/invite-member-dialog";
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export default async function TeamMembersPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get user's team
    const { data: membershipData } = await supabase
        .from('team_members')
        .select('team_id, role')
        .eq('user_id', user.id)
        .single();

    const membership = membershipData as { team_id: string; role: string } | null;

    if (!membership) {
        return <div>チームに所属していません。</div>;
    }

    // Check permission
    if (membership.role !== 'admin' && membership.role !== 'owner') {
        return <div>アクセス権限がありません。</div>;
    }

    const members = await getTeamMembers(membership.team_id);

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">メンバー管理</h1>
                    <p className="text-slate-500 mt-1">チームメンバーの権限管理やタスク状況の確認ができます。</p>
                </div>
                <InviteMemberDialog teamId={membership.team_id} />
            </div>

            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="py-4 px-6 font-medium text-slate-500 text-sm">名前</th>
                                <th className="py-4 px-6 font-medium text-slate-500 text-sm">メールアドレス</th>
                                <th className="py-4 px-6 font-medium text-slate-500 text-sm">権限</th>
                                <th className="py-4 px-6 font-medium text-slate-500 text-sm">参加日</th>
                                <th className="py-4 px-6 font-medium text-slate-500 text-sm text-right">詳細</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {members.map((member) => (
                                <tr key={member.user.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border border-slate-100">
                                                <AvatarImage src={member.user.avatar_url || ""} />
                                                <AvatarFallback className="bg-slate-100 text-slate-500">
                                                    {member.user.name?.[0] || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-slate-900">{member.user.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-slate-600 text-sm">
                                        {member.user.email}
                                    </td>
                                    <td className="py-4 px-6">
                                        <Badge variant="outline" className="capitalize font-normal">
                                            {member.role}
                                        </Badge>
                                    </td>
                                    <td className="py-4 px-6 text-slate-500 text-sm">
                                        {format(new Date(member.created_at), 'yyyy/MM/dd', { locale: ja })}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <MemberDetail member={member} currentUserRole={membership.role}>
                                            <Button variant="ghost" size="sm">
                                                詳細を見る
                                            </Button>
                                        </MemberDetail>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
