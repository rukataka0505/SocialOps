'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';

export async function createTeam(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;

    if (!name) {
        throw new Error('チーム名を入力してください');
    }

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('認証されていません');
    }

    // 1. Create Team
    const { data: team, error: teamError } = await (supabase
        .from('teams') as any)
        .insert({
            name,
            owner_id: user.id,
            invite_code: nanoid(12),
        })
        .select()
        .single();

    if (teamError) {
        console.error('Team creation failed:', teamError);
        throw new Error('チームの作成に失敗しました');
    }

    // 2. Add User as Owner
    const { error: memberError } = await (supabase
        .from('team_members') as any)
        .insert({
            team_id: team.id,
            user_id: user.id,
            role: 'owner',
        });

    if (memberError) {
        console.error('Member addition failed:', memberError);
        // Rollback (delete team) if member creation fails
        await supabase.from('teams').delete().eq('id', team.id);
        throw new Error('チームメンバーの追加に失敗しました');
    }

    revalidatePath('/dashboard');
    return { teamId: team.id };
}
