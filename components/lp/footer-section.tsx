import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FooterSection() {
    return (
        <footer className="py-20 bg-slate-950 border-t border-slate-900">
            <div className="container px-4 mx-auto text-center">
                <h2 className="mb-8 text-4xl font-bold text-white md:text-5xl">
                    SNS運用を、<br />
                    属人化から解放しよう。
                </h2>
                <p className="mb-10 text-xl text-slate-400">
                    チームを作成し、招待リンクを送るだけで、<br />
                    SNS運用の基盤がすぐに整います。
                </p>

                <div className="flex flex-col items-center justify-center gap-4 mb-16 sm:flex-row">
                    <Button size="lg" className="w-full text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25 sm:w-auto h-12 px-8" asChild>
                        <Link href="/login?mode=signup">無料で試す</Link>
                    </Button>
                    <Button variant="outline" size="lg" className="w-full text-lg text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white sm:w-auto h-12 px-8">
                        デモを見る
                    </Button>
                </div>

                <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm">
                    <p>&copy; 2024 SocialOps. All rights reserved.</p>
                    <div className="flex gap-6 mt-4 md:mt-0">
                        <Link href="#" className="hover:text-slate-300">利用規約</Link>
                        <Link href="#" className="hover:text-slate-300">プライバシーポリシー</Link>
                        <Link href="#" className="hover:text-slate-300">お問い合わせ</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
