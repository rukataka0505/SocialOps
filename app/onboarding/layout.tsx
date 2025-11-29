import { ReactNode } from 'react';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 py-4 px-6">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                            S
                        </div>
                        <span className="text-xl font-bold text-gray-900">SocialOps</span>
                    </div>
                </div>
            </header>
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
