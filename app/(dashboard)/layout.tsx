import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard | SocialOps",
    description: "SocialOps Dashboard",
};

/**
 * Dashboard Layout
 * Shared layout for all dashboard pages (sidebar, header, etc.)
 */
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* TODO: Add Sidebar */}
            {/* TODO: Add Header */}
            <main className="p-8">{children}</main>
        </div>
    );
}
