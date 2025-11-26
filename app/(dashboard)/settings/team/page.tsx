import { createClient } from '@/lib/supabase/server';
import { getTeamMembers, getTeamSettings } from '@/actions/teams';
import { GuestSection } from './guest-section';
import { TeamProfileSection } from './team-profile-section';
import { redirect } from 'next/navigation';

export default async function TeamSettingsPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get user's team
    // For now, assuming single team per user or picking the first one
    const { data: membershipData } = await supabase
        .from('team_members')
        .select('team_id, role, team:teams(name)')
        .eq('user_id', user.id)
        .single();

    const membership = membershipData as { team_id: string; role: string; team: { name: string } } | null;

    if (!membership) {
        return <div>チームに所属していません。</div>;
    }

    const members = await getTeamMembers(membership.team_id);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">チーム設定</h1>

            <div className="grid gap-8">
                {/* Team Profile */}
                {(membership.role === 'owner' || membership.role === 'admin') && (
                    <TeamProfileSection
                        teamId={membership.team_id}
                        initialName={membership.team?.name || ''}
                    />
                )}

                {/* Member List */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">メンバー一覧</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b">
                                    <th className="pb-2 font-medium text-gray-500">名前</th>
                                    <th className="pb-2 font-medium text-gray-500">メールアドレス</th>
                                    <th className="pb-2 font-medium text-gray-500">権限</th>
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
                {(membership.role === 'owner' || membership.role === 'admin') && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">ゲストメンバー管理</h2>
                        <p className="text-gray-600 mb-4">
                            アカウント不要のゲストメンバーを追加できます。
                            名前を入力するだけで専用のアクセスURLが発行されます。
                        </p>
                        <GuestSection teamId={membership.team_id} />
                    </div>
                )}
            </div>
        </div>
    );
}

