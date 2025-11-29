import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getTeamMembers } from '@/actions/teams';
import { getCurrentTeamId } from '@/lib/team-utils';
import { InviteMemberDialog } from '@/components/team/invite-member-dialog';
import { MemberList } from '@/components/team/member-list';
import { redirect } from 'next/navigation';

export default async function TeamMembersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const teamId = await getCurrentTeamId(supabase);
    if (!teamId) {
        redirect('/');
    }

    // Fetch data
    const members = await getTeamMembers(teamId);

    // Get current user's role
    const currentUserMember = members.find((m: any) => m.user.id === user.id);
    const currentUserRole = currentUserMember?.role || 'member';

    return (
        <div className="container mx-auto py-8 max-w-5xl space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">メンバー管理</h2>
                    <p className="text-muted-foreground">
                        チームのメンバーを管理します。
                    </p>
                </div>
                <InviteMemberDialog teamId={teamId} />
            </div>

            <div className="space-y-4">
                <MemberList
                    members={members}
                    currentUserId={user.id}
                    currentUserRole={currentUserRole}
                />
            </div>
        </div>
    );
}
