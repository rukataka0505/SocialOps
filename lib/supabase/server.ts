import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/**
 * Supabase Client for Server Components and Server Actions
 * Use this in server-side code (Server Components, Route Handlers, Server Actions)
 */
export async function createClient() {
    const cookieStore = await cookies();

    const client = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );

    // Development Bypass Logic
    if (process.env.NEXT_PUBLIC_DEV_BYPASS === 'true' && process.env.NEXT_PUBLIC_MOCK_USER_ID) {
        const originalGetUser = client.auth.getUser.bind(client.auth);
        client.auth.getUser = async () => {
            const { data, error } = await originalGetUser();

            if (data.user) {
                return { data, error };
            }

            // Inject mock user if no real user exists
            return {
                data: {
                    user: {
                        id: process.env.NEXT_PUBLIC_MOCK_USER_ID!,
                        app_metadata: {},
                        user_metadata: {},
                        aud: 'authenticated',
                        created_at: new Date().toISOString(),
                        email: 'dev-bypass@localhost',
                        phone: '',
                        role: 'authenticated',
                        updated_at: new Date().toISOString(),
                        url: '',
                        confirmed_at: new Date().toISOString(),
                        email_confirmed_at: new Date().toISOString(),
                        last_sign_in_at: new Date().toISOString(),
                        factors: [],
                        identities: [],
                        is_anonymous: false,
                    }
                },
                error: null
            } as any;
        };
    }

    // Guest User Logic
    const guestToken = cookieStore.get('socialops-guest-token');
    if (guestToken) {
        const originalGetUser = client.auth.getUser.bind(client.auth);

        // We need to fetch the guest user details
        // Since we can't make async calls inside the synchronous-looking createClient return,
        // we'll override getUser to perform the fetch on demand.
        client.auth.getUser = async () => {
            // First check if there's a real auth session
            const { data: realAuth, error: realError } = await originalGetUser();
            if (realAuth.user) {
                return { data: realAuth, error: realError };
            }

            // If no real session, try to find guest user
            const { data: member } = await client
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
                .eq('access_token', guestToken.value)
                .single();

            if (member && (member as any).user) {
                const user = (member as any).user;
                // Mock the user object
                return {
                    data: {
                        user: {
                            id: user.id,
                            email: user.email,
                            app_metadata: {
                                provider: 'guest',
                                providers: ['guest']
                            },
                            user_metadata: {
                                name: user.name,
                                avatar_url: user.avatar_url,
                                role: (member as any).role // Store role in metadata for easy access
                            },
                            aud: 'authenticated',
                            created_at: new Date().toISOString(),
                            role: 'authenticated',
                            updated_at: new Date().toISOString(),
                        }
                    },
                    error: null
                } as any;
            }

            return { data: { user: null }, error: null };
        };
    }

    return client;
}
