import { Calendar, CheckCircle2, Clock, Layout, Users } from "lucide-react";

export function ConceptSection() {
    return (
        <section className="py-24 bg-slate-950 overflow-hidden">
            <div className="container px-4 mx-auto">
                <div className="mb-20 text-center">
                    <h2 className="text-3xl font-bold text-white md:text-5xl">
                        考えるのは企画だけ。<br />
                        運用は<span className="text-purple-400">カレンダー</span>が回す。
                    </h2>
                </div>

                <div className="grid gap-16 lg:grid-cols-2 items-center">
                    {/* Calendar Centric Design */}
                    <div className="order-2 lg:order-1">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <div className="relative p-8 bg-slate-900 border border-slate-800 rounded-2xl">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-lg bg-purple-500/10 text-purple-400">
                                        <Calendar className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">カレンダー中心設計</h3>
                                </div>
                                <p className="text-slate-400 leading-relaxed mb-6">
                                    SocialOps の中心は「カレンダー」です。
                                    トップ画面には、月間の投稿タスクが帯状に並びます。
                                    担当者のアイコン、期限、進行状況が一目でわかる構造になっています。
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <CheckCircle2 className="w-5 h-5 text-purple-500" />
                                        <span>月間の投稿スケジュールを一望</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <CheckCircle2 className="w-5 h-5 text-purple-500" />
                                        <span>ドラッグ＆ドロップで日程調整</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <CheckCircle2 className="w-5 h-5 text-purple-500" />
                                        <span>担当者の負荷状況を可視化</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="order-1 lg:order-2">
                        {/* Placeholder for Calendar UI Image */}
                        <div className="aspect-square rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10" />
                            <Layout className="w-24 h-24 text-slate-700" />
                        </div>
                    </div>

                    {/* Routine Automation */}
                    <div className="order-3">
                        {/* Placeholder for Automation UI Image */}
                        <div className="aspect-square rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
                            <Clock className="w-24 h-24 text-slate-700" />
                        </div>
                    </div>
                    <div className="order-4">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <div className="relative p-8 bg-slate-900 border border-slate-800 rounded-2xl">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
                                        <Clock className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">ルーチン自動化</h3>
                                </div>
                                <p className="text-slate-400 leading-relaxed mb-6">
                                    タスクは手入力するものではありません。
                                    ルーチンを一度設定すると、週次でタスクが自動生成されます。
                                    人的ミスによる漏れを防ぎ、クリエイティブな業務に集中できます。
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                        <span>曜日・時間・担当者を自動設定</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-slate-300">
                                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                        <span>定期的な投稿漏れを防止</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
