import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Trophy,
  TrendingUp,
  ShieldAlert,
  Coins,
  Bell,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  "trending-up": TrendingUp,
  "shield-alert": ShieldAlert,
  coins: Coins,
  bell: Bell,
};

const typeStyles: Record<string, string> = {
  achievement: "bg-yellow-500/10 text-yellow-500",
  level_up: "bg-primary/10 text-primary",
  trust_score: "bg-orange-500/10 text-orange-500",
  credits: "bg-emerald-500/10 text-emerald-500",
};

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { markAsRead, deleteNotification } = useNotifications();
  const Icon = iconMap[notification.icon] || Bell;

  const handleClick = () => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  return (
    <div
      className={cn(
        "relative flex gap-3 p-4 transition-colors cursor-pointer hover:bg-muted/50",
        !notification.is_read && "bg-muted/30"
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          "shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
          typeStyles[notification.type] || "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm text-foreground leading-tight">
            {notification.title}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              deleteNotification(notification.id);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: es,
          })}
        </p>
      </div>

      {!notification.is_read && (
        <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary" />
      )}
    </div>
  );
}
