"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies, headers } from "next/headers";
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
        console.error('Login error:', error);
        if (error.message.includes("Email not confirmed")) {
            return { error: "メールアドレスの確認が完了していません。受信トレイを確認してください。" };
        }
        if (error.message.includes("Invalid login credentials")) {
            return { error: "メールアドレスまたはパスワードが間違っています。" };
        }
        return { error: `ログインに失敗しました: ${error.message}` };
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

    // headers() is async in Next.js 15, but we can import it dynamically or await it if the project version supports it.
    // Assuming Next.js 15 based on README "Next.js 15 (App Router)".
    // However, headers() is a function that returns a ReadonlyHeaders interface in older versions or a Promise in newer.
    // Let's check imports. We need to import headers.

    if (!email || !password) {
        return { error: "メールアドレスとパスワードを入力してください" };
    }

    if (password.length < 6) {
        return { error: "パスワードは6文字以上で入力してください" };
    }

    const supabase = await createClient();

    // Get origin for redirect
    // In server actions, we can use headers()
    const headersList = await headers();
    const origin = headersList.get('origin');

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/confirm`,
        },
    });

    if (error) {
        console.error('Signup error:', error);
        if (error.message.includes("already registered")) {
            return { error: "このメールアドレスは既に登録されています" };
        }
        return { error: `登録に失敗しました: ${error.message}` };
    }

    // Instead of logging in, redirect to verification page
    redirect("/auth/verify-email");
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
