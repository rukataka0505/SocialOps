import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import Image from 'next/image';

// レイアウトはサーバーコンポーネントとしてデータ取得を行う
export default async function ClientLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: client } = await (supabase as any)
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

    if (!client) {
        notFound();
    }

    return (
        <div className="flex h-full flex-col bg-background">
            {/* 共通ヘッダー */}
            <div className="flex items-center justify-between border-b px-6 py-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        投稿管理
                    </span>
                </div>
                {client.spreadsheet_url && (
                    <Button variant="outline" size="sm" asChild>
                        <a
                            href={client.spreadsheet_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="gap-2"
                        >
                            <Image src="/file.svg" alt="Sheet" width={16} height={16} />
                            管理シートを開く
                        </a>
                    </Button>
                )}
            </div>



            {/* ページコンテンツ */}
            <div className="flex-1 overflow-auto bg-muted/10 p-6">
                {children}
            </div>
        </div>
    );
}
