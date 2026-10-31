import { Bell } from "lucide-react";
export default function Notifications({
  Card,
  SectionHeader,
  notifications,
  setNotificationOpen,
}) {
  return (
    <Card>
      <SectionHeader
        icon={Bell}
        title="Notifications"
        action="View all"
        onAction={() => setNotificationOpen(true)}
      />

      <div className="divide-y divide-slate-100">
        {notifications.slice(0, 4).map((item) => (
          <div key={item.id} className="px-4 py-3">
            <div className="flex gap-3">
              <span
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                  item.type === "warning"
                    ? "bg-red-500"
                    : item.type === "info"
                    ? "bg-blue-500"
                    : "bg-emerald-500"
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <p className="text-xs font-medium text-slate-800">{item.title}</p>
                  <span className="text-[10px] text-slate-400">{item.time}</span>
                </div>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  {item.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
