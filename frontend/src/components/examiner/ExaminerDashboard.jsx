import { useEffect, useMemo, useState } from "react";
import { Activity, AlertCircle, Bell, CalendarDays, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, Circle, Clock3, FileCheck2, FileText, HelpCircle, LayoutDashboard, LifeBuoy, LogOut, BookOpen, Menu, Search, Shield, User, UserCircle, ClipboardList, CalendarClock, History } from "lucide-react";
import UpcomingSchedule from "./UpcomingSchedule";
import UploadQuestionPaper from "./UploadQuestionPaper";
import ExaminationCalendar from "./ExaminationCalendar";
import ThemeToggle from "../ThemeToggle";
import ExaminerProfile from "./ExaminerProfile";
import {io} from "socket.io-client";
// Profile details are read from the authenticated session where available.
const getExaminerProfile = () => {
  for (const storage of [sessionStorage, localStorage]) {
    for (const key of ["user", "examiner", "auth", "profile"]) {
      try {
        const value = JSON.parse(storage.getItem(key) || "null");
        if (value && typeof value === "object") {
          const user = value.user || value.examiner || value.profile || value;
          if (user.name || user.full_name || user.examiner_id || user.examinerId) {
            return {
              ...user,
              name: user.name || user.full_name || "Examiner",
              id: user.examiner_id || user.examinerId || user.id || "",
              role: user.role || "Examiner",
            };
          }
        }
      } catch { /* storage entry is not JSON */ }
    }
  }
  return { name: "Examiner", id: "", role: "Examiner" };
};

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

// Read the existing examiner JWT from the application's browser storage.
// Supports common auth key names without creating a second token store.
const getExaminerToken = () => {
  const storageKeys = [
    "token", "accessToken", "access_token", "authToken", "auth_token",
    "examinerToken", "examiner_token", "jwt", "user", "auth", "examiner",
  ];

  for (const storage of [localStorage, sessionStorage]) {
    for (const key of storageKeys) {
      const value = storage.getItem(key);
      if (!value) continue;
      if (value.split(".").length === 3) return value;
      try {
        const parsed = JSON.parse(value);
        const token = parsed?.token || parsed?.accessToken || parsed?.access_token || parsed?.jwt;
        if (typeof token === "string" && token.split(".").length === 3) return token;
      } catch { /* value is not JSON */ }
    }
  }
  return null;
};

const formatNotificationTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
};

const formatBlueprintDeadline = (value) => {
  if (!value) return "No deadline";
  const normalized = typeof value === "string" ? value.replace(" ", "T") : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getDeadlineBadgeParts = (value) => {
  if (!value) return { day: "--", month: "TBD" };
  const normalized = typeof value === "string" ? value.replace(" ", "T") : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    const parts = String(value).split(" ");
    return { day: parts[0] || "--", month: parts[1] || "TBD" };
  }
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: date.toLocaleString("en-US", { month: "short" }),
  };
};

