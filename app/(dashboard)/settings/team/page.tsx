import { createClient } from '@/lib/supabase/server';
import { getTeamMembers, getTeamSettings } from '@/actions/teams';
import { GuestSection } from './guest-section';
import { TeamProfileSection } from './team-profile-section';
import { TaskSettings } from '@/components/settings/task-settings';
import { redirect } from 'next/navigation';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

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
    const settings = await getTeamSettings();

    return (
        <div className="max-w-4xl mx-auto p-6">


            <div className="grid gap-8">
                {/* Team Profile */}
                {(membership.role === 'owner' || membership.role === 'admin') && (
                    <TeamProfileSection
                        teamId={membership.team_id}
                        initialName={membership.team?.name || ''}
                    />
                )}

                {/* Task Settings */}
                {(membership.role === 'owner' || membership.role === 'admin') && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-4">タスク設定</h2>
                        <TaskSettings initialSettings={settings} />
                    </div>
                )}
            </div>
        </div>
    );
}

