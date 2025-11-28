import { TaskUrlHandler } from "@/components/tasks/task-url-handler";

// ... imports

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // ... existing code

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <Header
                user={user}
                userName={userName}
                teamName={teamName}
                members={members}
                settings={settings}
            />
            <main className="flex-1 relative">
                <TaskUrlHandler />
                {children}
            </main>
        </div>
    );
}
