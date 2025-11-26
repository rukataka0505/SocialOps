"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserProfileDialog } from "@/components/dashboard/user-profile-dialog";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { cn } from "@/lib/utils";
import { logout } from "@/actions/auth";
import { User } from "@supabase/supabase-js";

interface HeaderProps {
    user: User;
    userName: string;
    teamName: string;
    members: any[]; // Using any[] for now to match existing usage, ideally should be typed
}

export function Header({ user, userName, teamName, members }: HeaderProps) {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === "/dashboard" && pathname === "/dashboard") return true;
        if (path !== "/dashboard" && pathname.startsWith(path)) return true;
        return false;
    };

    const navItems = [
        { name: "ダッシュボード", path: "/dashboard" },
        { name: "クライアント", path: "/clients" },
        { name: "チーム設定", path: "/settings/team" },
    ];

    return (
        <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shrink-0 shadow-sm z-20 sticky top-0">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-lg">S</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight text-slate-800">SocialOps</span>
                </div>

                <div className="h-6 w-px bg-slate-200 mx-2" />

                <nav className="flex items-center gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                isActive(item.path)
                                    ? "bg-slate-100 text-slate-900 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            )}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
                    <span className="text-xs font-medium text-slate-500 px-2 border-r border-slate-200">
                        {teamName}
                    </span>
                    <UserProfileDialog initialName={userName}>
                        <button className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors">
                            {userName}
                            <span className="text-[10px] text-slate-400">▼</span>
                        </button>
                    </UserProfileDialog>
                </div>

                <TaskDialog members={members} />

                <form action={logout}>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full" type="submit" title="ログアウト">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                    </Button>
                </form>
            </div>
        </header>
    );
}
