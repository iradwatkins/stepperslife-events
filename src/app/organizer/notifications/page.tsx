"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Bell, Check, Clock, Info, DollarSign, Ticket, Calendar, MessageSquare, Megaphone } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function NotificationsPage() {
  const currentUser = useQuery(api.users.queries.getCurrentUser);
  const notifications = useQuery(api.notifications.queries.getMyNotifications, { limit: 50 });
  const markAsRead = useMutation(api.notifications.mutations.markAsRead);
  const markAllAsRead = useMutation(api.notifications.mutations.markAllAsRead);

  const isLoading = currentUser === undefined || notifications === undefined;

  if (isLoading || currentUser === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  const handleMarkAsRead = async (notificationId: Id<"notifications">) => {
    try {
      await markAsRead({ notificationId });
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllAsRead({});
      toast.success(`Marked ${result.count} notifications as read`);
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const formatTime = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getNotificationIcon = (type: string, isRead: boolean) => {
    const iconClass = isRead ? "text-muted-foreground" : "text-primary";
    const bgClass = isRead ? "bg-muted" : "bg-primary/10";

    const iconMap: Record<string, React.ReactNode> = {
      order: <Ticket className={`w-5 h-5 ${iconClass}`} />,
      event: <Calendar className={`w-5 h-5 ${iconClass}`} />,
      ticket: <Ticket className={`w-5 h-5 ${iconClass}`} />,
      class: <Calendar className={`w-5 h-5 ${iconClass}`} />,
      payout: <DollarSign className={`w-5 h-5 ${iconClass}`} />,
      review: <Check className={`w-5 h-5 ${iconClass}`} />,
      message: <MessageSquare className={`w-5 h-5 ${iconClass}`} />,
      system: <Info className={`w-5 h-5 ${iconClass}`} />,
      promotion: <Megaphone className={`w-5 h-5 ${iconClass}`} />,
    };

    return (
      <div className={`${bgClass} p-2 rounded-lg`}>
        {iconMap[type] || <Bell className={`w-5 h-5 ${iconClass}`} />}
      </div>
    );
  };

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  return (
    <div className="min-h-screen bg-card">
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                Notifications
                {unreadCount > 0 && (
                  <span className="px-3 py-1 bg-primary text-white text-sm font-medium rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </h1>
              <p className="text-muted-foreground mt-1">Stay updated with your events and sales</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-8">
        {notifications && notifications.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-6 hover:bg-card transition-colors ${
                    !notification.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {getNotificationIcon(notification.type, notification.isRead)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className={`text-sm font-medium ${
                            notification.isRead ? "text-foreground" : "text-foreground font-semibold"
                          }`}
                        >
                          {notification.title}
                        </h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification._id)}
                          className="mt-2 text-xs text-primary hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-md p-12 text-center"
          >
            <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">No notifications yet</h3>
            <p className="text-muted-foreground">
              You'll see updates about your events, sales, and payouts here
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
