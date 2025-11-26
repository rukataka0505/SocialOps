import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
            <div className="container px-4 mx-auto flex items-center justify-between h-16">
                <Link href="/" className="text-xl font-bold text-white">
                    SocialOps
                </Link>

                <div className="flex items-center gap-4">
                    <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800" asChild>
                        <Link href="/login">ログイン</Link>
                    </Button>
                    <Button className="bg-white text-slate-900 hover:bg-slate-200 font-semibold" asChild>
                        <Link href="/login?mode=signup">アカウント登録</Link>
                    </Button>
                </div>
            </div>
        </nav>
    );
}
