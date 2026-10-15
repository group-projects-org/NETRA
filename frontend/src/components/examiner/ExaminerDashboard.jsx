import { useEffect, useMemo, useRef, useState } from "react";
import {Activity, AlertCircle, ArrowLeft, Bell, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, Circle, Clock3, FileCheck2, FileText, FileUp, Filter, HelpCircle, Info,KeyRound,
LayoutDashboard, LifeBuoy, LockKeyhole, LogOut,BookOpen, Menu, MoreVertical, Search, Settings, Shield, ShieldCheck, Upload, User,UserCircle, X,ClipboardList,CalendarClock,History,} from "lucide-react";
import Notifications from "./Notifications";
import UpcomingSchedule from "./UpcomingSchedule";
import UploadQuestionPaper from "./UploadQuestionPaper";
import ExaminationCalendar from "./ExaminationCalendar";
import ThemeToggle from "../ThemeToggle";
/*mock data*/
const examiner = {
  name: "Dr. Arvind Kumar",
  id: "EXM-20317",
  role: "Examiner",
  organization: "National Examination Authority",
  department: "Science & Technology",
  email: "arvind.kumar@example.gov.in",
  phone: "+91 98XXXXXX21",
  status: "Active",
  lastLogin: "04 Oct 2026, 08:32 PM",
};

const initialPapers = [
  {
    id: "NETRA-QP-0043",
    examination: "State Services Prelims",
    subject: "General Studies",
    set: "C",
    date: "14 Nov 2026",
    shift: "Shift 1",
    time: "10:00 AM",
    duration: "3 Hours",
    stage: "Under Processing",
    updated: "12 Dec 2025",
    updatedTime: "09:24 AM",
    file: "state_services_gs_set_c.pdf",
    size: "8.4 MB",
    uploaded: "02 Oct 2026, 11:42 AM",
    integrity: "Verified",
  },
  {
    id: "NETRA-QP-0042",
    examination: "National Eligibility Test",
    subject: "Chemistry",
    set: "B",
    date: "14 Nov 2026",
    shift: "Shift 2",
    time: "02:00 PM",
    duration: "3 Hours",
    stage: "Action Required",
    updated: "11 Dec 2025",
    updatedTime: "04:18 PM",
    file: "net_chemistry_set_b.pdf",
    size: "7.1 MB",
    uploaded: "01 Oct 2026, 02:14 PM",
    integrity: "Verified",
    action:
      "Examination schedule does not match the assigned schedule. Please verify and resubmit.",
  },

];

const initialNotifications = [
  {
    id: 1,
    title: "Action required on submitted paper",
    message: "NETRA-QP-0042 needs your attention.",
    time: "11:20 AM",
    type: "warning",
    unread: true,
  },
  {
    id: 2,
    title: "System update",
    message: "Security patch applied successfully.",
    time: "10:05 AM",
    type: "info",
    unread: true,
  },
];

const activityData = [
  {
    date: "04 Oct 2026",
    time: "11:42 AM",
    action: "Question paper uploaded",
    paper: "NETRA-QP-0043",
    result: "Success",
  },

  {
    date: "02 Oct 2026",
    time: "10:12 AM",
    action: "Signed in",
    paper: "—",
    result: "Verified",
  },
];
const assignedTasks = [
  {
    id: "EX-102",
    examination: "National Eligibility Test",
    subject: "Computer Networks",
    required: 10,
    completed: 0,
    deadline: "10 Nov 2026",
    status: "Not Started",
  },
  {
    id: "EX-103",
    examination: "State Services Examination",
    subject: "General Studies",
    required: 20,
    completed: 12,
    deadline: "15 Nov 2026",
    status: "In Progress",
  },
];

const recentActivity = [
  {
    id: 1,
    title: "Question paper uploaded",
    description: "NETRA-QP-0043 submitted for processing",
    time: "04 Oct 2026 · 11:42 AM",
    type: "success",
  },
  {
    id: 2,
    title: "Assignment received",
    description: "EX-102 · Computer Networks",
    time: "03 Oct 2026 · 02:15 PM",
    type: "info",
  },
  {
    id: 3,
    title: "Action required",
    description: "NETRA-QP-0042 needs your attention",
    time: "02 Oct 2026 · 11:20 AM",
    type: "warning",
  },
];

