"use client";

import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getNotifications, markAsRead, markAllAsRead } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

interface Notification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
    metadata: any;
}

export function NotificationBell({ userId }: { userId: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const fetchNotifications = async () => {
        const data = await getNotifications();
        setNotifications(data);
        setUnreadCount(data.length); // getNotifications returns unread only by default in our action, but let's double check
    };

    useEffect(() => {
        fetchNotifications();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('notifications-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    const newNotification = payload.new as Notification;
                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    // Show toast
                    toast(newNotification.title, {
                        description: newNotification.message,
                        action: {
                            label: "見る",
                            onClick: () => handleNotificationClick(newNotification)
                        },
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        await markAsRead(notification.id);
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        setUnreadCount(prev => Math.max(0, prev - 1));
        setIsOpen(false);

        // Navigate if there is a URL
        if (notification.metadata?.resource_url) {
            router.push(notification.metadata.resource_url);
        }
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
        setNotifications([]);
        setUnreadCount(0);
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-background" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">通知</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 text-muted-foreground hover:text-primary"
                            onClick={handleMarkAllRead}
                        >
                            <Check className="mr-1 h-3 w-3" />
                            すべて既読
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            新しい通知はありません
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-medium leading-none">
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ja })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
