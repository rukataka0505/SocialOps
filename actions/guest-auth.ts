'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Get guest info without setting cookies (for initial page load)
 */
export async function getGuestInfo(token: string) {
    const supabase = await createClient();

    // Query team_members to find the token
    const { data: member, error } = await supabase
        .from('team_members')
        .select(`
            id,
            team_id,
            user_id,
            role,
            user:users (
                name,
                email
            ),
            team:teams (
                name
            )
        `)
        .eq('access_token', token)
        .single();

    const memberData = member as {
        user: { name: string | null; email: string };
        team: { name: string };
    } | null;

    if (error || !memberData) {
        return { error: 'Invalid or expired token' };
    }

    return {
        success: true,
        user: memberData.user,
        teamName: memberData.team.name
    };
}

/**
 * Join as guest - sets cookie and redirects (called on form submit)
 */
export async function joinGuest(formData: FormData) {
    const token = formData.get('token') as string;
    const name = formData.get('name') as string;

    if (!token || !name) {
        throw new Error('Token and name are required');
    }

    const supabase = await createClient();

    // Verify token is still valid
    const { data: member, error } = await supabase
        .from('team_members')
        .select('id, user_id, team_id')
        .eq('access_token', token)
        .single();

    const memberData = member as { id: string; user_id: string; team_id: string } | null;

    if (error || !memberData) {
        throw new Error('Invalid or expired token');
    }

    // Update user's name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from('users') as any)
        .update({ name })
        .eq('id', memberData.user_id);

    if (updateError) {
        console.error('Error updating user name:', updateError);
        throw new Error('Failed to update profile');
    }

    // Set HttpOnly cookie for guest session
    const cookieStore = await cookies();
    cookieStore.set('socialops-guest-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
    });

    // Redirect to dashboard
    redirect('/');
}