function StatusBadge({ stage }) {
  const styles = {
    Draft: "bg-slate-100 text-slate-700 border-slate-200",
    Submitted: "bg-blue-50 text-blue-700 border-blue-200",
    "Under Processing": "bg-amber-50 text-amber-700 border-amber-200",
    Finalized: "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Action Required": "bg-violet-50 text-violet-700 border-violet-200",
  };

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-medium ${
        styles[stage] || styles.Draft
      }`}
    >
      {stage}
    </span>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)] ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, action, onAction }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
      <div className="flex items-center gap-2.5">
        <Icon size={19} className="text-[#1d5b88]" />
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
      </div>

      {action && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-xs font-medium text-[#1264a3] transition hover:text-[#0b4b7a]"
        >
          {action}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, count, title, subtitle, tone, onClick }) {
  const tones = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      border: "hover:border-blue-200",
    },
    amber: {
      icon: "bg-amber-50 text-amber-600",
      border: "hover:border-amber-200",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-600",
      border: "hover:border-emerald-200",
    },
    purple: {
      icon: "bg-violet-50 text-violet-600",
      border: "hover:border-violet-200",
    },
  };

  const current = tones[tone];
  return (
    <button onClick={onClick} className={`group rounded-xl border border-slate-200 bg-white p-4 text-left shadow-[0_2px_10px_rgba(15,23,42,0.025)] transition hover:-translate-y-[1px] ${current.border}`}>
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${current.icon}`}>
          <Icon size={20} />
        </div>

        <ChevronRight size={17} className="mt-1 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"/>
      </div>

      <div className="mt-3 text-[28px] font-semibold leading-none text-slate-900">{count} </div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
    </button>
  );
}

