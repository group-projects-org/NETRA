import { useState } from "react";
import { Bell, Send } from "lucide-react";

export default function NotificationsPage() {
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const sendNotification = () => {
    if (!message.trim()) return;

    // this will be replaced with an API call.
    setSuccessMessage("Notification sent successfully.");
    setMessage("");

    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#071a3d]">
          Notifications
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Send important messages and examination updates to examiners.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="mb-4 flex items-center gap-2.5">
          <Bell size={19} className="text-[#1d5b88]" />

          <h2 className="text-[15px] font-semibold text-slate-900">
            Send Notification
          </h2>
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write an important message for examiners..."
          rows={4}
          className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-[#4d83aa] focus:bg-white"
        />

        <button
          onClick={sendNotification}
          className="mt-3 flex items-center gap-2 rounded-lg bg-[#176bb0] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#125b95]"
        >
          <Send size={16} />
          Send Notification
        </button>

        {successMessage && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {successMessage}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
          <Bell size={19} className="text-[#1d5b88]" />

          <h2 className="text-[15px] font-semibold text-slate-900">
            Recent Notifications
          </h2>
        </div>

        <div className="p-10 text-center text-sm text-slate-400">
          No notifications available.
        </div>
      </div>
    </div>
  );
}