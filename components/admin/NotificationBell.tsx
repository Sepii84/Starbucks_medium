import { Bell } from "lucide-react";

export function NotificationBell({ count }: { count: number }) {
  return (
    <span className="relative inline-flex">
      <Bell size={18} />
      {count > 0 && (
        <span className="absolute -right-2 -top-2 min-w-5 rounded-full bg-primary px-1.5 py-0.5 text-center text-[10px] font-bold text-on-primary">
          {count}
        </span>
      )}
    </span>
  );
}
