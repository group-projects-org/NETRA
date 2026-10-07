import { useMemo } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarPage({
  calendarEvents,
  setCalendarEvents,
  selectedDate,
  setSelectedDate,
  eventTitle,
  setEventTitle,
  setSchedules,
}) {
  const currentDate = new Date();

  const month =
    selectedDate?.month ??
    currentDate.getMonth();

  const year =
    selectedDate?.year ??
    currentDate.getFullYear();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const firstDay = new Date(year, month, 1).getDay();

  const monthName = new Date(year, month, 1).toLocaleString("en-US", {
    month: "long",
  });

  const previousMonth = () => {
    const newDate = new Date(year, month - 1, 1);

    setSelectedDate({
      day: null,
      month: newDate.getMonth(),
      year: newDate.getFullYear(),
    });

    setEventTitle("");
  };

  const nextMonth = () => {
    const newDate = new Date(year, month + 1, 1);

    setSelectedDate({
      day: null,
      month: newDate.getMonth(),
      year: newDate.getFullYear(),
    });

    setEventTitle("");
  };

  const selectDay = (day) => {
    setSelectedDate({
      day,
      month,
      year,
    });
  };

const addCalendarEvent = () => {
  if (!selectedDate?.day || !eventTitle.trim()) return;

  const eventId = Date.now();

  const newEvent = {
    id: eventId,
    day: selectedDate.day,
    month: selectedDate.month,
    year: selectedDate.year,
    title: eventTitle.trim(),
  };

  // Add to Calendar
  setCalendarEvents((current) => [
    ...current,
    newEvent,
  ]);

  // Also add to Exam Schedule
  setSchedules((current) => [
    ...current,
    {
      id: eventId,
      examination: eventTitle.trim(),
      date: `${selectedDate.year}-${String(
        selectedDate.month + 1
      ).padStart(2, "0")}-${String(
        selectedDate.day
      ).padStart(2, "0")}`,
      time: "Not specified",
      slot: "Not specified",
      duration: "Not specified",
    },
  ]);

  setEventTitle("");

  setSelectedDate({
    day: null,
    month,
    year,
  });
};

  const eventsForDay = (day) =>
    calendarEvents.filter((event) => {
      const eventMonth = event.month ?? 9;
      const eventYear = event.year ?? 2026;

      return (
        event.day === day &&
        eventMonth === month &&
        eventYear === year
      );
    });

  const calendarDays = useMemo(() => {
    return Array.from({ length: firstDay + daysInMonth }, (_, index) => {
      if (index < firstDay) return null;
      return index - firstDay + 1;
    });
  }, [firstDay, daysInMonth]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#071a3d]">
          Calendar
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Important examination dates and paper-related events.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">

        {/* Calendar Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

          <div className="flex items-center gap-2.5">
            <CalendarDays size={19} className="text-[#1d5b88]" />

            <h2 className="text-[15px] font-semibold text-slate-900">
              {monthName} {year}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={previousMonth}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              title="Previous month"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={nextMonth}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              title="Next month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs">
            {[
              "Sun",
              "Mon",
              "Tue",
              "Wed",
              "Thu",
              "Fri",
              "Sat",
            ].map((day) => (
              <div
                key={day}
                className="py-2 font-semibold text-slate-400"
              >
                {day}
              </div>
            ))}

            {/* Calendar Dates */}
            {calendarDays.map((day, index) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="min-h-14"
                  />
                );
              }

              const events = eventsForDay(day);
              const hasEvent = events.length > 0;

              const isSelected =
                selectedDate?.day === day &&
                selectedDate?.month === month &&
                selectedDate?.year === year;

              return (
                <button
                  key={day}
                  onClick={() => selectDay(day)}
                  className={`min-h-14 rounded-lg border p-2 text-sm transition ${
                    hasEvent
                      ? "border-blue-300 bg-blue-50 font-semibold text-blue-700"
                      : "border-slate-100 text-slate-600 hover:bg-slate-50"
                  } ${
                    isSelected
                      ? "ring-2 ring-blue-400"
                      : ""
                  }`}
                >
                  <div>{day}</div>

                  {hasEvent && (
                    <div className="mx-auto mt-1 h-1.5 w-1.5 rounded-full bg-blue-600" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Add Event */}
          {selectedDate?.day && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">

              <div className="mb-3 text-sm font-semibold text-slate-800">
                Add event for {selectedDate.day} {monthName} {year}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">

                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Enter paper / exam / important event"
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#4d83aa]"
                />

                <button
                  onClick={addCalendarEvent}
                  className="rounded-lg bg-[#176bb0] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#125b95]"
                >
                  Add Event
                </button>

                <button
                  onClick={() => {
                    setSelectedDate({
                      day: null,
                      month,
                      year,
                    });
                    setEventTitle("");
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>

              </div>
            </div>
          )}

          {/* Important Dates */}
          <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 p-4">

            <div className="text-sm font-semibold text-blue-900">
              Important Dates
            </div>

            <div className="mt-3 space-y-2">

              {calendarEvents.length === 0 ? (
                <div className="text-xs text-blue-500">
                  No important dates added.
                </div>
              ) : (
                calendarEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 text-xs text-blue-700"
                  >
                    <span className="font-semibold">
                      {event.day}{" "}
                      {event.month !== undefined
                        ? new Date(
                            event.year,
                            event.month,
                            1
                          ).toLocaleString("en-US", {
                            month: "short",
                          })
                        : "Oct"}
                    </span>

                    <span>—</span>

                    <span>{event.title}</span>
                  </div>
                ))
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}