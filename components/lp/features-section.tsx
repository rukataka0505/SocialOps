import { CalendarDays, CheckSquare, Users, Repeat, Settings, UserPlus, Shield } from "lucide-react";

export function FeaturesSection() {
    const features = [
        {
            icon: <CalendarDays className="w-6 h-6" />,
            title: "カレンダー型ダッシュボード",
            description: "月間カレンダーにすべてのタスクが表示されます。ドラッグ＆ドロップで日付の変更が可能です。"
        },
        {
            icon: <CheckSquare className="w-6 h-6" />,
            title: "今日やることビュー（開発中）",
            description: "「今日が期限」「期限切れ」「重要」なタスクを1画面に集約。迷わず作業に着手できます。"
        },
        {
            icon: <Users className="w-6 h-6" />,
            title: "メンバーコンソール",
            description: "メンバーごとの未完了タスクを一覧表示。誰がボールを持っているか一目でわかります。"
        },
        {
            icon: <Repeat className="w-6 h-6" />,
            title: "ルーチン & 自動タスク生成",
            description: "定期的な投稿タスクを自動生成。手動登録の手間とミスをゼロにします。"
        },
        {
            icon: <Settings className="w-6 h-6" />,
            title: "カスタムフィールド",
            description: "媒体名、ジャンル、単価など、チームごとに必要な項目を自由に追加可能です。"
        },
        {
            icon: <UserPlus className="w-6 h-6" />,
            title: "招待リンク参加",
            description: "招待リンクを送るだけで、外部パートナーやクライアントもすぐに参加できます。"
        },
        {
            icon: <Shield className="w-6 h-6" />,
            title: "権限管理",
            description: "Owner / Admin / Member のロールにより、編集範囲を細かく制御できます。"
        }
    ];

    return (
        <section className="py-24 bg-slate-900">
            <div className="container px-4 mx-auto">
                <div className="mb-16 text-center">
                    <h2 className="text-3xl font-bold text-white md:text-4xl">
                        SNS運用に必要な機能を、<br />
                        すべて揃えました。
                    </h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <div key={index} className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors">
                            <div className="w-12 h-12 mb-4 flex items-center justify-center rounded-lg bg-slate-700 text-slate-300">
                                {feature.icon}
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-white">{feature.title}</h3>
                            <p className="text-slate-400">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
