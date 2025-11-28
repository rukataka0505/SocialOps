import { createClient } from '@/lib/supabase/server';
import { getTeamMembers } from '@/actions/teams';
import { GuestSection } from '@/app/(dashboard)/settings/team/guest-section';
import { redirect } from 'next/navigation';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, ArrowLeft } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default async function MemberManagementPage() {
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
        .select('team_id, role, team:teams(name)')
        .eq('user_id', user.id)
        .single();

    const membership = membershipData as { team_id: string; role: string; team: { name: string } } | null;

    if (!membership) {
        return <div>チームに所属していません。</div>;
    }

    // Access Control: Only Admin/Owner
    if (membership.role !== 'owner' && membership.role !== 'admin') {
        redirect('/dashboard');
    }

    const members = await getTeamMembers(membership.team_id);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/dashboard">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold">メンバー管理</h1>
            </div>

            <div className="grid gap-8">
                {/* Member List */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">メンバー一覧</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b">
                                    <th className="pb-2 font-medium text-gray-500">名前</th>
                                    <th className="pb-2 font-medium text-gray-500">メールアドレス</th>
                                    <th className="pb-2 font-medium text-gray-500 flex items-center gap-1">
                                        権限
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <HelpCircle className="w-4 h-4 text-gray-400" />
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-xs">
                                                    <div className="space-y-2 text-xs">
                                                        <div>
                                                            <span className="font-bold block">Admin / Owner</span>
                                                            チーム設定、メンバー招待、権限管理、ゲスト管理
                                                        </div>
                                                        <div>
                                                            <span className="font-bold block">Member</span>
                                                            タスク管理のみ（設定変更不可）
                                                        </div>
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {members.map((member) => (
                                    <tr key={member.user.id} className="group">
                                        <td className="py-3 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                {member.user.avatar_url ? (
                                                    <img
                                                        src={member.user.avatar_url}
                                                        alt={member.user.name || ''}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-medium text-gray-500">
                                                        {(member.user.name || member.user.email || '?')[0].toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <span>{member.user.name || '未設定'}</span>
                                        </td>
                                        <td className="py-3 text-gray-600">{member.user.email}</td>
                                        <td className="py-3">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {member.role}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Guest Section */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">ゲストメンバー管理</h2>
                    <p className="text-gray-600 mb-4">
                        アカウント不要のゲストメンバーを追加できます。
                        名前を入力するだけで専用のアクセスURLが発行されます。
                    </p>
                    <GuestSection teamId={membership.team_id} />
                </div>
            </div>
        </div>
    );
}
