"use client";

import { motion } from "framer-motion";
import { MessageSquare, Bell, User } from "lucide-react";

export function FeatureChat() {
    return (
        <section className="py-24 bg-[#09090B] border-t border-zinc-900">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-24">

                    {/* Text Content */}
                    <div className="flex-1 space-y-6">
                        <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-400">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Contextual Communication
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                            仕事の場所で <br />
                            <span className="text-emerald-500">会話する</span>
                        </h2>
                        <p className="text-zinc-400 text-lg">
                            「どの投稿の話？」という確認はもう不要です。
                            すべてのタスクに専用のチャットルームがあります。履歴も、ファイルも、決定事項も、すべてそこに残ります。
                        </p>
                    </div>

                    {/* Visual Demo */}
                    <div className="flex-1 w-full max-w-md">
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-2xl">
                            {/* Task Header */}
                            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                                    <span className="text-sm font-medium text-zinc-200">Instagram ローンチ投稿</span>
                                </div>
                                <Bell className="h-4 w-4 text-zinc-500" />
                            </div>

                            {/* Chat Area */}
                            <div className="p-4 space-y-4 h-64 bg-zinc-950/50 relative">

                                {/* Message 1 */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex gap-3"
                                >
                                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                                        <User className="h-4 w-4 text-zinc-500" />
                                    </div>
                                    <div className="bg-zinc-800 rounded-lg rounded-tl-none p-3 text-sm text-zinc-300 max-w-[80%]">
                                        見出しの色を変更できますか？
                                    </div>
                                </motion.div>

                                {/* Message 2 */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                    className="flex gap-3 flex-row-reverse"
                                >
                                    <div className="h-8 w-8 rounded-full bg-blue-900/30 flex items-center justify-center shrink-0">
                                        <User className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <div className="bg-blue-600 rounded-lg rounded-tr-none p-3 text-sm text-white max-w-[80%]">
                                        了解です、今更新しました。
                                    </div>
                                </motion.div>

                                {/* Message 3 (New) */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 1.5, type: "spring" }}
                                    className="flex gap-3"
                                >
                                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                                        <User className="h-4 w-4 text-zinc-500" />
                                    </div>
                                    <div className="bg-zinc-800 rounded-lg rounded-tl-none p-3 text-sm text-zinc-300 max-w-[80%]">
                                        いいですね！承認します。 ✅
                                    </div>
                                </motion.div>

                            </div>

                            {/* Input Area */}
                            <div className="p-3 border-t border-zinc-800 bg-zinc-900">
                                <div className="h-9 w-full bg-zinc-950 rounded border border-zinc-800 px-3 flex items-center text-zinc-600 text-sm">
                                    コメントを書く...
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
