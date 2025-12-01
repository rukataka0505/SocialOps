"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTeam } from '@/actions/onboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InviteMemberDialog } from '@/components/team/invite-member-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Loader2, Users } from 'lucide-react';

export default function CreateTeamPage() {
    const router = useRouter();
    const [step, setStep] = useState<'name' | 'invite'>('name');
    const [teamName, setTeamName] = useState('');
    const [teamId, setTeamId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('name', teamName);

        try {
            const result = await createTeam(formData);
            setTeamId(result.teamId);
            setStep('invite');
        } catch (err) {
            setError('チームの作成に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleComplete = () => {
        router.push('/dashboard');
    };

    return (
        <div className="min-h-screen w-full bg-[#09090B] flex items-center justify-center relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272A_1px,transparent_1px),linear-gradient(to_bottom,#27272A_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-lg px-4"
            >
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 backdrop-blur-sm shadow-2xl">

                    {/* Progress Indicator */}
                    <div className="flex items-center justify-center mb-8 gap-4">
                        <div className={`flex items-center gap-2 ${step === 'name' ? 'text-white' : 'text-zinc-500'}`}>
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'name' ? 'bg-blue-600' : 'bg-zinc-800'}`}>1</div>
                            <span className="text-sm font-medium">チーム作成</span>
                        </div>
                        <div className="h-px w-8 bg-zinc-800" />
                        <div className={`flex items-center gap-2 ${step === 'invite' ? 'text-white' : 'text-zinc-500'}`}>
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'invite' ? 'bg-blue-600' : 'bg-zinc-800'}`}>2</div>
                            <span className="text-sm font-medium">メンバー招待</span>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 'name' ? (
                            <motion.div
                                key="step-name"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="text-center mb-6">
                                    <h1 className="text-2xl font-bold text-white mb-2">チームに名前を付けましょう</h1>
                                    <p className="text-zinc-400 text-sm">
                                        これはあなたの新しいワークスペースの名前になります。
                                    </p>
                                </div>

                                <form onSubmit={handleCreateTeam} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="teamName" className="text-zinc-300">チーム名</Label>
                                        <Input
                                            id="teamName"
                                            value={teamName}
                                            onChange={(e) => setTeamName(e.target.value)}
                                            placeholder="例: Acme Corp Marketing"
                                            required
                                            className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-blue-600 h-12 text-lg"
                                        />
                                    </div>

                                    {error && (
                                        <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        className="w-full h-12 bg-white text-black hover:bg-zinc-200 text-base font-medium"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                次へ進む
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step-invite"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="text-center mb-6">
                                    <div className="mx-auto h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                                        <Check className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <h1 className="text-2xl font-bold text-white mb-2">チームが作成されました！</h1>
                                    <p className="text-zinc-400 text-sm">
                                        早速メンバーを招待して、コラボレーションを始めましょう。
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 text-center">
                                        <Users className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
                                        <p className="text-zinc-400 text-sm mb-4">
                                            招待コードを共有するか、メールで招待を送ることができます。
                                        </p>
                                        {teamId && (
                                            <InviteMemberDialog teamId={teamId}>
                                                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                                                    メンバーを招待する
                                                </Button>
                                            </InviteMemberDialog>
                                        )}
                                    </div>

                                    <Button
                                        onClick={handleComplete}
                                        className="w-full h-12 bg-white text-black hover:bg-zinc-200 text-base font-medium"
                                    >
                                        ダッシュボードへ移動
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </motion.div>
        </div>
    );
}
