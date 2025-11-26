"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type AuthState = {
    error?: string;
    success?: boolean;
};

/**
 * Login with email and password
 */
export async function login(
    prevState: AuthState | null,
    formData: FormData
): Promise<AuthState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const next = formData.get("next") as string;

    if (!email || !password) {
        return { error: "メールアドレスとパスワードを入力してください" };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: "ログインに失敗しました。メールアドレスまたはパスワードが正しくありません。" };
    }

    revalidatePath("/", "layout");
    redirect(next || "/");
}

/**
 * Sign up with email and password
 */
export async function signup(
    prevState: AuthState | null,
    formData: FormData
): Promise<AuthState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const next = formData.get("next") as string;

    if (!email || !password) {
        return { error: "メールアドレスとパスワードを入力してください" };
    }

    if (password.length < 6) {
        return { error: "パスワードは6文字以上で入力してください" };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        },
    });

    if (error) {
        if (error.message.includes("already registered")) {
            return { error: "このメールアドレスは既に登録されています" };
        }
        return { error: `登録に失敗しました: ${error.message}` };
    }

    revalidatePath("/", "layout");
    redirect(next || "/");
}

/**
 * Sign out
 */
export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/login");
}
