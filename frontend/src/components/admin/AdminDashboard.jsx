import { useState } from "react";
import CalendarPage from "./CalendarPage";
import SchedulePage from "./SchedulePage";
import NotificationsPage from "./NotificationsPage";
import { Activity, Bell, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, LayoutDashboard, LogOut, Menu, Plus, Shield, UserCheck, Users, X, } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import AdminProfile from "./AdminProfile";
const admin = {
  name: "Mr. John Doe",
  id: "ADM-00001",
  role: "Administrator",
};

const initialExaminers = [
  {
    id: "EXM-20317",
    name: "Dr. Arvind Kumar",
    department: "Science & Technology",
    status: "Approved",
  },
  {
    id: "EXM-20318",
    name: "Dr. Priya Sharma",
    department: "Mathematics",
    status: "Pending",
  },
  
];

const initialSchedules = [
  {
    id: 1,
    examination: "National Eligibility Test",
    date: "15 Oct 2026",
    time: "10:00 AM",
    slot: "Slot A",
    duration: "3 Hours",
  },
  {
    id: 2,
    examination: "State Services Prelims",
    date: "20 Oct 2026",
    time: "02:00 PM",
    slot: "Slot B",
    duration: "3 Hours",
  },
];

const initialNotifications = [
  {
    id: 1,
    title: "System ready",
    message: "N.E.T.R.A. Admin Portal is ready.",
    time: "Today",
  },
  {
    id: 2,
    title: "System ready",
    message: "Reminder: Check the system settings.",
    time: "Today",
  },
  {
    id: 3,
    title: "System ready",
    message: "Reminder: Update your profile information.",
    time: "Today",
  },
];

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)] ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
      <Icon size={19} className="text-[#1d5b88]" />
      <h2 className="text-[15px] font-semibold text-slate-900">
        {title}
      </h2>
    </div>
  );
}

