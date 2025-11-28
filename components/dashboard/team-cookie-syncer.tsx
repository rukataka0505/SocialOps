'use client';

import { useEffect } from 'react';

export function TeamCookieSyncer({ teamId }: { teamId: string }) {
    useEffect(() => {
        // If the cookie is missing or different, set it
        // Note: We can't easily read HttpOnly cookies, but this cookie is not HttpOnly (based on team-utils.ts)
        // Even if it was, we can just overwrite it to be sure.
        // But to avoid unnecessary writes, we can check document.cookie

        const cookieName = 'current_team_id';
        const hasCookie = document.cookie.split(';').some((item) => item.trim().startsWith(`${cookieName}=`));

        if (!hasCookie) {
            document.cookie = `${cookieName}=${teamId}; path=/; max-age=31536000; SameSite=Lax`;
        }
    }, [teamId]);

    return null;
}
