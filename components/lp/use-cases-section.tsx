import { Building2, Users2 } from "lucide-react";

export function UseCasesSection() {
    return (
        <section className="py-24 bg-slate-900">
            <div className="container px-4 mx-auto">
                <div className="mb-16 text-center">
                    <h2 className="text-3xl font-bold text-white md:text-4xl">
                        あらゆるSNS運用チームに
                    </h2>
                </div>

                <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
                    <div className="p-8 bg-slate-800 rounded-2xl border border-slate-700">
                        <div className="w-14 h-14 mb-6 flex items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                            <Building2 className="w-8 h-8" />
                        </div>
                        <h3 className="mb-4 text-2xl font-bold text-white">SNS運用代行会社</h3>
                        <p className="text-slate-400 leading-relaxed">
                            複数クライアントの投稿スケジュールを一元管理。
                            メンバーの負荷と進行状況を同時に把握でき、
                            クライアントへの報告もスムーズになります。
                        </p>
                    </div>

                    <div className="p-8 bg-slate-800 rounded-2xl border border-slate-700">
                        <div className="w-14 h-14 mb-6 flex items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                            <Users2 className="w-8 h-8" />
                        </div>
                        <h3 className="mb-4 text-2xl font-bold text-white">インハウスマーケティング</h3>
                        <p className="text-slate-400 leading-relaxed">
                            社内の広報・採用・キャンペーン投稿を統合管理。
                            新規メンバーでも即座に全体像を把握でき、
                            属人化を防ぎます。
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
