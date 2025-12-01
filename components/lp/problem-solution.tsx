"use client";

import { motion } from "framer-motion";
import { FileSpreadsheet, MessageSquareWarning, XCircle, CheckCircle, Calendar, MessageSquare } from "lucide-react";

export function ProblemSolutionSection() {
    return (
        <section className="py-24 bg-[#09090B] border-t border-zinc-900">
            <div className="container px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
                        <span className="text-red-500">「スプシ地獄」</span>からの脱出
                    </h2>
                    <p className="text-zinc-400 max-w-2xl mx-auto">
                        スプレッドシートとチャットツールを行き来する管理は、もう限界ではありませんか？
                        SocialOpsは、その混沌を統一されたオペレーティングシステムに置き換えます。
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* The Old Way */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <FileSpreadsheet size={120} />
                        </div>
                        <h3 className="text-xl font-semibold text-zinc-300 mb-6 flex items-center">
                            <XCircle className="w-5 h-5 text-red-500 mr-2" />
                            これまでの管理
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start text-zinc-500">
                                <MessageSquareWarning className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                                <span>「Slack見ました？昨日ファイル送ったんですけど…」</span>
                            </li>
                            <li className="flex items-start text-zinc-500">
                                <FileSpreadsheet className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                                <span>ステータス更新のために、手動でセルを色塗り。</span>
                            </li>
                            <li className="flex items-start text-zinc-500">
                                <XCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                                <span>日付が間違っていて、投稿を飛ばしてしまった。</span>
                            </li>
                        </ul>
                    </motion.div>

                    {/* The SocialOps Way */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="p-8 rounded-2xl bg-zinc-900 border border-blue-900/30 relative overflow-hidden shadow-2xl shadow-blue-900/10"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-500">
                            <Calendar size={120} />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                            <CheckCircle className="w-5 h-5 text-blue-500 mr-2" />
                            SocialOpsの管理
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start text-zinc-300">
                                <MessageSquare className="w-5 h-5 text-blue-500 mr-3 shrink-0 mt-0.5" />
                                <span>チャットは<strong>タスクの中</strong>に。文脈は失われません。</span>
                            </li>
                            <li className="flex items-start text-zinc-300">
                                <Calendar className="w-5 h-5 text-blue-500 mr-3 shrink-0 mt-0.5" />
                                <span>子タスクが完了すると、ステータスが自動で更新。</span>
                            </li>
                            <li className="flex items-start text-zinc-300">
                                <CheckCircle className="w-5 h-5 text-blue-500 mr-3 shrink-0 mt-0.5" />
                                <span>カレンダーを見るだけで、次にやるべきことが分かります。</span>
                            </li>
                        </ul>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
