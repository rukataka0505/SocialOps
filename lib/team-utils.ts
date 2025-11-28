import { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const TEAM_COOKIE_NAME = 'current_team_id';

/**
 * Get the current team ID for the user.
 * 1. Checks 'current_team_id' cookie.
 * 2. Verifies user is a member of that team.
 * 3. If invalid/missing, fetches user's first team.
 * 4. Sets cookie and returns ID.
 * 5. Returns null if no teams found.
 */
export async function getCurrentTeamId(supabase: SupabaseClient): Promise<string | null> {
    const cookieStore = await cookies();
    const cookieTeamId = cookieStore.get(TEAM_COOKIE_NAME)?.value;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return null;

    // If cookie exists, verify membership
    if (cookieTeamId) {
        const { data: member } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)
            .eq('team_id', cookieTeamId)
            .maybeSingle();

        if (member) {
            return member.team_id;
        }
    }

    // If no cookie or invalid, fetch first team
    const { data: firstTeamMember } = await supabase
        .from('team_members')
        .select('team_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

    if (firstTeamMember) {
        // Set cookie for future requests
        cookieStore.set(TEAM_COOKIE_NAME, firstTeamMember.team_id, {
            path: '/',
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        });
        return firstTeamMember.team_id;
    }

    return null;
}
