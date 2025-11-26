export function WhySocialOpsSection() {
    return (
        <section className="py-24 bg-slate-950">
            <div className="container px-4 mx-auto">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="mb-8 text-3xl font-bold text-white md:text-4xl">
                        なぜスプレッドシートや<br />一般的なToDoアプリでは足りないのか。
                    </h2>

                    <div className="grid gap-8 md:grid-cols-2 text-left">
                        <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-2xl">
                            <h3 className="mb-4 text-xl font-bold text-red-400">スプレッドシートの限界</h3>
                            <p className="text-slate-400 leading-relaxed">
                                自由度が高い反面、チームでのリアルタイムな運用管理には向いていません。
                                「誰がいつやるか」の可視化や、期限切れのアラート機能が弱く、
                                管理コストが肥大化しがちです。
                            </p>
                        </div>

                        <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-2xl">
                            <h3 className="mb-4 text-xl font-bold text-yellow-400">ToDoアプリの限界</h3>
                            <p className="text-slate-400 leading-relaxed">
                                多くのToDoアプリは個人向けに設計されており、
                                チーム全体の負荷状況を俯瞰したり、
                                複雑な承認フローを管理するには機能が不足しています。
                            </p>
                        </div>
                    </div>

                    <div className="mt-12 p-8 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-2xl">
                        <h3 className="mb-4 text-2xl font-bold text-white">SocialOps の答え</h3>
                        <p className="text-lg text-slate-300">
                            SocialOps は、<span className="text-purple-400 font-bold">SNS運用チーム専用</span>に設計されたワークスペースです。<br />
                            カレンダーとタスク管理を統合し、チームのコラボレーションを加速させます。
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
