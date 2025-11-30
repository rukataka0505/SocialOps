"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { useRef, useEffect } from "react";

interface TaskCommentSectionProps {
    comments: any[];
    newComment: string;
    onNewCommentChange: (value: string) => void;
    onAddComment: () => void;
    isPending: boolean;
    children?: React.ReactNode;
}

export function TaskCommentSection({
    comments,
    newComment,
    onNewCommentChange,
    onAddComment,
    isPending,
    children
}: TaskCommentSectionProps) {
    const commentsEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom of comments when they change
    useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [comments]);

    return (
        <div className="w-[320px] flex-none border-l bg-white flex flex-col h-full">
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    {children}

                    {/* Comments Section */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                            コメント
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">{comments.length}</span>
                        </h4>

                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <Avatar className="h-6 w-6 mt-1">
                                        <AvatarImage src={comment.user?.avatar_url || ""} />
                                        <AvatarFallback>{comment.user?.name?.[0] || "?"}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium">{comment.user?.name || "Unknown"}</span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {format(new Date(comment.created_at), "MM/dd HH:mm", { locale: ja })}
                                            </span>
                                        </div>
                                        <div className="text-xs mt-1 bg-slate-50 p-2 rounded-lg text-slate-700 whitespace-pre-wrap">
                                            {comment.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={commentsEndRef} />
                            {comments.length === 0 && (
                                <div className="text-center text-xs text-muted-foreground py-4">
                                    コメントはまだありません
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </ScrollArea>

            {/* Comment Input (Fixed at bottom of right column) */}
            <div className="p-3 border-t bg-white">
                <div className="relative">
                    <Textarea
                        placeholder="コメントを入力..."
                        value={newComment}
                        onChange={(e) => onNewCommentChange(e.target.value)}
                        className="min-h-[80px] pr-10 resize-none text-sm"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                onAddComment();
                            }
                        }}
                    />
                    <Button
                        type="button"
                        size="icon"
                        className="absolute bottom-2 right-2 h-7 w-7"
                        onClick={onAddComment}
                        disabled={!newComment.trim() || isPending}
                    >
                        <Send className="h-3 w-3" />
                    </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 text-right">
                    Ctrl + Enter で送信
                </p>
            </div>
        </div>
    );
}
