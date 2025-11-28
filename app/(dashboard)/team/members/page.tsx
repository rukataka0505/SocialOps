import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { getTeamMembers } from '@/actions/teams';
import { getGuests } from '@/actions/guests';
import { getCurrentTeamId } from '@/lib/team-utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InviteMemberDialog } from '@/components/team/invite-member-dialog';
import { InviteGuestDialog } from '@/components/team/invite-guest-dialog';
import { MemberList } from '@/components/team/member-list';
import { GuestList } from '@/components/team/guest-list';
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
    const guests = await getGuests();

    // Get current user's role
    const currentUserMember = members.find((m: any) => m.user.id === user.id);
    const currentUserRole = currentUserMember?.role || 'member';

    return (
        <div className="container mx-auto py-8 max-w-5xl space-y-8">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">メンバー管理</h2>
                <p className="text-muted-foreground">
                    チームのメンバーとゲストアクセスを管理します。
                </p>
            </div>

            <Tabs defaultValue="members" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="members">チームメンバー</TabsTrigger>
                    <TabsTrigger value="guests">ゲストアクセス</TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">正規メンバー</h3>
                            <p className="text-sm text-muted-foreground">
                                アカウントを持つ正規のチームメンバーです。
                            </p>
                        </div>
                        <InviteMemberDialog teamId={teamId} />
                    </div>
                    <MemberList
                        members={members}
                        currentUserId={user.id}
                        currentUserRole={currentUserRole}
                    />
                </TabsContent>

                <TabsContent value="guests" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">ゲストアクセス</h3>
                            <p className="text-sm text-muted-foreground">
                                URLのみでアクセス可能なゲストユーザーです。
                            </p>
                        </div>
                        <InviteGuestDialog />
                    </div>
                    <GuestList guests={guests} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
