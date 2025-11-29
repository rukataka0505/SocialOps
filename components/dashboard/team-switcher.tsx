'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, PlusCircle, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { JoinTeamDialog } from './join-team-dialog';

type Team = {
    id: string;
    name: string;
};

interface TeamSwitcherProps {
    currentTeamId: string;
    teams: Team[];
}

export function TeamSwitcher({ currentTeamId, teams }: TeamSwitcherProps) {
    const router = useRouter();
    const currentTeam = teams.find((team) => team.id === currentTeamId);
    const [showJoinDialog, setShowJoinDialog] = React.useState(false);

    const onTeamSelect = async (teamId: string) => {
        // Set cookie via document.cookie
        document.cookie = `current_team_id=${teamId}; path=/; max-age=31536000; SameSite=Lax`;

        // Refresh the page to reload data with new team context
        router.refresh();
        window.location.reload();
    };

    return (
        <>
            <JoinTeamDialog open={showJoinDialog} onOpenChange={setShowJoinDialog} />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-[200px] justify-between"
                    >
                        {currentTeam?.name || 'チームを選択'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]">
                    <DropdownMenuLabel>チーム切り替え</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {teams.map((team) => (
                        <DropdownMenuItem
                            key={team.id}
                            onSelect={() => onTeamSelect(team.id)}
                        >
                            <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    currentTeamId === team.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                )}
                            />
                            {team.name}
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onSelect={() => router.push('/onboarding/create-team')}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        新しいチームを作成
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onSelect={() => setShowJoinDialog(true)}
                    >
                        <UserPlus className="mr-2 h-4 w-4" />
                        招待コードで参加
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}
