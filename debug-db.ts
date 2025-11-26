
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Using anon key for now, might need service role if RLS blocks

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('Checking data...');

    // 1. Get a user (we might need to sign in or use service role, but let's try anon first with a known user if possible, or just list generic data if RLS allows)
    // Actually, without a session, RLS will likely block reading 'team_members' or 'users' if they are private.
    // I should use the SERVICE_ROLE_KEY if available in .env.local to bypass RLS for debugging.
}

// Re-creating client with service role if possible
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminSupabase = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : supabase;

async function debug() {
    if (!serviceRoleKey) {
        console.warn("No SUPABASE_SERVICE_ROLE_KEY found. RLS might block queries.");
    }

    // 1. Check users table
    const { data: users, error: usersError } = await adminSupabase.from('users').select('*').limit(5);
    if (usersError) console.error('Error fetching users:', usersError);
    else console.log('Public Users:', users);

    // 2. Check team_members
    const { data: members, error: membersError } = await adminSupabase.from('team_members').select('*').limit(5);
    if (membersError) console.error('Error fetching team_members:', membersError);
    else console.log('Team Members:', members);

    if (members && members.length > 0) {
        const teamId = members[0].team_id;
        console.log(`Checking getTeamMembers for team ${teamId}...`);

        const { data: teamMembers, error: tmError } = await adminSupabase
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

        if (tmError) console.error('Error in join query:', tmError);
        else console.log('Join Result:', JSON.stringify(teamMembers, null, 2));
    }
}

debug();
