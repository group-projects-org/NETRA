
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
const toISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const initialEvents = [
  { id: 1, title: "Computer Networks deadline", date: "2026-11-10", type: "deadline", owner: "admin" },
  { id: 2, title: "National Eligibility Test", date: "2026-11-14", type: "exam", owner: "admin" },
  { id: 3, title: "Preparation reminder", date: "2026-11-12", type: "personal", owner: "examiner" }
];

export default function ExaminationCalendar() {
  const [month, setMonth] = useState(() => new Date(2026, 10, 1));
  const [selectedDate, setSelectedDate] = useState("2026-11-10");
  const [events, setEvents] = useState(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");

  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const days = useMemo(() => {
    const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
    const total = new Date(year, monthIndex + 1, 0).getDate();

    return [
      ...Array(offset).fill(null),
      ...Array.from({ length: total }, (_, index) => index + 1)
    ];
  }, [year, monthIndex]);

  const monthLabel = month.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric"
  });

  const selectedEvents = events.filter((event) => event.date === selectedDate);

  const changeMonth = (offset) => {
    setMonth(new Date(year, monthIndex + offset, 1));
    setSelectedDate("");
    setShowForm(false);
  };

  const addReminder = (event) => {
    event.preventDefault();
    if (!title.trim() || !selectedDate) return;

    setEvents((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        date: selectedDate,
        type: "personal",
        owner: "examiner"
      }
    ]);

    setTitle("");
    setShowForm(false);
  };

  const removeReminder = (id) => {
    setEvents((current) => current.filter((event) => event.id !== id));
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <CalendarDays size={19} className="text-[#1d5b88]" />
          <h2 className="text-[15px] font-semibold text-slate-900">Examination Calendar</h2>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">{monthLabel}</h3>
          <div className="flex gap-1">
            <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50">
              <ChevronLeft size={16} />
            </button>
            <button type="button" aria-label="Next month" onClick={() => changeMonth(1)} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="py-1 text-center text-[10px] font-medium text-slate-400">{day}</div>
          ))}

          {days.map((day, index) => {
            if (!day) return <div key={`empty-${index}`} />;

            const date = toISODate(new Date(year, monthIndex, day));
            const hasEvents = events.some((event) => event.date === date);
            const selected = selectedDate === date;

            return (
              <button key={date} type="button" onClick={() => { setSelectedDate(date); setShowForm(false); }} className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-xs transition ${selected ? "bg-[#176bb0] font-semibold text-white" : "text-slate-700 hover:bg-blue-50"}`}>
                {day}
                {hasEvents && <span className={`absolute bottom-1 h-1 w-1 rounded-full ${selected ? "bg-white" : "bg-blue-500"}`} />}
              </button>
            );
          })}
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold text-slate-800">
              {selectedDate ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Select a date"}
            </h4>
            <button type="button" disabled={!selectedDate} onClick={() => setShowForm((current) => !current)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1264a3] disabled:opacity-40">
              <Plus size={13} /> Add reminder
            </button>
          </div>

          {showForm && (
            <form onSubmit={addReminder} className="mb-3 flex gap-2">
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Reminder title" maxLength={100} required className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400" />
              <button type="submit" className="rounded-lg bg-[#176bb0] px-3 text-xs font-semibold text-white hover:bg-[#125b95]">Save</button>
            </form>
          )}

          <div className="space-y-3">
            {selectedEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-2.5">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${event.type === "exam" ? "bg-blue-600" : event.type === "deadline" ? "bg-amber-500" : "bg-emerald-500"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-800">{event.title}</p>
                  <p className="mt-1 text-[10px] capitalize text-slate-400">{event.type} · {event.owner === "admin" ? "Official event" : "Personal reminder"}</p>
                </div>
                {event.owner === "examiner" && (
                  <button type="button" aria-label="Delete reminder" onClick={() => removeReminder(event.id)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}

            {selectedEvents.length === 0 && (
              <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">No events scheduled for this date.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
