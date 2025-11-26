'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;

    if (!name) {
        throw new Error('Name is required');
    }

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    // Update public.users table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('users') as any)
        .update({ name })
        .eq('id', user.id);

    if (error) {
        console.error('Error updating profile:', error);
        throw new Error('Failed to update profile');
    }

    // Also update user_metadata for immediate feedback in some cases, 
    // though our primary source of truth for display should be consistent.
    // Supabase Auth `updateUser` updates the JWT metadata.
    await supabase.auth.updateUser({
        data: { full_name: name, name: name }
    });

    revalidatePath('/');
    return { success: true };
}
