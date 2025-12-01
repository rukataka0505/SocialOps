"use client";

import { motion } from "framer-motion";
import { Calendar as CalendarIcon, GripVertical } from "lucide-react";
import { useState } from "react";

export function FeatureCalendar() {
    const [days] = useState(Array.from({ length: 7 }));

    return (
        <section id="features" className="py-24 bg-[#09090B] overflow-hidden">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">

                    {/* Text Content */}
                    <div className="flex-1 space-y-6">
                        <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm text-blue-400">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            Calendar is King
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                            <span className="text-blue-500">ドラッグ＆ドロップ</span>で<br />
                            直感的にスケジュール
                        </h2>
                        <p className="text-zinc-400 text-lg">
                            予定は変わるものです。だからこそ、SocialOpsはカードを動かすだけでリスケジュールが完了するようにしました。
                            スプレッドシートのセルを5箇所も書き直す必要はもうありません。
                        </p>
                    </div>

                    {/* Interactive Demo */}
                    <div className="flex-1 w-full max-w-md">
                        <div className="relative rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-2xl">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-xl" />

                            {/* Mock Calendar Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                {days.map((_, i) => (
                                    <div
                                        key={i}
                                        className="aspect-square rounded-lg border border-zinc-800 bg-zinc-900/50 p-2 relative"
                                    >
                                        <span className="text-xs text-zinc-600 font-mono">{i + 1}</span>

                                        {/* Draggable Task */}
                                        {i === 4 && (
                                            <motion.div
                                                drag
                                                dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
                                                whileDrag={{ scale: 1.1, cursor: "grabbing", zIndex: 50 }}
                                                whileHover={{ scale: 1.05, cursor: "grab" }}
                                                className="absolute inset-1 m-auto h-20 w-full bg-blue-600 rounded-md p-2 shadow-lg flex flex-col justify-between z-10"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="h-1.5 w-8 bg-white/30 rounded-full" />
                                                    <GripVertical className="h-4 w-4 text-white/50" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="h-2 w-3/4 bg-white/90 rounded-sm" />
                                                    <div className="h-2 w-1/2 bg-white/50 rounded-sm" />
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 text-center">
                                <p className="text-xs text-zinc-500 uppercase tracking-widest">カードをドラッグしてみてください</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
