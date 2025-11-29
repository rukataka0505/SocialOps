'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTeam } from '@/actions/onboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { InviteMemberDialog } from '@/components/team/invite-member-dialog';
import { InviteGuestDialog } from '@/components/team/invite-guest-dialog';

export default function CreateTeamPage() {
    const router = useRouter();
    const [step, setStep] = useState<'name' | 'invite'>('name');
    const [teamName, setTeamName] = useState('');
    const [teamId, setTeamId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamName.trim()) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', teamName);
            const result = await createTeam(formData);
            setTeamId(result.teamId);
            setStep('invite');
        } catch (error) {
            console.error('Failed to create team:', error);
            alert('チームの作成に失敗しました。もう一度お試しください。');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleComplete = () => {
        router.push('/dashboard');
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-8">
                {step === 'name' ? (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h1 className="text-2xl font-bold text-gray-900">チームを作成しましょう</h1>
                            <p className="text-gray-500">
                                SocialOpsへようこそ！まずはあなたのチームに名前を付けてください。
                            </p>
                        </div>

                        <form onSubmit={handleCreateTeam} className="space-y-6 max-w-md mx-auto">
                            <div className="space-y-2">
                                <Label htmlFor="team-name">チーム名</Label>
                                <Input
                                    id="team-name"
                                    placeholder="例: 株式会社〇〇, デザインチーム"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    required
                                    autoFocus
                                    className="text-lg py-6"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-12 text-lg"
                                disabled={isSubmitting || !teamName.trim()}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <>
                                        次へ進む
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="text-center space-y-2">
                            <div className="flex justify-center mb-4">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">チーム「{teamName}」を作成しました！</h1>
                            <p className="text-gray-500">
                                メンバーを招待して、コラボレーションを始めましょう。<br />
                                このステップはスキップして後で行うこともできます。
                            </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4 p-4 bg-white rounded-lg border shadow-sm">
                                    <h3 className="font-medium flex items-center gap-2">
                                        正規メンバーを招待
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        チームのコアメンバーとして招待します。アカウント作成が必要です。
                                    </p>
                                    <InviteMemberDialog teamId={teamId!} />
                                </div>

                                <div className="space-y-4 p-4 bg-white rounded-lg border shadow-sm">
                                    <h3 className="font-medium flex items-center gap-2">
                                        ゲストを招待
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        外部パートナーや一時的なメンバーに。URLのみで参加できます。
                                    </p>
                                    <InviteGuestDialog />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                onClick={handleComplete}
                                size="lg"
                                className="px-8"
                            >
                                ダッシュボードへ移動
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Progress Indicator */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex justify-center gap-2">
                <div className={`h-2 w-20 rounded-full ${step === 'name' ? 'bg-blue-600' : 'bg-green-500'}`} />
                <div className={`h-2 w-20 rounded-full ${step === 'invite' ? 'bg-blue-600' : 'bg-gray-200'}`} />
            </div>
        </div>
    );
}