export default function ExaminerDashboard() {
  const [view, setView] = useState("dashboard");
  const [papers, setPapers] = useState(initialPapers);
  const [notifications, setNotifications] = useState(() => {
  const saved = localStorage.getItem("netra_notifications");
  return saved ? JSON.parse(saved) : initialNotifications;
  });
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [search, setSearch] = useState("");
  const [paperFilter, setPaperFilter] = useState("All");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const counts = useMemo(() => {
    return {
      Draft: papers.filter((p) => p.stage === "Draft").length,
      Submitted: papers.filter(
        (p) =>
          p.stage === "Submitted" || p.stage === "Under Processing"
      ).length,
      Finalized: papers.filter((p) => p.stage === "Finalized").length,
      Action: papers.filter((p) => p.stage === "Action Required").length,
    };
  }, [papers]);

  const filteredPapers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return papers.filter((paper) => {
      const matchesFilter =paperFilter === "All" || paper.stage === paperFilter;
      const matchesSearch = !q || paper.id.toLowerCase().includes(q) || paper.examination.toLowerCase().includes(q) || paper.subject.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
    }, [papers, search, paperFilter]);


  const navigate = (nextView) => {
    setView(nextView);
    setSelectedPaper(null);
    setMobileSidebar(false);
    setNotificationOpen(false);
    setProfileOpen(false);
  };

  const openPaper = (paper) => {
    setSelectedPaper(paper);
    setView("paper-detail");
    setMobileSidebar(false);
  };

  const submitMockUpload = (formData) => {
    if (!selectedFile) {
      setUploadMessage("Please select a PDF file first.");
      return;
    }
const selectedSchedule = {
  "schedule-1": {
    date: "14 Nov 2026",
    shift: "Shift 1",
    time: "10:00 AM",
    duration: "3 Hours",
  },
  "schedule-2": {
    date: "14 Nov 2026",
    shift: "Shift 2",
    time: "02:00 PM",
    duration: "3 Hours",
  },
}[formData.schedule];

const newPaper = {
  id: `NETRA-QP-${String(44 + papers.length).padStart(4, "0")}`,

  examination: formData.examination,
  subject: formData.subject,
  set: formData.set,
  date: selectedSchedule.date,
  shift: selectedSchedule.shift,
  time: selectedSchedule.time,
  duration: selectedSchedule.duration,
  language: formData.language,
  stage: "Submitted",
  updated: "05 Oct 2026",
  updatedTime: "Now",
  file: selectedFile.name,
  size: `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`,
  uploaded: "05 Oct 2026, Now",

  integrity: "Verified",
};

    setPapers((current) => [newPaper, ...current]);
    setSelectedFile(null);
    setUploadMessage(
      "Question paper submitted successfully. Mock processing has started."
    );

    setTimeout(() => {
      setUploadMessage("");
    }, 4000);
  };

  const handleLogout = () => {
    const confirmed = window.confirm(
      "Are you sure you want to sign out of N.E.T.R.A.?"
    );
    if (confirmed) {
      setView("logout");
    }
  };

  const unreadNotifications = notifications.filter((n) => n.unread).length;
  const markNotificationsRead = () => {
    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        unread: false,
      }))
    );
  };

  const primaryNav = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
     {
      id: "create-questions",
      label: "Create Questions",
      icon: BookOpen,
    },
    {
      id: "papers",
      label: "My Papers",
      icon: FileText,
    },
    {
      id: "activity",
      label: "Activity Log",
      icon: Activity,
    }, 
  ];

  const secondaryNav = [
    {
      id: "profile",
      label: "Profile",
      icon: User,
    },
    {
      id: "help",
      label: "Help & Support",
      icon: CircleHelp,
    },
  ];

  const isActive = (id) => {
    if (id === "dashboard") return view === "dashboard";
    if (id === "papers") {
      return view === "papers" || view === "paper-detail";
    }
    return view === id;
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
          {primaryNav.map((item) => {
            const Icon = item.icon;

            return (
              <button key={item.id} onClick={() => navigate(item.id)}
                className={`mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                  isActive(item.id) ? "bg-[#164e7b] text-white shadow-sm": "text-slate-300 hover:bg-white/5 hover:text-white"
                }`} >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="my-5 h-px bg-white/10" />
          {secondaryNav.map((item) => {
            const Icon = item.icon;

            return (
              <button key={item.id} onClick={() => navigate(item.id)} className={`mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm transition ${
                  isActive(item.id) ? "bg-[#164e7b] text-white": "text-slate-300 hover:bg-white/5 hover:text-white"
                }`} >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <button onClick={handleLogout} className="mt-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
            <LogOut size={19} strokeWidth={1.8} />
            <span>Logout</span>
          </button>
        </nav>

        {/* Sidebar footer */}
        <div className="mt-auto overflow-hidden px-7 pb-8 pt-10">
          <div className="relative h-20 opacity-30">
            <div className="absolute -bottom-16 -left-16 h-28 w-72 rotate-[-12deg] rounded-[50%] border-t border-[#4384b4]" />
            <div className="absolute -bottom-12 -left-20 h-24 w-80 rotate-[-12deg] rounded-[50%] border-t border-[#4384b4]" />
            <div className="absolute -bottom-8 -left-10 h-20 w-72 rotate-[-12deg] rounded-[50%] border-t border-[#4384b4]" />
          </div>

          <div className="mt-1">
            <div className="text-[12px] font-semibold tracking-[0.28em]">
              N.E.T.R.A.
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              Secure • Transparent • Trusted
            </div>
          </div>
        </div>
      </aside>
    </>
  );
  const Header = () => (
    <header className="relative flex h-[80px] shrink-0 items-center border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <button onClick={() => setMobileSidebar(true)}
        className="mr-4 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
      >
        <Menu size={21} />
      </button>

      {/* Search */}
      <div className="relative w-full max-w-[520px]">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#46718f]"/>

        <input value={search} onChange={(e) => { setSearch(e.target.value);
         if (view !== "papers") {
              setView("papers");
            }
          }}
          placeholder="Search by paper ID, examination, subject..."
          className="h-[42px] w-full rounded-lg border border-[#d5e0eb] bg-[#f7fafd] pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#4d83aa] focus:bg-white focus:ring-2 focus:ring-[#dbeaf5]"
        />
      </div>
      <div className="ml-auto flex items-center gap-4">
              <ThemeToggle />
        {/* Notifications */}
        <div className="relative">
          <button  onClick={() => { setNotificationOpen((v) => !v);setProfileOpen(false);}}
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100">
            <Bell size={21} strokeWidth={1.8} />

            {unreadNotifications > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-semibold text-white">
                {unreadNotifications}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div className="absolute right-0 top-12 z-50 w-[350px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div className="font-semibold text-slate-900">
                  Notifications
                </div>

                <button onClick={markNotificationsRead} className="text-xs font-medium text-[#1264a3]">
                  Mark all as read
                </button>
              </div>

              <div className="max-h-[380px] overflow-y-auto">
                {notifications.map((notification) => (
                  <div key={notification.id} className={`border-b border-slate-100 px-4 py-3 last:border-0 ${
                      notification.unread ? "bg-[#f8fbfe]" : ""
                    }`}>
                    <div className="flex gap-3">
                      <div
                        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                          notification.type === "warning"
                            ? "bg-red-500"
                            : notification.type === "info"
                            ? "bg-blue-500"
                            : "bg-emerald-500"
                        }`}/>

                      <div className="min-w-0">
                        <div className="flex justify-between gap-3">
                          <p className="text-sm font-medium text-slate-800">
                            {notification.title}
                          </p>
                          <span className="whitespace-nowrap text-[10px] text-slate-400">
                            {notification.time}
                          </span>
                        </div>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button onClick={() => {
              setProfileOpen((v) => !v);
              setNotificationOpen(false);
            }}
            className="flex items-center gap-3 rounded-lg px-1.5 py-1.5 transition hover:bg-slate-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3e6484] text-sm font-semibold text-white">
              AK
            </div>

            <div className="hidden text-left sm:block">
              <div className="text-sm font-semibold text-slate-900">
                Dr. Arvind Kumar
              </div>
              <div className="text-xs text-slate-500">
                Examiner <span className="mx-1">•</span> {examiner.id}
              </div>
            </div>

            <ChevronDown size={16} className={`hidden text-slate-500 transition sm:block ${profileOpen ? "rotate-180" : ""}`}/>
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-14 z-50 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <button
                onClick={() => navigate("profile")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                <UserCircle size={17} />
                My Profile
              </button>

              <div className="my-1 h-px bg-slate-100" />
              
              <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50">
                <LogOut size={17} />
                Logout
              </button>
          
            </div>
            
          )}
        </div>
      </div>
    </header>
  );
 const Dashboard = () => (
  <div className="space-y-5">
    {/* Welcome banner */}
    <div className="relative overflow-hidden rounded-xl border border-[#dce8f2] bg-gradient-to-r from-white via-white to-[#edf6fc] px-6 py-5">
      <div className="relative z-10">
        <h1 className="text-[25px] font-semibold tracking-tight text-[#071a3d]">
          Good Morning, Dr. Arvind Kumar
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track your assigned examinations, deadlines, and submission progress.
        </p>
      </div>
      <div className="absolute -right-10 -top-20 h-48 w-[420px] rounded-[50%] border border-[#d5e8f5] opacity-70" />
      <div className="absolute right-20 top-4 h-32 w-64 rounded-[50%] border border-[#d5e8f5] opacity-60" />
      <div className="absolute right-6 top-5 hidden text-xs text-slate-500 md:block">
        04 October 2026, Sunday
      </div>
    </div>

    {/* Summary cards */}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={FileText} count={counts.Draft} title="Draft Papers" subtitle="Not yet submitted" tone="blue" onClick={() => { setPaperFilter("Draft"); setView("papers"); }} />
      <StatCard icon={Clock3} count={counts.Submitted} title="Submitted Papers" subtitle="Under system processing" tone="amber" onClick={() => { setPaperFilter("Submitted"); setView("papers"); }} />
      <StatCard icon={FileCheck2} count={counts.Finalized} title="Finalized Papers" subtitle="Ready for scheduled release" tone="green" onClick={() => { setPaperFilter("Finalized"); setView("papers"); }} />
      <StatCard icon={AlertCircle} count={counts.Action} title="Action Required" subtitle="Needs your attention" tone="purple" onClick={() => { setPaperFilter("Action Required"); setView("papers"); }} />
    </div>

    {/* Main dashboard layout */}
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
  {/* Left column: Assigned Tasks + Recent Activity */}
  <div className="space-y-5">
    {/* Assigned Tasks */}
    <Card className="overflow-hidden">
      <SectionHeader icon={ClipboardList} title="Assigned Tasks" />

      <div className="divide-y divide-slate-100">
        {(showAllTasks ? assignedTasks : assignedTasks.slice(0, 2)).map((task) => {
          const progress = Math.min(100, Math.round((task.completed / task.required) * 100));
          const completed = task.completed >= task.required;

          return (
            <div key={task.id} className="p-5 transition hover:bg-slate-50/70">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-[#1765a0]">{task.id}</span>
                    <span className={`rounded-md px-2 py-1 text-[11px] font-medium ${completed ? "bg-emerald-50 text-emerald-700" : task.completed > 0 ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                      {completed ? "Completed" : task.status}
                    </span>
                  </div>

                  <h3 className="mt-2 text-sm font-semibold text-slate-900">{task.examination}</h3>
                  <p className="mt-1 text-xs text-slate-500">Subject: {task.subject}</p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">Deadline</p>
                  <p className="mt-1 flex items-center justify-end gap-1.5 text-xs font-semibold text-slate-700">
                    <CalendarClock size={14} className="text-amber-600" />
                    {task.deadline}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500">Question completion</span>
                  <span className="font-semibold text-slate-700">{task.completed} of {task.required}</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full transition-all ${completed ? "bg-emerald-500" : "bg-blue-600"}`} style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button type="button" onClick={() => navigate("create-questions")} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#1765a0] transition hover:border-blue-200 hover:bg-blue-50">
                  {completed ? "View assignment" : "Continue assignment"}
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3">
        <p className="text-xs text-slate-500">
          Showing {Math.min(showAllTasks ? assignedTasks.length : 2, assignedTasks.length)} of {assignedTasks.length} assignments
        </p>

        {assignedTasks.length > 2 && (
          <button type="button" onClick={() => setShowAllTasks((current) => !current)} className="inline-flex items-center gap-1 text-xs font-semibold text-[#1264a3] hover:text-[#0b4b7a]">
            {showAllTasks ? "Show fewer" : "View all assignments"}
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </Card>

    {/* Recent Activity */}
    <Card className="overflow-hidden">
      <SectionHeader icon={History} title="Recent Activity" />

      <div className="divide-y divide-slate-100">
        {recentActivity.slice(0, 4).map((item) => (
          <div key={item.id} className="flex gap-3 px-4 py-4">
            <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.type === "success" ? "bg-emerald-500" : item.type === "warning" ? "bg-amber-500" : "bg-blue-500"}`} />

            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
              <p className="mt-1.5 text-[10px] text-slate-400">{item.time}</p>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={() => navigate("activity")} className="flex w-full items-center justify-center gap-1 border-t border-slate-100 px-4 py-3 text-xs font-semibold text-[#1264a3] transition hover:bg-slate-50">
        View activity log <ChevronRight size={14} />
      </button>
    </Card>
  </div>

  {/* Right column: Schedule + Deadlines + Calendar */}
  <div className="space-y-5">
    <UpcomingSchedule Card={Card} SectionHeader={SectionHeader} navigate={navigate} />

    {/* Upcoming Deadlines */}
    <Card className="overflow-hidden">
      <SectionHeader icon={CalendarClock} title="Upcoming Deadlines" />

      <div className="space-y-4 p-5">
        {assignedTasks
          .filter((task) => task.completed < task.required)
          .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
          .slice(0, 3)
          .map((task) => (
            <div key={task.id} className="flex gap-3">
              <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                <span className="text-[9px] font-semibold uppercase text-slate-500">{task.deadline.split(" ")[1]}</span>
                <span className="text-sm font-bold text-slate-800">{task.deadline.split(" ")[0]}</span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{task.subject}</p>
                <p className="mt-1 text-xs text-slate-500">{task.id} · Due {task.deadline}</p>
                <p className="mt-1 text-xs font-medium text-amber-700">{task.required - task.completed} questions remaining</p>
              </div>
            </div>
          ))}

        {assignedTasks.every((task) => task.completed >= task.required) && (
          <p className="py-3 text-sm text-slate-500">No pending assignment deadlines.</p>
        )}
      </div>
    </Card>

   <ExaminationCalendar />

      </div>
  </div>
</div>

);

  const MyPapers = () => (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#071a3d]">
          My Question Papers
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your submitted question papers and track their processing
          status.
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>

            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search paper ID, examination, subject..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-[#4d83aa] focus:bg-white focus:ring-2 focus:ring-[#e2eef7]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter size={15} className="text-slate-400" />

            {[
              "All",
              "Draft",
              "Submitted",
              "Finalized",
              "Action Required",
            ].map((filter) => (
              <button
                key={filter}
                onClick={() => setPaperFilter(filter)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  paperFilter === filter
                    ? "bg-[#164e7b] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#fbfcfe] text-xs text-slate-500">
                <th className="px-5 py-3 font-medium">Paper ID</th>
                <th className="px-5 py-3 font-medium">Examination</th>
                <th className="px-5 py-3 font-medium">Subject</th>
                <th className="px-5 py-3 font-medium">Set</th>
                <th className="px-5 py-3 font-medium">Exam Schedule</th>
                <th className="px-5 py-3 font-medium">Current Stage</th>
                <th className="px-5 py-3 font-medium">Updated</th>
                <th className="px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredPapers.map((paper) => (
                <tr
                  key={paper.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-[#fbfdff]"
                >
                  <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                    {paper.id}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600">
                    {paper.examination}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600">
                    {paper.subject}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600">
                    {paper.set}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-600">
                    <div>{paper.date}</div>
                    <div className="mt-1 text-[10px] text-slate-400">
                      {paper.shift} • {paper.time}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge stage={paper.stage} />
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-500">
                    {paper.updated}
                  </td>

                  <td className="px-5 py-4">
                    <button onClick={() => openPaper(paper)} className="flex items-center gap-1 text-xs font-medium text-[#1264a3] hover:text-[#0a4c79]" >
                      View
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPapers.length === 0 && (
            <div className="px-5 py-14 text-center">
              <FileText
                size={28}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-medium text-slate-700">
                No question papers found
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Try changing your search or filter.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const PaperDetail = () => {
    if (!selectedPaper) return null;
    const isActionRequired =
      selectedPaper.stage === "Action Required";

    return (
      <div className="space-y-5">
        <button onClick={() => setView("papers")} className="flex items-center gap-2 text-sm font-medium text-[#1264a3] hover:text-[#0b4b7a]"
        >
          <ArrowLeft size={16} />
          My Question Papers
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-[#071a3d]">
                {selectedPaper.id}
              </h1>

              <StatusBadge stage={selectedPaper.stage} />
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Question paper submission details and processing information.
            </p>
          </div>
        </div>

        {isActionRequired && (
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
            <div className="flex gap-3">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-violet-600"
              />

              <div>
                <h2 className="text-sm font-semibold text-violet-900">
                  Action required
                </h2>

                <p className="mt-1 text-sm leading-6 text-violet-800">
                  {selectedPaper.action}
                </p>

                <button onClick={() => setView("dashboard")} className="mt-3 rounded-md bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-700" >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="space-y-5">
            <Card>
              <SectionHeader
                icon={CalendarDays}
                title="Examination Information"
              />

              <div className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
                {[
                  ["Examination", selectedPaper.examination],
                  ["Subject", selectedPaper.subject],
                  ["Paper / Set", selectedPaper.set],
                  ["Examination Date", selectedPaper.date],
                  ["Shift", selectedPaper.shift],
                  ["Start Time", selectedPaper.time],
                  ["Duration", selectedPaper.duration],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      {label}
                    </div>

                    <div className="mt-1.5 text-sm font-medium text-slate-800">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionHeader
                icon={FileText}
                title="Question Paper File"
              />

              <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <FileText size={21} />
                  </div>

                  <div>
                    <div className="text-sm font-medium text-slate-800">
                      {selectedPaper.file || "No file uploaded"}
                    </div>

                    {selectedPaper.size && (
                      <div className="mt-1 text-xs text-slate-500">
                        {selectedPaper.size}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                  <CheckCircle2 size={15} />
                  {selectedPaper.integrity}
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <SectionHeader
              icon={Activity}
              title="Processing Timeline"
            />

            <div className="p-5">
              {[
                ["Paper prepared", true],
                ["File uploaded", true],
                ["Integrity verified", true],
                [
                  "System processing",
                  selectedPaper.stage !== "Draft",
                ],
                [
                  "Current stage",
                  selectedPaper.stage !== "Draft",
                ],
              ].map(([label, complete], index) => (
                <div key={label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    {complete ? (
                      <CheckCircle2
                        size={18}
                        className="text-emerald-600"
                      />
                    ) : (
                      <Circle
                        size={18}
                        className="text-slate-300"
                      />
                    )}

                    {index < 4 && (
                      <div
                        className={`h-8 w-px ${
                          complete
                            ? "bg-emerald-200"
                            : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>

                  <div className="pb-5">
                    <div
                      className={`text-sm ${
                        complete
                          ? "font-medium text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
                      {label}
                    </div>

                    {index === 4 && (
                      <div className="mt-1">
                        <StatusBadge stage={selectedPaper.stage} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const ActivityLog = () => (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#071a3d]">
          Activity Log
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Read-only record of activity performed on your N.E.T.R.A. account.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Activity size={19} className="text-[#1d5b88]" />
            <h2 className="text-[15px] font-semibold text-slate-900">
              Account Activity
            </h2>
          </div>

          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500">
            Read only
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-[#fbfcfe] text-xs text-slate-500">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Activity</th>
                <th className="px-5 py-3 font-medium">Paper ID</th>
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

                  <td className="px-5 py-4 text-xs text-slate-600">
                    {item.paper}
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                      <CheckCircle2 size={14} />
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


  const ProfilePage = () => (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#071a3d]">
          Profile
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          View your examiner account information.
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-5 border-b border-slate-100 p-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#3e6484] text-xl font-semibold text-white">
            AK
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {examiner.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {examiner.role} • {examiner.id}
            </p>

            <span className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 size={13} />
              Account Active
            </span>
          </div>
        </div>

        <div className="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
          {[
            ["Examiner ID", examiner.id],
            ["Role", examiner.role],
            ["Organization", examiner.organization],
            ["Department", examiner.department],
            ["Email", examiner.email],
            ["Phone", examiner.phone],
            ["Account Status", examiner.status],
            ["Last Login", examiner.lastLogin],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {label}
              </div>

              <div className="mt-1.5 text-sm font-medium text-slate-800">
                {value}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const HelpPage = () => {
    const faqs = [
      [
        "How do I upload a question paper?",
        "Use the Upload Question Paper section on the Dashboard and select the finalized PDF. The uploaded file is associated with the relevant examination schedule.",
      ],
      [
        "What format should the question paper be?",
        "The current portal accepts PDF files. The mock interface uses a maximum file size of 50 MB.",
      ],
      [
        "How is the examination schedule selected?",
        "The examination schedule should be assigned by the examination authority. The examiner selects the applicable examination and shift rather than inventing an arbitrary schedule.",
      ],
      [
        "What does Action Required mean?",
        "It means the submitted paper requires attention from the examiner before it can continue through the system workflow.",
      ],
      [
        "Can I modify a finalized paper?",
        "The examiner should not modify a paper after it reaches a protected/finalized stage through the normal workflow.",
      ],
      [
        "Can I see encryption keys?",
        "No. Security keys, decryption secrets and internal security credentials are not exposed through the examiner portal.",
      ],
    ];

    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#071a3d]">
            Help & Support
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Guidance for using the N.E.T.R.A. Examiner Portal.
          </p>
        </div>

        <Card>
          <SectionHeader icon={HelpCircle} title="Frequently Asked Questions" />

          <div className="divide-y divide-slate-100">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-slate-800">
                  {question}

                  <ChevronDown
                    size={17}
                    className="shrink-0 text-slate-400 transition group-open:rotate-180"
                  />
                </summary>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <LifeBuoy size={20} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Need further assistance?
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Contact the authorized N.E.T.R.A. support team for account,
                examination schedule or submission-related issues.
              </p>

              <button className="mt-4 rounded-md border border-[#bfd2e1] bg-white px-4 py-2 text-xs font-medium text-[#1264a3] hover:bg-[#f5faff]">
                Contact Support
              </button>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const LogoutView = () => (
    <div className="grid min-h-[calc(100vh-80px)] place-items-center">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={28} />
        </div>

        <h1 className="mt-4 text-xl font-semibold text-slate-900">
          Session ended securely
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          You have been signed out of the N.E.T.R.A. Examiner Portal.
        </p>

        <button onClick={() => navigate("dashboard")}className="mt-6 rounded-md bg-[#176bb0] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#125b95]">
          Sign In Again
        </button>
      </Card>
    </div>
  );

  const renderPage = () => {
    switch (view) {
      case "dashboard":
        return <Dashboard />;

      case "papers":
        return <MyPapers />;

      case "paper-detail":
        return <PaperDetail />;
      case "create-questions":
      return <UploadQuestionPaper embedded />;

      case "activity":
        return <ActivityLog />;

      case "profile":
        return <ProfilePage />;

      case "help":
        return <HelpPage />;

      case "logout":
        return <LogoutView />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa] text-slate-900">
      <div className="flex h-screen overflow-hidden">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header />

         <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <div className="mx-auto w-full max-w-[1450px]">
              {renderPage()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}