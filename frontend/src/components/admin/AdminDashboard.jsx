import { useEffect, useState } from "react";
import CalendarPage from "./CalendarPage";
import SchedulePage from "./SchedulePage";
import NotificationsPage from "./NotificationsPage";
import {Activity,Bell,CalendarDays,CheckCircle2,ChevronRight,Clock3,FileText,LayoutDashboard,LogOut,Menu,Shield,UserCheck,Users,X,} from "lucide-react";

const admin = {
  name: "N.E.T.R.A. Administrator",
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
  {
    id: "EXM-20319",
    name: "Dr. Rahul Verma",
    department: "Physics",
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
const [examiners, setExaminers] = useState(() => {
  const saved = localStorage.getItem("netra_examiners");
  return saved ? JSON.parse(saved) : initialExaminers;
});

useEffect(() => {
  localStorage.setItem(
    "netra_examiners",
    JSON.stringify(examiners)
  );
}, [examiners]);

const [schedules,setSchedules] = useState(initialSchedules);
const [notifications, setNotifications] = useState(initialNotifications);

const [calendarEvents, setCalendarEvents] = useState([
  {
    id: 1,
    day: 15,
    title: "National Eligibility Test",
  },
  {
    id: 2,
    day: 20,
    title: "State Services Prelims",
  },
]);

const [selectedDate, setSelectedDate] = useState(null);
const [eventTitle, setEventTitle] = useState("");

  const pendingExaminers = examiners.filter(
    (examiner) => examiner.status === "Pending"
  ).length;

  const approvedExaminers = examiners.filter(
    (examiner) => examiner.status === "Approved"
  ).length;

  const approveExaminer = (id) => {
    setExaminers((current) =>
      current.map((examiner) =>
        examiner.id === id
          ? { ...examiner, status: "Approved" }
          : examiner
      )
    );
  };

  const rejectExaminer = (id) => {
    setExaminers((current) =>
      current.map((examiner) =>
        examiner.id === id
          ? { ...examiner, status: "Rejected" }
          : examiner
      )
    );
  };

  const navigate = (nextView) => {
    setView(nextView);
    setMobileSidebar(false);
  };

  const Sidebar = () => (
    <>
      {mobileSidebar && (
        <button
          aria-label="Close sidebar"
          onClick={() => setMobileSidebar(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col bg-[#071c2f] text-white transition-transform duration-200 lg:static lg:translate-x-0 ${
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
            {
              id: "dashboard",
              label: "Dashboard",
              icon: LayoutDashboard,
            },
            {
              id: "calendar",
              label: "Calendar",
              icon: CalendarDays,
            },
            {
              id: "schedules",
              label: "Exam Schedule",
              icon: Clock3,
            },
            {
              id: "examiners",
              label: "Examiner Approval",
              icon: UserCheck,
            },
            {
              id: "notifications",
              label: "Notifications",
              icon: Bell,
            },
            {
              id: "activity",
              label: "Activity Log",
              icon: Activity,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                  view === item.id
                    ? "bg-[#164e7b] text-white shadow-sm"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="my-5 h-px bg-white/10" />

          <button
            onClick={() => navigate("profile")}
            className="mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <Users size={19} />
            <span>Admin Profile</span>
          </button>

          <button
            onClick={() => navigate("logout")}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <LogOut size={19} />
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
      <button
        onClick={() => setMobileSidebar(true)}
        className="mr-4 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      >
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

  const Dashboard = () => (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-xl border border-[#dce8f2] bg-gradient-to-r from-white via-white to-[#edf6fc] px-6 py-5">
        <div className="relative z-10">
          <h1 className="text-[25px] font-semibold tracking-tight text-[#071a3d]">
            Welcome, Administrator
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage examinations, schedules and examiner access securely
            through N.E.T.R.A.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          count={examiners.length}
          title="Total Examiners"
          subtitle="Registered examiners"
        />

        <StatCard
          icon={UserCheck}
          count={approvedExaminers}
          title="Approved Examiners"
          subtitle="Allowed to access portal"
        />

        <StatCard
          icon={Clock3}
          count={pendingExaminers}
          title="Pending Approvals"
          subtitle="Needs administrator action"
        />

        <StatCard
          icon={CalendarDays}
          count={schedules.length}
          title="Upcoming Exams"
          subtitle="Scheduled examinations"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Upcoming exams */}
        <Card>
          <SectionHeader
            icon={CalendarDays}
            title="Upcoming Examinations"
          />

          <div className="divide-y divide-slate-100">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-800">
                    {schedule.examination}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {schedule.date} • {schedule.time}
                  </div>

                  <div className="mt-2 text-xs text-slate-400">
                    {schedule.slot} • {schedule.duration}
                  </div>
                </div>

                <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  Scheduled
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <SectionHeader icon={Bell} title="Recent Notifications" />

          <div>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="border-b border-slate-100 p-5 last:border-0"
              >
                <div className="flex gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500" />

                  <div>
                    <div className="text-sm font-medium text-slate-800">
                      {notification.title}
                    </div>

                    <div className="mt-1 text-xs leading-5 text-slate-500">
                      {notification.message}
                    </div>

                    <div className="mt-2 text-[10px] text-slate-400">
                      {notification.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

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
                        examiner.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700"
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


  const renderPage = () => {
    switch (view) {
      case "dashboard":
        return <Dashboard />;

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

      case "examiners":
        return <ExaminerApproval />;

      case "notifications":
  return (
    <NotificationsPage
      notifications={notifications}
      setNotifications={setNotifications}
    />
  );

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa] text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header />

          <main className="flex-1 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <div className="mx-auto w-full max-w-[1450px]">
              {renderPage()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}