const normalizeBlueprintItem = (raw, index) => {
  const rawSections = Array.isArray(raw.sections)
    ? raw.sections
    : Array.isArray(raw.topics)
    ? raw.topics
    : Array.isArray(raw.blueprint_sections)
    ? raw.blueprint_sections
    : [];

  const sections = rawSections.map((sec, sIdx) => {
    const easy = Number(sec.easyQuestions ?? sec.easy_questions ?? sec.easy ?? 0) || 0;
    const medium = Number(sec.mediumQuestions ?? sec.medium_questions ?? sec.medium ?? 0) || 0;
    const hard = Number(sec.hardQuestions ?? sec.hard_questions ?? sec.hard ?? 0) || 0;
    return {
      id: sec.id ?? `${raw.blueprintId ?? raw.id ?? index}_${sIdx}`,
      topicName: sec.topicName || sec.topic_name || sec.topic || `Topic ${sIdx + 1}`,
      easyQuestions: easy,
      mediumQuestions: medium,
      hardQuestions: hard,
      total: easy + medium + hard,
    };
  });

  const sectionsTotal = sections.reduce((sum, s) => sum + s.total, 0);
  const required =
    Number(
      raw.totalQuestions ??
        raw.total_questions ??
        raw.requiredQuestions ??
        raw.required_questions
    ) || sectionsTotal;

  const rawId = raw.blueprintId ?? raw.blueprint_id ?? raw.id ?? index + 1;
  const code = raw.blueprintCode || raw.blueprint_code || `BP-${rawId}`;

  return {
    id: rawId,
    code,
    examination: raw.examName || raw.exam_name || raw.examination || "Untitled Examination",
    subject: raw.subject || "General",
    totalMarks: raw.totalMarks ?? raw.total_marks ?? null,
    marksMode: raw.marksMode || raw.marks_mode || "LEGACY",
    marksPerQuestion: raw.marksPerQuestion ?? raw.marks_per_question ?? null,
    easyMarks: raw.easyMarks ?? raw.easy_marks ?? null,
    mediumMarks: raw.mediumMarks ?? raw.medium_marks ?? null,
    hardMarks: raw.hardMarks ?? raw.hard_marks ?? null,
    deadlineRaw: raw.deadline || raw.submission_deadline || null,
    deadline: formatBlueprintDeadline(raw.deadline || raw.submission_deadline),
    department: raw.targetDepartment || raw.target_department || raw.department || "",
    distributionType: raw.distributionType || raw.distribution_type || "",
    status: raw.assignmentStatus || raw.assignment_status || raw.status || "Assigned",
    required,
    sections,
  };
};

