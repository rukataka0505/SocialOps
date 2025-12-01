export function FooterSection() {
    return (
        <footer className="py-12 bg-[#09090B] border-t border-zinc-900">
            <div className="container px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-blue-600" />
                    <span className="text-lg font-bold text-white tracking-tight">SocialOps</span>
                </div>

                <div className="text-sm text-zinc-500">
                    © {new Date().getFullYear()} SocialOps. All rights reserved.
                </div>

                <div className="flex gap-6">
                    <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">利用規約</a>
                    <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">プライバシー</a>
                    <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Twitter</a>
                </div>
            </div>
        </footer>
    );
}
