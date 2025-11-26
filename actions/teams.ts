'use server';

import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';
import { addDays, isPast } from 'date-fns';
import { redirect } from 'next/navigation';

export async function createInvitation(teamId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // Check if user is owner or admin of the team
    const { data: member } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .single();

    const memberRole = member as { role: string } | null;

    if (!memberRole || (memberRole.role !== 'owner' && memberRole.role !== 'admin')) {
        throw new Error('Permission denied');
    }

    const token = nanoid(12);
    const expiresAt = addDays(new Date(), 7).toISOString();

    // Cast to any to bypass 'never' type inference issue
    const { error } = await (supabase.from('team_invitations') as any).insert({
        team_id: teamId,
        token,
        expires_at: expiresAt,
        created_by: user.id,
    });

    if (error) {
        console.error('Error creating invitation:', error);
        throw new Error('Failed to create invitation');
    }

    return { token };
}

export async function getInvitation(token: string) {
    const supabase = await createClient();

    const { data: invitation, error } = await supabase
        .from('team_invitations')
        .select(`
      *,
      team:teams (
        name
      )
    `)
        .eq('token', token)
        .single();

    if (error || !invitation) {
        return null;
    }

    const inv = invitation as any;

    if (isPast(new Date(inv.expires_at))) {
        return null;
    }

    if (inv.max_uses && (inv.used_count || 0) >= inv.max_uses) {
        return null;
    }

    return inv;
}

export async function joinTeam(token: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/login?next=/invite/${token}`);
    }

    const invitation = await getInvitation(token);

    if (!invitation) {
        throw new Error('Invalid or expired invitation');
    }

    // Check if already a member
    const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', invitation.team_id)
        .eq('user_id', user.id)
        .single();

    if (existingMember) {
        // Already a member, just redirect
        return { success: true, teamId: invitation.team_id };
    }

    // Add to team members
    // Cast to any to bypass 'never' type inference issue
    const { error: joinError } = await (supabase.from('team_members') as any).insert({
        team_id: invitation.team_id,
        user_id: user.id,
        role: (invitation.role || 'member') as 'member' | 'admin' | 'owner',
    });

    if (joinError) {
        console.error('Error joining team:', joinError);
        throw new Error('Failed to join team');
    }

    // Increment used count
    await (supabase.from('team_invitations') as any)
        .update({ used_count: (invitation.used_count || 0) + 1 })
        .eq('id', invitation.id);

    return { success: true, teamId: invitation.team_id };
}

export async function getTeamMembers(teamId: string) {
    const supabase = await createClient();

    const { data: members, error } = await supabase
        .from('team_members')
        .select(`
      role,
      user:users (
        id,
        email,
        name,
        avatar_url
      )
    `)
        .eq('team_id', teamId);

    if (error) {
        console.error('Error fetching team members:', error);
        return [];
    }

    return members as any[];
}
import { revalidatePath } from 'next/cache';

export async function updateMemberRole(userId: string, role: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    try {
        // Get team_id of the current user
        const { data: currentUserMember } = await supabase
            .from('team_members')
            .select('team_id, role')
            .eq('user_id', user.id)
            .single();

        if (!currentUserMember) throw new Error('No team found');

        // Only owner or admin can update roles
        const currentUserRole = (currentUserMember as any).role;
        if (currentUserRole !== 'owner' && currentUserRole !== 'admin') {
            throw new Error('Permission denied');
        }

        // Update target user's role
        const { error } = await (supabase.from('team_members') as any)
            .update({ role })
            .eq('user_id', userId)
            .eq('team_id', (currentUserMember as any).team_id);

        if (error) throw error;

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Error updating member role:', error);
        return { success: false, error };
    }
}