export default function ExaminerDashboard() {
  const [view, setView] = useState("dashboard");
  const examiner = useMemo(() => getExaminerProfile(), []);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [markingAllRead, setMarkingAllRead] = useState(false);

  // Events state (GET /api/events/my-events & GET /api/events/:id)
  const [examinerEvents, setExaminerEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");

  // Assigned Blueprints state (GET /api/examiner/blueprints)
  const [assignedBlueprints, setAssignedBlueprints] = useState([]);
  const [blueprintsLoading, setBlueprintsLoading] = useState(false);
  const [blueprintsError, setBlueprintsError] = useState("");

  const API_BASE_URL = import.meta.env.VITE_NODE_API_URL;

  const getAuthHeaders = () => {
    const authToken = sessionStorage.getItem("netra_examiner_token") || getExaminerToken();
    if (!API_BASE_URL) {
      throw new Error("VITE_NODE_API_URL is missing in frontend .env.");
    }
    if (!authToken) {
      throw new Error("Examiner login token not found. Please log in again.");
    }
    return {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    };
  };

  // Fetch assigned blueprints for logged-in examiner
  const fetchAssignedBlueprints = async () => {
    setBlueprintsLoading(true);
    setBlueprintsError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/examiner/blueprints`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to fetch assigned blueprints.");
      }
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.blueprints)
        ? data.blueprints
        : [];
      setAssignedBlueprints(list.map(normalizeBlueprintItem));
    } catch (error) {
      setBlueprintsError(error.message || "Unable to load assigned blueprints.");
    } finally {
      setBlueprintsLoading(false);
    }
  };

  // 1. Fetch all events assigned to the logged-in examiner
  const fetchExaminerEvents = async () => {
    setEventsLoading(true);
    setEventsError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/events/my-events`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to fetch events.");
      setExaminerEvents(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      setEventsError(error.message || "Unable to load events.");
    } finally {
      setEventsLoading(false);
    }
  };

  // 2. Fetch single event details by ID
  const fetchEventById = async (eventId) => {
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to fetch event details.");
    return data.data;
  };

  const fetchUnreadCount = async () => {
    const response = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to fetch unread count.");
    setUnreadNotifications(Number(data.unreadCount) || 0);
  };

  const fetchNotifications = async () => {
    setNotificationsLoading(true);
    setNotificationsError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/my-notifications`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to fetch notifications.");
      const rows = Array.isArray(data.data) ? data.data : [];
      setNotifications(rows.map((item) => ({
        ...item,
        id: item.notificationId ?? item.id,
        unread: !Boolean(item.isRead),
        time: formatNotificationTime(item.createdAt),
        type: "info",
      })));
      await fetchUnreadCount();
    } catch (error) {
      setNotificationsError(error.message || "Unable to load notifications.");
    } finally {
      setNotificationsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchExaminerEvents();
    fetchAssignedBlueprints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem("netra_examiner_token") || getExaminerToken();

    if (!token) {
      console.error("Socket connection skipped: Examiner token not found.");
      return;
    }

    const socket = io(API_BASE_URL, {
      auth: {
        token: token
      },
      transports: ["websocket"]
    });

    socket.on("connect", () => {
      console.log("NETRA Socket Connected:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket Connection Error:", error.message);
    });

    // Listen for new notifications & refresh calendar events & blueprints simultaneously
    socket.on("notification:new", (notification) => {
      console.log("New Notification Received:", notification);

      setNotifications((current) => {
        if (current.some(
          (item) => item.id === notification.notificationId
        )) {
          return current;
        }

        return [
          {
            ...notification,
            id: notification.notificationId,
            unread: true,
            isRead: false,
            time: formatNotificationTime(notification.createdAt),
            type: "info"
          },
          ...current
        ];
      });

      setUnreadNotifications((count) => count + 1);
      fetchExaminerEvents();
      fetchAssignedBlueprints();
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE_URL]);

  const [search, setSearch] = useState("");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState(null);
  const filteredBlueprints = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return assignedBlueprints;
    return assignedBlueprints.filter((item) =>
      [item.code, item.examination, item.subject, item.department]
        .some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [assignedBlueprints, search]);


  const navigate = (nextView) => {
    setView(nextView);
    setMobileSidebar(false);
    setNotificationOpen(false);
    setProfileOpen(false);
  };

  const handleLogout = () => {
    const confirmed = window.confirm(
      "Are you sure you want to sign out of N.E.T.R.A.?"
    );
    if (confirmed) {
      window.location.href = "/";
    }
  };

  const markNotificationsRead = async () => {
    if (unreadNotifications === 0 || markingAllRead) return;
    setMarkingAllRead(true);
    setNotificationsError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/mark-all-read`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to mark notifications as read.");
      setNotifications((current) => current.map((item) => ({ ...item, unread: false, isRead: true })));
      setUnreadNotifications(0);
    } catch (error) {
      setNotificationsError(error.message || "Unable to mark notifications as read.");
    } finally {
      setMarkingAllRead(false);
    }
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
      label: "Assignments",
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
      return view === "papers";
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
                  isActive(item.id) ? "bg-[#164e7b] text-white shadow-sm" : "text-slate-300 hover:bg-white/5 hover:text-white"
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
                  isActive(item.id) ? "bg-[#164e7b] text-white shadow-sm" : "text-slate-300 hover:bg-white/5 hover:text-white"
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
          placeholder="Search assigned exams, subjects, topics..."
          className="h-[42px] w-full rounded-lg border border-[#d5e0eb] bg-[#f7fafd] pl-11 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#4d83aa] focus:bg-white focus:ring-2 focus:ring-[#dbeaf5]"
        />
      </div>
      <div className="ml-auto flex items-center gap-4">
        <ThemeToggle />
        {/* Notifications */}
        <div className="relative">
          <button onClick={() => {
              const willOpen = !notificationOpen;
              setNotificationOpen(willOpen);
              setProfileOpen(false);
              if (willOpen) fetchNotifications();
            }}
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

                <button onClick={markNotificationsRead} disabled={unreadNotifications === 0 || markingAllRead} className="text-xs font-medium text-[#1264a3] disabled:cursor-not-allowed disabled:opacity-40">
                  {markingAllRead ? "Marking..." : "Mark all as read"}
                </button>
              </div>

              <div className="max-h-[380px] overflow-y-auto">
                {notificationsLoading ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-500">Loading notifications...</p>
                ) : notificationsError ? (
                  <p className="px-4 py-6 text-center text-xs text-red-600">{notificationsError}</p>
                ) : notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>
                ) : notifications.map((notification) => (
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


        <div className="relative">
          <button onClick={() => {
              setProfileOpen((v) => !v);
              setNotificationOpen(false);
            }}
            className="flex items-center gap-3 rounded-lg px-1.5 py-1.5 transition hover:bg-slate-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#3e6484] text-sm font-semibold text-white">
              {examiner.name.charAt(0)}
            </div>

            <div className="hidden text-left sm:block">
              <div className="text-sm font-semibold text-slate-900">
                {examiner.name}
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

  const Dashboard = () => {
    const visibleBlueprints = showAllTasks ? assignedBlueprints : assignedBlueprints.slice(0, 2);
    const pendingDeadlines = [...assignedBlueprints]
      .filter((task) => task.deadlineRaw)
      .sort((a, b) => new Date(a.deadlineRaw) - new Date(b.deadlineRaw))
      .slice(0, 3);

    return (
      <div className="space-y-5">
        {/* Page introduction */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#1765a0]">Examiner workspace</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Welcome back, {examiner.name || "Examiner"}</h1>
            <p className="mt-1 text-sm text-slate-500">Review assigned blueprints, marking instructions and submission deadlines.</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-600">
            {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={ClipboardList} count={assignedBlueprints.length} title="Assigned Blueprints" subtitle="From examination authority" tone="blue" onClick={() => navigate("papers")} />
          <StatCard icon={BookOpen} count={assignedBlueprints.reduce((sum, item) => sum + item.required, 0)} title="Required Questions" subtitle="Across your assignments" tone="amber" onClick={() => navigate("papers")} />
          <StatCard icon={FileCheck2} count={assignedBlueprints.reduce((sum, item) => sum + (Number(item.totalMarks) || 0), 0)} title="Total Marks" subtitle="Combined blueprint marks" tone="green" onClick={() => navigate("papers")} />
          <StatCard icon={Bell} count={unreadNotifications} title="Unread Alerts" subtitle="Account notifications" tone="purple" onClick={() => { setNotificationOpen(true); fetchNotifications(); }} />
        </div>

        {/* Main dashboard layout */}
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Left column: Assigned Tasks + Recent Activity */}
          <div className="space-y-5">
            {/* Assigned Tasks (Blueprints) */}
            <Card className="overflow-hidden">
              <SectionHeader icon={ClipboardList} title="Assigned Tasks" />

              {blueprintsLoading ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Loading assigned blueprints...
                </div>
              ) : blueprintsError ? (
                <div className="p-6 text-center">
                  <p className="text-sm font-medium text-red-600">{blueprintsError}</p>
                  <button
                    type="button"
                    onClick={fetchAssignedBlueprints}
                    className="mt-3 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1765a0] hover:bg-slate-50"
                  >
                    Retry
                  </button>
                </div>
              ) : assignedBlueprints.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm font-medium text-slate-700">No blueprints assigned yet</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Assigned examination blueprints from the administrator will appear here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-100">
                    {visibleBlueprints.map((task) => {
                      return (
                        <div key={task.id} className="p-5 transition hover:bg-slate-50/70">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-[#1765a0]">{task.code}</span>
                                <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">{task.status}</span>
                                {task.distributionType && (
                                  <span className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-medium text-[#1d5b88]">
                                    {task.distributionType}
                                  </span>
                                )}
                                {task.department && (
                                  <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
                                    {task.department}
                                  </span>
                                )}
                              </div>

                              <h3 className="mt-2 text-sm font-semibold text-slate-900">{task.examination}</h3>
                              <p className="mt-1 text-xs text-slate-500">
                                Subject: <span className="font-medium text-slate-700">{task.subject}</span>
                                {task.totalMarks !== null && (
                                  <>
                                    <span className="mx-1.5">•</span>
                                    Total Marks: <span className="font-medium text-slate-700">{task.totalMarks}</span>
                                  </>
                                )}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-slate-500">Deadline</p>
                              <p className="mt-1 flex items-center justify-end gap-1.5 text-xs font-semibold text-slate-700">
                                <CalendarClock size={14} className="text-amber-600" />
                                {task.deadline}
                              </p>
                            </div>
                          </div>

                          {/* Blueprint Sections Breakdown */}
                          {task.sections.length > 0 && (
                            <div className="mt-4 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3">
                              <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                <span>Blueprint Topics ({task.sections.length})</span>
                                <span>{task.required} Total Questions</span>
                              </div>
                              <div className="divide-y divide-slate-200/60">
                                {task.sections.map((sec) => (
                                  <div
                                    key={sec.id}
                                    className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0 text-xs"
                                  >
                                    <span className="font-medium text-slate-800">{sec.topicName}</span>
                                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                      <span className="rounded bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                                        Easy: {sec.easyQuestions}
                                      </span>
                                      <span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                                        Medium: {sec.mediumQuestions}
                                      </span>
                                      <span className="rounded bg-rose-50 px-2 py-0.5 font-medium text-rose-700">
                                        Hard: {sec.hardQuestions}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-4 rounded-lg bg-blue-50/70 px-3.5 py-3 text-xs text-slate-700">
                            <p className="font-semibold text-slate-800">Marking policy</p>
                            {task.marksMode === "UNIFORM" ? <p className="mt-1">{task.marksPerQuestion} mark(s) for each question</p> : task.marksMode === "DIFFICULTY_BASED" ? <p className="mt-1">Easy {task.easyMarks} · Medium {task.mediumMarks} · Hard {task.hardMarks} marks per question</p> : <p className="mt-1">Refer to the assigned blueprint instructions.</p>}
                          </div>

                          <div className="mt-4 flex justify-end">
                            <button type="button" onClick={() => { setSelectedBlueprint(task); navigate("create-questions"); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-[#1765a0] transition hover:border-blue-200 hover:bg-blue-50">
                              Create questions
                              <ChevronRight size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3">
                    <p className="text-xs text-slate-500">
                      Showing {visibleBlueprints.length} of {assignedBlueprints.length} assignments
                    </p>

                    {assignedBlueprints.length > 2 && (
                      <button type="button" onClick={() => setShowAllTasks((current) => !current)} className="inline-flex items-center gap-1 text-xs font-semibold text-[#1264a3] hover:text-[#0b4b7a]">
                        {showAllTasks ? "Show fewer" : "View all assignments"}
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </>
              )}
            </Card>

            {/* Recent notifications are backed by the notifications API */}
            <Card className="overflow-hidden">
              <SectionHeader icon={History} title="Recent Notifications" />
              {notificationsLoading ? (
                <p className="p-5 text-sm text-slate-500">Loading notifications…</p>
              ) : notificationsError ? (
                <div className="p-5 text-sm text-red-600">{notificationsError}</div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">No notifications to display.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.slice(0, 4).map((item) => (
                    <div key={item.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-slate-800">{item.title || item.message || item.notificationType || "Notification"}</p>
                        {item.unread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
                      </div>
                      {item.description && <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>}
                      <p className="mt-1 text-xs text-slate-400">{item.time}</p>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={() => { setNotificationOpen(true); fetchNotifications(); }} className="flex w-full items-center justify-center gap-1 border-t border-slate-100 px-4 py-3 text-xs font-semibold text-[#1264a3] hover:bg-slate-50">
                Open notifications <ChevronRight size={14} />
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
                {blueprintsLoading ? (
                  <p className="py-3 text-xs text-slate-500">Loading deadlines...</p>
                ) : pendingDeadlines.length > 0 ? (
                  pendingDeadlines.map((task) => {
                    const badge = getDeadlineBadgeParts(task.deadlineRaw);
                    return (
                      <div key={task.id} className="flex gap-3">
                        <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                          <span className="text-[9px] font-semibold uppercase text-slate-500">{badge.month}</span>
                          <span className="text-sm font-bold text-slate-800">{badge.day}</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">{task.subject}</p>
                          <p className="mt-1 text-xs text-slate-500">{task.examination} · Due {task.deadline}</p>
                          <p className="mt-1 text-xs font-medium text-amber-700">
                            {task.required} questions · {task.totalMarks ?? "—"} marks
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-3 text-sm text-slate-500">No pending assignment deadlines.</p>
                )}
              </div>
            </Card>

            <ExaminationCalendar
              officialEvents={examinerEvents}
              loading={eventsLoading}
              error={eventsError}
              onFetchEventDetail={fetchEventById}
            />
          </div>
        </div>
      </div>
    );
  };

  const MyPapers = () => (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#071a3d]">My Assignments</h1>
          <p className="mt-1 text-sm text-slate-500">Blueprints assigned to your examiner account by the administrator.</p>
        </div>
        <button onClick={fetchAssignedBlueprints} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Refresh</button>
      </div>
      <Card className="overflow-hidden">
        {blueprintsLoading ? <div className="p-10 text-center text-sm text-slate-500">Loading assigned blueprints…</div> :
          blueprintsError ? <div className="p-6 text-center"><p className="text-sm text-red-600">{blueprintsError}</p><button onClick={fetchAssignedBlueprints} className="mt-3 text-sm font-semibold text-blue-700">Try again</button></div> :
          filteredBlueprints.length === 0 ? <div className="p-10 text-center"><ClipboardList size={30} className="mx-auto text-slate-300"/><p className="mt-3 text-sm font-medium text-slate-700">{assignedBlueprints.length ? "No matching assignments" : "No assignments yet"}</p><p className="mt-1 text-sm text-slate-500">New blueprints assigned by the administrator will appear here.</p></div> :
          <div className="divide-y divide-slate-100">{filteredBlueprints.map((task) => (
            <div key={task.id} className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-xs font-semibold text-blue-700">Blueprint #{task.id}</p><h2 className="mt-1.5 text-base font-semibold text-slate-900">{task.examination}</h2><p className="mt-1 text-sm text-slate-500">{task.subject}{task.department ? ` · ${task.department}` : ""}</p></div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{task.distributionType || "Assigned"}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-500">Questions</p><p className="mt-1 text-lg font-semibold text-slate-900">{task.required}</p></div>
                <div className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-500">Total marks</p><p className="mt-1 text-lg font-semibold text-slate-900">{task.totalMarks ?? "—"}</p></div>
                <div className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-500">Marking</p><p className="mt-1 text-sm font-semibold text-slate-900">{task.marksMode === "UNIFORM" ? `${task.marksPerQuestion} / question` : task.marksMode === "DIFFICULTY_BASED" ? "By difficulty" : "As specified"}</p></div>
                <div className="rounded-lg border border-slate-200 p-3"><p className="text-xs text-slate-500">Deadline</p><p className="mt-1 text-sm font-semibold text-slate-900">{task.deadline}</p></div>
              </div>
              {task.marksMode === "DIFFICULTY_BASED" && <p className="mt-3 text-xs text-slate-600">Easy: {task.easyMarks} mark(s) · Medium: {task.mediumMarks} mark(s) · Hard: {task.hardMarks} mark(s) per question</p>}
              <div className="mt-4 rounded-lg bg-slate-50 p-3.5"><p className="mb-2 text-xs font-semibold text-slate-600">Required question distribution</p><div className="flex flex-wrap gap-2">{task.sections.map((sec) => <span key={sec.id} className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700">{sec.topicName}: E {sec.easyQuestions} · M {sec.mediumQuestions} · H {sec.hardQuestions}</span>)}</div></div>
              <div className="mt-4 flex justify-end"><button onClick={() => { setSelectedBlueprint(task); navigate("create-questions"); }} className="inline-flex items-center gap-2 rounded-lg bg-[#176bb0] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#125b95]">Create questions <ChevronRight size={16}/></button></div>
            </div>))}</div>}
      </Card>
    </div>
  );

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

        <div className="p-10 text-center">
          <History size={28} className="mx-auto text-slate-300" />
          <p className="mt-3 text-sm font-medium text-slate-700">Activity history is not connected yet</p>
          <p className="mt-1 text-xs text-slate-500">This page will show server-recorded examiner actions when an activity-log endpoint is available.</p>
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
        "The current portal accepts PDF files. Check the upload form for the currently configured file-size limit.",
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

        <button onClick={() => navigate("dashboard")} className="mt-6 rounded-md bg-[#176bb0] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#125b95]">
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

      case "create-questions":
        return <UploadQuestionPaper embedded blueprint={selectedBlueprint} blueprintId={selectedBlueprint?.id} />;

      case "activity":
        return <ActivityLog />;

      case "profile":
        return <ExaminerProfile examiner={examiner} />;

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
        {Sidebar()}

        <div className="flex min-w-0 flex-1 flex-col">
          {Header()}

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