'use client';

import { useState } from 'react';
import { updateTeamName } from '@/actions/teams';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';

interface TeamProfileSectionProps {
    teamId: string;
    initialName: string;
}

export function TeamProfileSection({ teamId, initialName }: TeamProfileSectionProps) {
    const [name, setName] = useState(initialName);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || name === initialName) return;

        setIsSubmitting(true);
        setMessage(null);

        try {
            await updateTeamName(teamId, name);
            setMessage({ type: 'success', text: 'チーム名を更新しました' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Failed to update team name:', error);
            setMessage({ type: 'error', text: 'チーム名の更新に失敗しました' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">チームプロフィール</h2>
            <form onSubmit={handleSubmit} className="max-w-md space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="team-name">チーム名</Label>
                    <Input
                        id="team-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="チーム名を入力"
                        disabled={isSubmitting}
                    />
                </div>
                <div className="flex items-center gap-4">
                    <Button
                        type="submit"
                        disabled={isSubmitting || !name.trim() || name === initialName}
                    >
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        変更を保存
                    </Button>
                    {message && (
                        <span className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {message.text}
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
}
