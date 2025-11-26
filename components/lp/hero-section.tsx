import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
    return (
        <section className="relative pt-32 pb-20 overflow-hidden bg-slate-950">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl mix-blend-screen animate-pulse" />
                <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl mix-blend-screen" />
            </div>

            <div className="container relative z-10 px-4 mx-auto text-center">
                <div className="inline-flex items-center px-3 py-1 mb-6 text-sm font-medium text-purple-300 rounded-full bg-purple-900/30 border border-purple-500/30 backdrop-blur-sm">
                    <span className="flex w-2 h-2 mr-2 bg-purple-400 rounded-full animate-pulse" />
                    SNS運用チームのための新しいワークスペース
                </div>

                <h1 className="mb-6 text-5xl font-bold tracking-tight text-white md:text-7xl">
                    SNS運用の<br className="md:hidden" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                        「誰が・いつ・何を」
                    </span>
                    を、<br />
                    1枚のカレンダーに。
                </h1>

                <p className="max-w-2xl mx-auto mb-10 text-lg text-slate-300 md:text-xl leading-relaxed">
                    「今日やること」が一目でわかる。<br />
                    招待リンクを送るだけでチームに参加。<br />
                    SNS運用チームのためのカレンダー型ワークスペース「SocialOps」。
                </p>

                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Button size="lg" className="w-full text-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg shadow-purple-500/25 sm:w-auto h-12 px-8" asChild>
                        <Link href="/login?mode=signup">無料で試す</Link>
                    </Button>
                    <Button variant="outline" size="lg" className="w-full text-lg text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white sm:w-auto h-12 px-8">
                        デモ画面を見る
                    </Button>
                </div>

                {/* Mockup Image Placeholder */}
                <div className="relative mt-20 mx-auto max-w-5xl">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl blur opacity-30"></div>
                    <div className="relative bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden aspect-video flex items-center justify-center text-slate-500">
                        {/* Replace with actual screenshot later */}
                        <div className="text-center">
                            <p className="text-2xl font-semibold">Dashboard Preview</p>
                            <p className="text-sm">Coming Soon</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
