'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Verify guest token and create session
 */
export async function verifyAndLoginGuest(token: string) {
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

    // Set HttpOnly cookie for guest session
    // Valid for 30 days
    const cookieStore = await cookies();
    cookieStore.set('socialops-guest-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
    });

    // Redirect to dashboard
    // redirect('/');

    return {
        success: true,
        user: memberData.user,
        teamName: memberData.team.name
    };
}
