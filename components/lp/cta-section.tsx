"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CTASection() {
    return (
        <section className="py-32 bg-[#09090B] border-t border-zinc-900 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="container px-4 md:px-6 relative z-10 text-center">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6"
                >
                    SNS運用を <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                        シンプルにする準備はできましたか？
                    </span>
                </motion.h2>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-zinc-400 text-xl max-w-2xl mx-auto mb-10"
                >
                    スプレッドシートを捨てて、カレンダーで管理する高パフォーマンスなチームに参加しましょう。
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col sm:flex-row justify-center gap-4"
                >
                    <Link
                        href="/onboarding/create-team"
                        className="inline-flex h-14 items-center justify-center rounded-full bg-white px-10 text-base font-medium text-black transition-all hover:bg-zinc-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50"
                    >
                        今すぐ始める
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
