'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function ClientTabs({ clientId }: { clientId: string }) {
    const pathname = usePathname();
    const isSettings = pathname.includes('/settings');

    return (
        <div className="flex items-center space-x-2 border-b px-6 pt-2">
            <Link href={`/clients/${clientId}`}>
                <div
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        !isSettings
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    投稿管理 (Ops)
                </div>
            </Link>
            <Link href={`/clients/${clientId}/settings`}>
                <div
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        isSettings
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                >
                    案件設定 (Settings)
                </div>
            </Link>
        </div>
    );
}
