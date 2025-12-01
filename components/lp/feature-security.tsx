"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Lock, ArrowRight } from "lucide-react";
import { useState } from "react";

export function FeatureSecurity() {
    const [code, setCode] = useState("");
    const [isUnlocked, setIsUnlocked] = useState(false);

    const handleSimulate = () => {
        const target = "X7K9-M2P";
        let i = 0;
        setCode("");
        setIsUnlocked(false);

        const interval = setInterval(() => {
            setCode(target.substring(0, i + 1));
            i++;
            if (i === target.length) {
                clearInterval(interval);
                setTimeout(() => setIsUnlocked(true), 500);
            }
        }, 100);
    };

    return (
        <section className="py-24 bg-[#09090B]">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">

                    {/* Text Content */}
                    <div className="flex-1 space-y-6">
                        <div className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1 text-sm text-zinc-300">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Enterprise Grade Security
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                            デフォルトで安全。 <br />
                            <span className="text-zinc-500">完全招待制。</span>
                        </h2>
                        <p className="text-zinc-400 text-lg">
                            公開リンクはありません。誤送信の心配もありません。
                            チームへのアクセスは、安全な招待コードによって管理されます。
                            コードを知らない人は、誰も入ることはできません。
                        </p>
                    </div>

                    {/* Interactive Demo */}
                    <div className="flex-1 w-full max-w-md">
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl relative overflow-hidden">

                            <div className="text-center mb-8">
                                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 mb-4">
                                    <Lock className={`h-6 w-6 transition-colors ${isUnlocked ? "text-emerald-500" : "text-zinc-500"}`} />
                                </div>
                                <h3 className="text-xl font-semibold text-white">チームに参加</h3>
                                <p className="text-sm text-zinc-500">招待コードを入力してください</p>
                            </div>

                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={code}
                                        readOnly
                                        className="w-full h-12 bg-zinc-950 border border-zinc-700 rounded-md px-4 text-center font-mono text-lg tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        placeholder="____-____"
                                    />
                                    {isUnlocked && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute right-3 top-3 text-emerald-500"
                                        >
                                            <ShieldCheck className="h-6 w-6" />
                                        </motion.div>
                                    )}
                                </div>

                                <button
                                    onClick={handleSimulate}
                                    className={`w-full h-10 rounded-md font-medium transition-all ${isUnlocked
                                        ? "bg-emerald-600 text-white hover:bg-emerald-500"
                                        : "bg-white text-black hover:bg-zinc-200"
                                        }`}
                                >
                                    {isUnlocked ? "アクセス承認" : "入力をシミュレート"}
                                </button>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
