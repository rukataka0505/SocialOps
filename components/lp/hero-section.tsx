"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
    return (
        <section className="relative min-h-screen w-full overflow-hidden bg-[#09090B] flex flex-col items-center justify-center pt-20">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272A_1px,transparent_1px),linear-gradient(to_bottom,#27272A_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-sm text-zinc-400 backdrop-blur-xl mb-8"
                >
                    <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse" />
                    SocialOps v10.0 リリース
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="max-w-4xl text-5xl md:text-7xl font-bold tracking-tight text-white mb-6"
                >
                    運用を支配する <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                        カレンダー型ワークスペース
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="max-w-2xl text-lg md:text-xl text-zinc-400 mb-10"
                >
                    スプレッドシートでの管理はもう終わりです。SocialOpsは、SNS運用チームのために設計された、カレンダーファーストのワークスペースです。
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                >
                    <Link
                        href="/onboarding/create-team"
                        className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50"
                    >
                        無料で始める
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    <Link
                        href="#features"
                        className="inline-flex h-12 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 px-8 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                    >
                        機能を見る
                    </Link>
                </motion.div>

                {/* Animated Calendar Grid Visual */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                    className="mt-20 w-full max-w-5xl rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-2 shadow-2xl shadow-blue-900/20"
                >
                    <div className="grid grid-cols-7 gap-px bg-zinc-800 rounded-lg overflow-hidden border border-zinc-800">
                        {Array.from({ length: 28 }).map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, backgroundColor: "#18181B" }}
                                animate={{ opacity: 1, backgroundColor: "#09090B" }}
                                transition={{ duration: 0.5, delay: 0.5 + i * 0.02 }}
                                className="aspect-square p-2 relative group hover:bg-zinc-900/80 transition-colors"
                            >
                                <span className="text-xs text-zinc-600 font-mono">{i + 1}</span>
                                {/* Random Tasks */}
                                {[2, 5, 8, 12, 15, 18, 22, 25].includes(i) && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 1 + i * 0.05, type: "spring" }}
                                        className="mt-2 h-1.5 w-3/4 rounded-full bg-blue-500/80"
                                    />
                                )}
                                {[5, 12, 19, 26].includes(i) && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 1.2 + i * 0.05, type: "spring" }}
                                        className="mt-1 h-1.5 w-1/2 rounded-full bg-emerald-500/80"
                                    />
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
