import { Milestone } from "lucide-react";

export function RoadmapSection() {
    return (
        <section className="py-24 bg-slate-950">
            <div className="container px-4 mx-auto">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-slate-900 border border-slate-800">
                        <Milestone className="w-8 h-8 text-slate-400" />
                    </div>
                    <h2 className="mb-8 text-3xl font-bold text-white md:text-4xl">
                        これからの SocialOps
                    </h2>
                    <p className="mb-12 text-lg text-slate-400">
                        私たちは、SNS運用チームが「本質的な価値づくり」に集中できる世界を目指しています。<br />
                        今後は以下の機能を順次追加予定です。
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2 text-left">
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                            <span className="text-slate-300">「今日やること」ビューの正式リリース</span>
                        </div>
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                            <span className="text-slate-300">Slack / Chatwork 通知機能</span>
                        </div>
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                            <span className="text-slate-300">タスクのフィルタリング機能</span>
                        </div>
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-3">
                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                            <span className="text-slate-300">チーム稼働分析ダッシュボード</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
