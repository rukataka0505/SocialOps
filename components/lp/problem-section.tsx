import { AlertTriangle, FileSpreadsheet, MessageSquare, Users } from "lucide-react";

export function ProblemSection() {
    return (
        <section className="py-24 bg-slate-900">
            <div className="container px-4 mx-auto">
                <div className="max-w-3xl mx-auto mb-16 text-center">
                    <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                        スプレッドシートとチャットで回すSNS運用に、<br />
                        そろそろ限界を感じていませんか。
                    </h2>
                    <p className="text-lg text-slate-400">
                        多くのSNS運用チームが、「とりあえずスプレッドシート」と「チャット連絡」で何とか運用しています。<br />
                        しかし、クライアントや案件が増えた瞬間から、管理は一気に破綻します。
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <ProblemCard
                        icon={<FileSpreadsheet className="w-8 h-8 text-red-400" />}
                        title="どれが最新かわからない"
                        description="「最新版」という名前のファイルが複数存在し、どれを更新すればいいのかわからない。"
                    />
                    <ProblemCard
                        icon={<MessageSquare className="w-8 h-8 text-red-400" />}
                        title="指示がチャットに流れる"
                        description="重要な修正指示がチャットのログに埋もれ、誰の担当かわからなくなる。"
                    />
                    <ProblemCard
                        icon={<Users className="w-8 h-8 text-red-400" />}
                        title="メンバーの負荷が見えない"
                        description="誰がどれくらい忙しいのか把握できず、一部の人に負担が集中してしまう。"
                    />
                    <ProblemCard
                        icon={<AlertTriangle className="w-8 h-8 text-red-400" />}
                        title="定型作業の繰り返し"
                        description="毎週の定型投稿を何度も手入力。単純作業に時間を奪われている。"
                    />
                    <ProblemCard
                        icon={<AlertTriangle className="w-8 h-8 text-red-400" />}
                        title="バラバラな管理形式"
                        description="クライアントごとに管理シートのフォーマットが異なり、確認コストが高い。"
                    />
                    <div className="flex items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-red-900/20 to-slate-900 border border-red-900/30">
                        <p className="text-xl font-bold text-center text-red-200">
                            「この投稿、<br />誰がいつやるんだっけ？」
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

function ProblemCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="p-6 transition-all duration-300 bg-slate-800/50 border border-slate-700 rounded-2xl hover:bg-slate-800 hover:border-slate-600 hover:shadow-xl">
            <div className="mb-4 p-3 inline-block rounded-lg bg-slate-900/50 border border-slate-700/50">
                {icon}
            </div>
            <h3 className="mb-2 text-xl font-bold text-white">{title}</h3>
            <p className="text-slate-400">{description}</p>
        </div>
    );
}
