import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Plus, Trash2, X, MapPin } from "lucide-react";

const toISODate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTime12Hr = (timeStr) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":");
  const h = Number(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

export default function ExaminationCalendar({ officialEvents = [], loading = false, error = "", onFetchEventDetail }) {
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()));
  const [personalEvents, setPersonalEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");

  // Event detail modal state for GET /api/events/:id
  const [activeEventDetail, setActiveEventDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // Automatically jump calendar month to the earliest upcoming official event if available
  useEffect(() => {
    if (officialEvents.length > 0) {
      const firstDateStr = officialEvents[0].event_date;
      if (firstDateStr) {
        const [y, m] = firstDateStr.split("-").map(Number);
        setMonth(new Date(y, m - 1, 1));
        setSelectedDate(firstDateStr);
      }
    }
  }, [officialEvents]);

  const allEvents = useMemo(() => {
    const mappedOfficial = officialEvents.map((ev) => ({
      id: `official-${ev.id}`,
      rawId: ev.id,
      title: ev.title,
      date: ev.event_date,
      startTime: ev.start_time,
      endTime: ev.end_time,
      message: ev.message,
      type: "exam",
      owner: "admin",
    }));
    return [...mappedOfficial, ...personalEvents];
  }, [officialEvents, personalEvents]);

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

  const selectedEvents = allEvents.filter((event) => event.date === selectedDate);

  const changeMonth = (offset) => {
    setMonth(new Date(year, monthIndex + offset, 1));
    setSelectedDate("");
    setShowForm(false);
    setActiveEventDetail(null);
  };

  const addReminder = (event) => {
    event.preventDefault();
    if (!title.trim() || !selectedDate) return;

    setPersonalEvents((current) => [
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
    setPersonalEvents((current) => current.filter((event) => event.id !== id));
  };

  const handleOpenOfficialEvent = async (eventItem) => {
    if (eventItem.owner !== "admin" || !onFetchEventDetail) return;
    setDetailLoading(true);
    setDetailError("");
    setActiveEventDetail(eventItem);

    try {
      const fullDetails = await onFetchEventDetail(eventItem.rawId);
      if (fullDetails) {
        setActiveEventDetail({
          ...eventItem,
          title: fullDetails.title,
          date: fullDetails.event_date,
          startTime: fullDetails.start_time,
          endTime: fullDetails.end_time,
          message: fullDetails.message,
          createdAt: fullDetails.created_at,
        });
      }
    } catch (err) {
      setDetailError(err.message || "Unable to load event details.");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <>
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <CalendarDays size={19} className="text-[#1d5b88]" />
          <h2 className="text-[15px] font-semibold text-slate-900">Examination Calendar</h2>
        </div>
        {loading && <span className="text-[11px] text-slate-400">Syncing...</span>}
      </div>

      <div className="p-4">
        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
        )}

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
            const hasEvents = allEvents.some((event) => event.date === date);
            const selected = selectedDate === date;

            return (
              <button
                key={date}
                type="button"
                onClick={() => {
                  setSelectedDate(date);
                  setShowForm(false);
                  setActiveEventDetail(null);
                }}
                className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-xs transition ${selected ? "bg-[#176bb0] font-semibold text-white" : "text-slate-700 hover:bg-blue-50"}`}
              >
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
              <div
                key={event.id}
                onClick={() => handleOpenOfficialEvent(event)}
                className={`flex items-start gap-2.5 rounded-lg p-1.5 transition ${event.owner === "admin" ? "cursor-pointer hover:bg-slate-50" : ""}`}
              >
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${event.type === "exam" ? "bg-blue-600" : event.type === "deadline" ? "bg-amber-500" : "bg-emerald-500"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-800">{event.title}</p>
                  <p className="mt-1 text-[10px] capitalize text-slate-400">
                    {event.owner === "admin"
                      ? `Official event${event.startTime ? ` · ${formatTime12Hr(event.startTime)}` : ""}`
                      : `${event.type} · Personal reminder`}
                  </p>
                </div>
                {event.owner === "examiner" && (
                  <button
                    type="button"
                    aria-label="Delete reminder"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeReminder(event.id);
                    }}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
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

    {activeEventDetail && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]" onClick={() => setActiveEventDetail(null)}>
        <div role="dialog" aria-modal="true" aria-labelledby="event-detail-title" className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#176bb0]">Official examination event</p>
              <h3 id="event-detail-title" className="mt-1.5 pr-3 text-lg font-semibold leading-snug text-slate-900">{activeEventDetail.title}</h3>
            </div>
            <button type="button" aria-label="Close event details" onClick={() => setActiveEventDetail(null)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <X size={19} />
            </button>
          </div>

          <div className="space-y-4 px-5 py-5 sm:px-6">
            {detailLoading ? (
              <div className="py-8 text-center text-sm text-slate-500">Loading event details...</div>
            ) : detailError ? (
              <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-600">{detailError}</p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><CalendarDays size={15} className="text-[#176bb0]" /> Event date</div>
                    <p className="mt-2 text-sm font-semibold text-slate-800">{activeEventDetail.date ? new Date(`${activeEventDetail.date}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Date not available"}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3.5">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Clock size={15} className="text-[#176bb0]" /> Event time</div>
                    <p className="mt-2 text-sm font-semibold text-slate-800">{activeEventDetail.startTime || activeEventDetail.endTime ? `${formatTime12Hr(activeEventDetail.startTime)} – ${formatTime12Hr(activeEventDetail.endTime)}` : "Time not available"}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-blue-100 bg-[#f4f9fd] p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#0b4b7a]"><MapPin size={15} /> Instructions / Venue</div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{activeEventDetail.message || "No additional instructions provided."}</p>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end border-t border-slate-100 px-5 py-3.5 sm:px-6">
            <button type="button" onClick={() => setActiveEventDetail(null)} className="rounded-lg bg-[#176bb0] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#125b95]">Close</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}