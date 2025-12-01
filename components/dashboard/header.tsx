"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserProfileDialog } from "@/components/dashboard/user-profile-dialog";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { cn } from "@/lib/utils";
import { logout } from "@/actions/auth";
import { User } from "@supabase/supabase-js";
import { Logo } from "@/components/ui/logo";
import { motion } from "framer-motion";

import { NotificationBell } from "@/components/dashboard/notification-bell";
import { TeamSwitcher } from "@/components/dashboard/team-switcher";

interface HeaderProps {
    user: User;
    userName: string;
    teamName: string;
    currentTeamId: string;
    teams: { id: string; name: string }[];
    members: any[];
    settings?: any;
}

export function Header({ user, userName, teamName, currentTeamId, teams, members, settings }: HeaderProps) {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === "/dashboard" && pathname === "/dashboard") return true;
        if (path !== "/dashboard" && pathname.startsWith(path)) return true;
        return false;
    };

    const navItems = [
        { name: "ダッシュボード", path: "/dashboard" },
        { name: "投稿管理", path: "/ops" },
        { name: "案件設定", path: "/management" },
        { name: "チーム設定", path: "/settings/team" },
    ];

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4 pointer-events-none">
            <motion.header
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="pointer-events-auto mx-auto flex items-center justify-between px-3 py-2 bg-background/60 backdrop-blur-xl border border-white/20 shadow-2xl rounded-full relative overflow-hidden"
            >
                {/* Noise Texture Overlay */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJnoiPjxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjY1IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2cpIiBvcGFjaXR5PSIwLjUiLz48L3N2Zz4=')] mix-blend-overlay" />

                <div className="flex items-center gap-4 pl-2">
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <Logo />
                        <span className="font-bold text-lg tracking-tight hidden sm:block group-hover:text-primary transition-colors">SocialOps</span>
                    </Link>

                    <div className="h-4 w-px bg-border/50 mx-1 hidden sm:block" />

                    <nav className="flex items-center gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 relative",
                                    isActive(item.path)
                                        ? "text-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                                )}
                            >
                                {isActive(item.path) && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-white shadow-sm rounded-full -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-2 pr-1">
                    <div className="flex items-center gap-2 px-2 py-1 bg-white/40 rounded-full border border-white/20">
                        <TeamSwitcher currentTeamId={currentTeamId} teams={teams} />
                        <UserProfileDialog initialName={userName}>
                            <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors px-1">
                                <span className="max-w-[80px] truncate">{userName}</span>
                            </button>
                        </UserProfileDialog>
                    </div>

                    <NotificationBell userId={user.id} />

                    <div className="scale-90 origin-right">
                        <TaskDialog members={members} settings={settings} />
                    </div>

                    <form action={logout}>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full w-8 h-8" type="submit" title="ログアウト">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                        </Button>
                    </form>
                </div>
            </motion.header>
        </div>
    );
}
