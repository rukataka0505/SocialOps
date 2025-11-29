import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Users } from "lucide-react";
import Link from "next/link";
import { JoinTeamDialog } from "@/components/dashboard/join-team-dialog";

export default function OnboardingPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl mix-blend-screen animate-pulse" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl mix-blend-screen" />
            </div>

            <div className="w-full max-w-4xl z-10">
                <div className="text-center mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        ようこそ SocialOps へ
                    </h1>
                    <p className="text-slate-400 text-lg">
                        まずはチームを作成するか、既存のチームに参加しましょう
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Create Team Card */}
                    <Card className="bg-slate-900/50 backdrop-blur-md border-slate-800 hover:border-purple-500/50 transition-colors group cursor-pointer h-full">
                        <Link href="/onboarding/create-team" className="block h-full">
                            <CardHeader className="text-center pt-10">
                                <div className="mx-auto w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <PlusCircle className="w-8 h-8 text-purple-400" />
                                </div>
                                <CardTitle className="text-xl text-white">新しいチームを作成</CardTitle>
                                <CardDescription className="text-slate-400">
                                    あなたがオーナーとなり、新しいワークスペースを立ち上げます
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-center pb-10">
                                <Button className="bg-purple-600 hover:bg-purple-500 text-white">
                                    チームを作成する
                                </Button>
                            </CardContent>
                        </Link>
                    </Card>

                    {/* Join Team Card */}
                    <JoinTeamDialog>
                        <Card className="bg-slate-900/50 backdrop-blur-md border-slate-800 hover:border-blue-500/50 transition-colors group cursor-pointer h-full">
                            <CardHeader className="text-center pt-10">
                                <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Users className="w-8 h-8 text-blue-400" />
                                </div>
                                <CardTitle className="text-xl text-white">招待コードで参加</CardTitle>
                                <CardDescription className="text-slate-400">
                                    管理者から共有された招待コードを使って、既存のチームに参加します
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-center pb-10">
                                <Button variant="outline" className="border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white">
                                    コードを入力する
                                </Button>
                            </CardContent>
                        </Card>
                    </JoinTeamDialog>
                </div>
            </div>
        </div>
    );
}