function StatCard({ icon: Icon, count, title, subtitle }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Icon size={20} />
      </div>

      <div className="mt-3 text-[28px] font-semibold leading-none text-slate-900">
        {count}
      </div>

      <div className="mt-2 text-sm font-semibold text-slate-900">
        {title}
      </div>

      <div className="mt-1 text-xs text-slate-500">
        {subtitle}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
const [view, setView] = useState("dashboard");
const [mobileSidebar, setMobileSidebar] = useState(false);
const [examiners, setExaminers] = useState(initialExaminers);
const [schedules,setSchedules] = useState(initialSchedules);
const [notifications, setNotifications] = useState(initialNotifications);
const [calendarEvents, setCalendarEvents] = useState([
  { id: 1, day: 6, month: 9, year: 2026, title: "Exam Commencement - NET", time: "10:00 AM", recipients: "All Examiners, Superintendents" },
  { id: 2, day: 15, month: 9, year: 2026, title: "National Eligibility Test", time: "10:00 AM", recipients: "All Examiners" },
  { id: 3, day: 15, month: 9, year: 2026, title: "PM Admin Meeting", time: "02:00 PM", recipients: "Superintendents" },
  { id: 4, day: 20, month: 9, year: 2026, title: "State Services Prelims", time: "02:00 PM", recipients: "All Examiners, Superintendents" },
  { id: 5, day: 28, month: 9, year: 2026, title: "UGC NET", time: "09:30 AM", recipients: "All Examiners, Superintendents" },
]);
const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 9, 1));
const [showEventModal, setShowEventModal] = useState(false);
const [newEvent, setNewEvent] = useState({
  title: "", date: "2026-10-17", time: "10:00", recipients: "All Examiners, Superintendents", message: "",
});
const [eventMessage, setEventMessage] = useState("");
  const pendingExaminers = examiners.filter(
    (examiner) => examiner.status === "Pending"
  ).length;

  const approvedExaminers = examiners.filter(
    (examiner) => examiner.status === "Approved"
  ).length;

  const approveExaminer = (id) => {
    setExaminers((current) =>
      current.map((examiner) =>
        examiner.id === id ? { ...examiner, status: "Approved" } : examiner
      ));
  };

  const rejectExaminer = (id) => {
    setExaminers((current) =>
      current.map((examiner) =>
        examiner.id === id ? { ...examiner, status: "Rejected" }: examiner
      ));
  };

  const navigate = (nextView) => {
    setView(nextView);
    setMobileSidebar(false);
  };
  
  const handleLogout = () => {
  const confirmed = window.confirm(
    "Are you sure you want to sign out of N.E.T.R.A.?"
  );

  if (confirmed) {
    window.location.href = "/";
  }
};
  const Sidebar = () => (
    <>
      {mobileSidebar && (
        <button aria-label="Close sidebar" onClick={() => setMobileSidebar(false)} className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"/>
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col bg-[#071c2f] text-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="px-6 pb-6 pt-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#16456b] shadow-lg">
              <Shield size={24} className="text-[#8fc9e8]" />
            </div>

            <div>
              <div className="text-[19px] font-semibold tracking-wide">
                N.E.T.R.A.
              </div>

              <div className="mt-0.5 max-w-[145px] text-[9px] leading-3 text-slate-300">
                Nodal Encrypted Transmission
                <br />
                & Retrieval for Assessments
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4">
          {[
            {id: "dashboard",label: "Dashboard",icon: LayoutDashboard,},
            {id: "calendar",label: "Calendar",icon: CalendarDays,},
            {id: "schedules",label: "Exam Schedule",icon: Clock3,},
            {id: "examiners",label: "Examiner Approval",icon: UserCheck,},
            {id: "notifications",label: "Notifications",icon: Bell,},
            {id: "activity",label: "Activity Log",icon: Activity,},
          ].map((item) => { 
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => navigate(item.id)} className={`mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                  view === item.id? "bg-[#164e7b] text-white shadow-sm": "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="my-5 h-px bg-white/10" />

          <button onClick={() => navigate("profile")}
            className="mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
            <Users size={19} />
            <span>Admin Profile</span>
          </button>

         <button onClick={handleLogout} className="mt-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
            <LogOut size={19} strokeWidth={1.8} />
            <span>Logout</span>
          </button>
        </nav>

        <div className="mt-auto px-7 pb-8">
          <div className="text-[12px] font-semibold tracking-[0.28em]">
            N.E.T.R.A.
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            Secure • Transparent • Trusted
          </div>
        </div>
      </aside>
    </>
  );

  const Header = () => (
    <header className="flex h-[80px] shrink-0 items-center border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <button onClick={() => setMobileSidebar(true)} className="mr-4 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden">
        <Menu size={21} />
      </button>

      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          Admin Portal
        </h1>

        <p className="text-xs text-slate-500">
          Examination Administration
        </p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3e6484] text-sm font-semibold text-white">
          AD
        </div>

        <div className="hidden sm:block">
          <div className="text-sm font-semibold text-slate-900">
            {admin.name}
          </div>

          <div className="text-xs text-slate-500">
            {admin.role} • {admin.id}
          </div>
        </div>
      </div>
    </header>
  );

  const Dashboard = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const monthName = calendarMonth.toLocaleString("en-US", { month: "long" });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const today = new Date();
    const upcomingEvents = calendarEvents
      .filter((event) => {
        const eventDate = new Date(event.year ?? year, event.month ?? month, event.day);
        return eventDate >= new Date(today.getFullYear(), today.getMonth(), today.getDate());
      })
      .sort((a, b) => new Date(a.year ?? year, a.month ?? month, a.day) - new Date(b.year ?? year, b.month ?? month, b.day))
      .slice(0, 4);

    const createEvent = (e) => {
      e.preventDefault();
      if (!newEvent.title.trim() || !newEvent.date) return;
      const [eventYear, eventMonth, eventDay] = newEvent.date.split("-").map(Number);
      const dateLabel = new Date(eventYear, eventMonth - 1, eventDay).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
      });
      const id = Date.now();
      const createdEvent = {
        id, day: eventDay, month: eventMonth - 1, year: eventYear,
        title: newEvent.title.trim(),
        time: newEvent.time ? new Date(`2000-01-01T${newEvent.time}`).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "Time not set",
        recipients: newEvent.recipients,
      };
      setCalendarEvents((current) => [...current, createdEvent]);
      setNotifications((current) => [{
        id,
        title: createdEvent.title,
        message: `${newEvent.message.trim() || "Event scheduled"} · ${dateLabel} · Recipients: ${createdEvent.recipients}`,
        time: "Just now",
      }, ...current]);
      setEventMessage("Event created and notification added to the dashboard. Actual delivery will require backend integration.");
      setCalendarMonth(new Date(eventYear, eventMonth - 1, 1));
      setNewEvent({ title: "", date: "2026-10-17", time: "10:00", recipients: "All Examiners, Superintendents", message: "" });
      setShowEventModal(false);
    };

    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-[#dce8f2] bg-gradient-to-r from-white to-[#edf6fc] px-6 py-5">
          <h1 className="text-2xl font-semibold tracking-tight text-[#071a3d]">Welcome back, {admin.name}</h1>
          <p className="mt-1 text-sm text-slate-500">Manage examinations, schedules and examiner access securely through N.E.T.R.A.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Users} count={examiners.length} title="Total Examiners" subtitle="Registered examiners" />
          <StatCard icon={UserCheck} count={approvedExaminers} title="Approved Examiners" subtitle="Allowed to access portal" />
          <StatCard icon={Clock3} count={pendingExaminers} title="Pending Approvals" subtitle="Needs administrator action" />
          <StatCard icon={CalendarDays} count={schedules.length} title="Upcoming Exams" subtitle="Scheduled examinations" />
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-2">
          <div className="space-y-5">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <CalendarDays size={19} className="text-[#1d5b88]" />
                  <h2 className="text-[15px] font-semibold text-slate-900">Upcoming Examinations</h2>
                </div>
                <button onClick={() => navigate("schedules")} className="text-xs font-semibold text-blue-700 hover:text-blue-900">View all <span aria-hidden="true">→</span></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[530px] text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Examination title</th>
                      <th className="px-3 py-3 font-semibold">Date & time</th>
                      <th className="px-3 py-3 font-semibold">Slot</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.slice(0, 4).map((schedule) => (
                      <tr key={schedule.id} className="border-t border-slate-100">
                        <td className="px-5 py-4 text-xs font-semibold text-slate-800">{schedule.examination}</td>
                        <td className="px-3 py-4 text-xs text-slate-500">{schedule.date}<br />{schedule.time}</td>
                        <td className="px-3 py-4 text-xs text-slate-500">{schedule.slot}<br />{schedule.duration}</td>
                        <td className="px-4 py-4"><span className="rounded-md bg-blue-50 px-2.5 py-1.5 text-[10px] font-semibold text-blue-700">Scheduled</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5"><Bell size={19} className="text-[#1d5b88]" /><h2 className="text-[15px] font-semibold text-slate-900">Recent Notifications</h2></div>
                <button onClick={() => navigate("notifications")} className="text-xs font-semibold text-blue-700 hover:text-blue-900">View all <span aria-hidden="true">→</span></button>
              </div>
              <div className="divide-y divide-slate-100">
                {notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="flex gap-3 px-5 py-3.5">
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-800">{notification.title}</div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{notification.message}</p>
                      <p className="mt-1.5 text-[10px] text-slate-400">{notification.time}</p>
                    </div>
                  </div>
                ))}
                {!notifications.length && <p className="p-6 text-sm text-slate-500">No notifications yet.</p>}
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5"><CalendarDays size={19} className="text-[#1d5b88]" /><h2 className="text-[15px] font-semibold text-slate-900">Calendar</h2></div>
                <button onClick={() => { setNewEvent((prev) => ({ ...prev, date: `${year}-${String(month + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}` })); setShowEventModal(true); }} className="inline-flex items-center gap-2 rounded-lg bg-[#176bb0] px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#125b95]"><Plus size={15} /> Create Event</button>
              </div>
              <div className="p-4 sm:p-5">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <button onClick={() => setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1))} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">Today</button>
                  <div className="flex overflow-hidden rounded-lg border border-slate-200">
                    <button aria-label="Previous month" onClick={() => setCalendarMonth(new Date(year, month - 1, 1))} className="px-3 py-2 text-slate-500 hover:bg-slate-50"><ChevronLeft size={15} /></button>
                    <button aria-label="Next month" onClick={() => setCalendarMonth(new Date(year, month + 1, 1))} className="border-l border-slate-200 px-3 py-2 text-slate-500 hover:bg-slate-50"><ChevronRight size={15} /></button>
                  </div>
                  <h3 className="ml-1 text-sm font-semibold text-slate-900">{monthName} {year}</h3>
                </div>
                <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-slate-200">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="border-b border-r border-slate-200 bg-slate-50 py-2 text-center text-[10px] font-semibold text-slate-500 last:border-r-0">{day}</div>)}
                  {Array.from({ length: firstDay + daysInMonth }, (_, i) => {
                    const day = i < firstDay ? null : i - firstDay + 1;
                    const dayEvents = calendarEvents.filter((event) => event.day === day && (event.month ?? 9) === month && (event.year ?? 2026) === year);
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                    return <div key={i} className={`min-h-[58px] border-b border-r border-slate-100 p-1 sm:min-h-[66px] ${day ? "bg-white" : "bg-slate-50/50"}`}>
                      {day && <><div className={`mb-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${isToday ? "bg-[#176bb0] font-bold text-white" : "text-slate-600"}`}>{day}</div><div className="space-y-1">{dayEvents.slice(0, 2).map((event) => <button key={event.id} title={`${event.title} · ${event.time || ""} · ${event.recipients || ""}`} onClick={() => { setNewEvent({ title: event.title, date: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`, time: "10:00", recipients: event.recipients || "All Examiners, Superintendents", message: "" }); setShowEventModal(true); }} className="block w-full truncate rounded border-l-2 border-[#1d5b88] bg-[#edf4fa] px-1 py-1 text-left text-[9px] font-medium leading-tight text-[#183d5b]">{event.title}</button>)}{dayEvents.length > 2 && <span className="text-[9px] text-slate-500">+{dayEvents.length - 2} more</span>}</div></>}
                    </div>;
                  })}
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500"><span className="h-2 w-2 rounded-sm bg-[#1d5b88]" /> Scheduled event <span className="ml-3 h-2 w-2 rounded-full bg-[#176bb0]" /> Today</div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5"><CalendarDays size={19} className="text-[#1d5b88]" /><h2 className="text-[15px] font-semibold text-slate-900">Upcoming Events</h2></div>
                <button onClick={() => navigate("calendar")} className="text-xs font-semibold text-blue-700 hover:text-blue-900">View all <span aria-hidden="true">→</span></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[450px] text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3 font-semibold">Event title</th><th className="px-3 py-3 font-semibold">Date & time</th><th className="px-3 py-3 font-semibold">Recipients</th><th className="px-3 py-3 font-semibold">Status</th></tr></thead>
                  <tbody>
                    {upcomingEvents.map((event) => <tr key={event.id} className="border-t border-slate-100"><td className="px-4 py-3 text-[11px] font-semibold text-slate-800">{event.title}</td><td className="px-3 py-3 text-[10px] text-slate-500">{String(event.day).padStart(2, "0")} {new Date(event.year ?? year, event.month ?? month, 1).toLocaleString("en-US", { month: "short", year: "numeric" })}<br />{event.time || "Time not set"}</td><td className="px-3 py-3 text-[10px] text-slate-500">{event.recipients || "All Examiners"}</td><td className="px-3 py-3"><span className="rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">Scheduled</span></td></tr>)}
                    {!upcomingEvents.length && <tr><td colSpan="4" className="px-4 py-6 text-center text-xs text-slate-500">No upcoming events.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>

        {eventMessage && <p role="status" className="text-xs text-emerald-700">{eventMessage}</p>}

        {showEventModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowEventModal(false); }}>
            <form onSubmit={createEvent} className="my-8 w-full max-w-xl rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div><h2 className="text-lg font-semibold text-slate-900">Create examination event</h2><p className="mt-1 text-xs text-slate-500">Schedule an event and prepare its notification.</p></div>
                <button type="button" onClick={() => setShowEventModal(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
              </div>
              <div className="space-y-4 px-6 py-5">
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Event title *</span><input required value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="e.g. Centre Allocation Deadline" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1d5b88] focus:ring-2 focus:ring-blue-100" /></label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Date *</span><input required type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1d5b88]" /></label>
                  <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Time</span><input type="time" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1d5b88]" /></label>
                </div>
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Notify recipients *</span><select value={newEvent.recipients} onChange={(e) => setNewEvent({ ...newEvent, recipients: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1d5b88]"><option>All Examiners, Superintendents</option><option>All Examiners</option><option>All Centre Superintendents</option></select></label>
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Notification message</span><textarea rows="3" value={newEvent.message} onChange={(e) => setNewEvent({ ...newEvent, message: e.target.value })} placeholder="Add instructions or details for recipients..." className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1d5b88]" /></label>
                <p className="text-xs leading-5 text-slate-500">This demo adds the event to the calendar and notification list. Actual delivery to users will be enabled when the backend is connected.</p>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4"><button type="button" onClick={() => setShowEventModal(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" className="rounded-lg bg-[#176bb0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#125b95]">Create event & notify</button></div>
            </form>
          </div>
        )}
      </div>
    );
  };

  const ExaminerApproval = () => (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#071a3d]">
          Examiner Approval
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Review and approve examiner accounts before allowing portal access.
        </p>
      </div>

      <Card className="overflow-hidden">
        <SectionHeader icon={UserCheck} title="Examiner Accounts" />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#fbfcfe] text-xs text-slate-500">
                <th className="px-5 py-3 font-medium">Examiner ID</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {examiners.map((examiner) => (
                <tr
                  key={examiner.id}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                    {examiner.id}
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-600">
                    {examiner.name}
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-600">
                    {examiner.department}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                        examiner.status === "Approved"? "bg-emerald-50 text-emerald-700"
                          : examiner.status === "Rejected"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {examiner.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    {examiner.status === "Pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveExaminer(examiner.id)}
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => rejectExaminer(examiner.id)}
                          className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {examiner.status === "Approved" && (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 size={14} />
                        Approved
                      </span>
                    )}

                    {examiner.status === "Rejected" && (
                      <span className="text-xs text-red-600">
                        Rejected
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );


  const ActivityLog = () => {
    const activityData = [
      {
        date: "15 Oct 2026",
        time: "09:30 AM",
        action: "Admin dashboard accessed",
        result: "Successful",
      },
      {
        date: "15 Oct 2026",
        time: "09:45 AM",
        action: "Examiner approval reviewed",
        result: "Successful",
      },
      {
        date: "15 Oct 2026",
        time: "10:00 AM",
        action: "Examination schedule viewed",
        result: "Successful",
      },
    ];

    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#071a3d]">
            Activity Log
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review administrative activities in the N.E.T.R.A. portal.
          </p>
        </div>

        <Card className="overflow-hidden">
          <SectionHeader
            icon={Activity}
            title="Recent Admin Activities"
          />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-[#fbfcfe] text-xs text-slate-500">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">Activity</th>
                  <th className="px-5 py-3 font-medium">Result</th>
                </tr>
              </thead>

              <tbody>
                {activityData.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {item.date}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {item.time}
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-slate-800">
                      {item.action}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        {item.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  

  const renderPage = () => {
      switch (view) {
      case "dashboard": return <Dashboard />;

      case "calendar":
      return (
      <CalendarPage
      calendarEvents={calendarEvents}
      setCalendarEvents={setCalendarEvents}
      selectedDate={selectedDate}
      setSelectedDate={setSelectedDate}
      eventTitle={eventTitle}
      setEventTitle={setEventTitle}
      setSchedules={setSchedules}
    />
  );

      case "schedules":
      return (
    <SchedulePage
      schedules={schedules}
      setSchedules={setSchedules}
    />
  );

      case "examiners":return <ExaminerApproval />;

      case "notifications":
      return (
    <NotificationsPage
      notifications={notifications}
      setNotifications={setNotifications}
    />
  );

  
case "activity":
  return <ActivityLog />;

case "profile":
  return <AdminProfile admin={admin} />;


      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa] text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header />

          <main className="flex-1 overflow-x-hidden px-4 py-4 sm:px-6 lg:px-5 lg:py-5">
            <div className="mx-auto w-full max-w-[1450px]">
              {renderPage()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}