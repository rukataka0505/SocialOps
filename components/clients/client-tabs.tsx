"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface ClientTabsProps {
    clientId: string;
}

export function ClientTabs({ clientId }: ClientTabsProps) {
    const pathname = usePathname();
    const isSettings = pathname.includes("/settings");

    return (
        <div className="border-b">
            <div className="flex h-10 items-center space-x-6 text-sm font-medium text-muted-foreground">
                <Link
                    href={`/clients/${clientId}`}
                    className={cn(
                        "flex h-full items-center border-b-2 px-2 transition-colors hover:text-primary",
                        !isSettings
                            ? "border-primary text-primary"
                            : "border-transparent"
                    )}
                >
                    投稿管理
                </Link>
                <Link
                    href={`/clients/${clientId}/settings`}
                    className={cn(
                        "flex h-full items-center border-b-2 px-2 transition-colors hover:text-primary",
                        isSettings
                            ? "border-primary text-primary"
                            : "border-transparent"
                    )}
                >
                    案件設定
                </Link>
            </div>
        </div>
    );
}
