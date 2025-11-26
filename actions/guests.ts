'use server';

import { createClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';

/**
 * Create a guest user (account-less member)
 * Generates a unique access token for URL-based authentication
 */
export async function createGuest(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // Get current user's team and verify permissions
    const { data: memberData } = await supabase
        .from('team_members')
        .select('team_id, role')
        .eq('user_id', user.id)
        .single();

    const member = memberData as { team_id: string; role: string } | null;

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
        throw new Error('Permission denied: Only owners and admins can create guest users');
    }

    // Extract form data
    const name = formData.get('name') as string;
    const role = (formData.get('role') as string) || 'member';

    if (!name || name.trim().length === 0) {
        throw new Error('Name is required');
    }

    // Generate guest user ID and dummy email
    const guestUserId = crypto.randomUUID();
    const dummyEmail = `guest-${guestUserId}@socialops.local`;

    // Create user record
    const { error: userError } = await (supabase.from('users') as any).insert({
        id: guestUserId,
        email: dummyEmail,
        name: name.trim(),
    });

    if (userError) {
        console.error('Error creating guest user:', userError);
        throw new Error('Failed to create guest user');
    }

    // Generate secure access token
    const accessToken = nanoid(32);

    // Create team member record with access token
    const { error: memberError } = await (supabase.from('team_members') as any).insert({
        team_id: member.team_id,
        user_id: guestUserId,
        role: role as 'owner' | 'admin' | 'member',
        access_token: accessToken,
    });

    if (memberError) {
        console.error('Error creating team member:', memberError);
        // Cleanup: delete the user record we just created
        await supabase.from('users').delete().eq('id', guestUserId);
        throw new Error('Failed to add guest to team');
    }

    revalidatePath('/settings/team');

    return {
        success: true,
        guestId: guestUserId,
        accessToken,
        name: name.trim(),
    };
}

/**
 * Get all guest users for the current user's team
 * Returns users with access_token (indicating they are guests)
 */
export async function getGuests() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // Get current user's team
    const { data: memberData } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .single();

    const member = memberData as { team_id: string } | null;

    if (!member) {
        return [];
    }

    // Get all team members with access tokens (guests)
    const { data: guests, error } = await supabase
        .from('team_members')
        .select(`
            id,
            role,
            access_token,
            user:users (
                id,
                name,
                email
            )
        `)
        .eq('team_id', member.team_id)
        .not('access_token', 'is', null);

    if (error) {
        console.error('Error fetching guests:', error);
        return [];
    }

    return guests as any[];
}

/**
 * Revoke guest access by regenerating their access token
 * This invalidates the old URL while keeping the user record
 */
export async function revokeGuestAccess(memberId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // Verify current user has admin/owner permissions
    const { data: currentMemberData } = await supabase
        .from('team_members')
        .select('team_id, role')
        .eq('user_id', user.id)
        .single();

    const currentMember = currentMemberData as { team_id: string; role: string } | null;

    if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'admin')) {
        throw new Error('Permission denied');
    }

    // Generate new access token
    const newToken = nanoid(32);

    // Update the team member's access token
    const { error } = await (supabase.from('team_members') as any)
        .update({ access_token: newToken })
        .eq('id', memberId)
        .eq('team_id', currentMember.team_id);

    if (error) {
        console.error('Error revoking guest access:', error);
        throw new Error('Failed to revoke access');
    }

    revalidatePath('/settings/team');

    return { success: true, newToken };
}

/**
 * Delete a guest user completely
 * Removes both the team member and user records
 */
export async function deleteGuest(memberId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // Verify current user has admin/owner permissions
    const { data: currentMemberData } = await supabase
        .from('team_members')
        .select('team_id, role')
        .eq('user_id', user.id)
        .single();

    const currentMember = currentMemberData as { team_id: string; role: string } | null;

    if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'admin')) {
        throw new Error('Permission denied');
    }

    // Get the guest's user_id before deleting
    const { data: guestMemberData } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('id', memberId)
        .eq('team_id', currentMember.team_id)
        .single();

    const guestMember = guestMemberData as { user_id: string } | null;

    if (!guestMember) {
        throw new Error('Guest not found');
    }

    // Delete team member record
    const { error: memberError } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)
        .eq('team_id', currentMember.team_id);

    if (memberError) {
        console.error('Error deleting team member:', memberError);
        throw new Error('Failed to delete guest');
    }

    // Delete user record (only if it's a guest - has dummy email)
    const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', guestMember.user_id)
        .single();

    const userRecord = userData as { email: string } | null;

    if (userRecord && userRecord.email.includes('@socialops.local')) {
        await supabase.from('users').delete().eq('id', guestMember.user_id);
    }

    revalidatePath('/settings/team');

    return { success: true };
}
