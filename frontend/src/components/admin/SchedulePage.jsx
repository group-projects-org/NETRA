import { useState } from "react";
import { Clock3, Plus, Send, Trash2 } from "lucide-react";

export default function SchedulePage({
  schedules,
  setSchedules,
}) {
  const [showForm, setShowForm] = useState(false);

  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examTime, setExamTime] = useState("");
  const [examSlot, setExamSlot] = useState("Slot A");
  const [duration, setDuration] = useState("3 Hours");

  const addSchedule = () => {
    if (!examName || !examDate || !examTime) {
      return;
    }

    const newSchedule = {
      id: Date.now(),
      examination: examName,
      date: examDate,
      time: examTime,
      slot: examSlot,
      duration: duration,
    };

    setSchedules((current) => [...current, newSchedule]);

    setExamName("");
    setExamDate("");
    setExamTime("");
    setExamSlot("Slot A");
    setDuration("3 Hours");
    setShowForm(false);
  };

  const deleteSchedule = (id) => {
    setSchedules((current) =>
      current.filter((schedule) => schedule.id !== id)
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#071a3d]">
            Exam Schedule
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Create and manage examination schedules for examiners.
          </p>
        </div>

        <button
          onClick={() => setShowForm((value) => !value)}
          className="flex items-center gap-2 rounded-lg bg-[#176bb0] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#125b95]"
        >
          <Plus size={17} />
          Add Exam
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <div className="mb-5 flex items-center gap-2.5">
            <Clock3 size={19} className="text-[#1d5b88]" />

            <h2 className="text-[15px] font-semibold text-slate-900">
              Create Examination Schedule
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-600">
                Examination Name
              </label>

              <input
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. Computer Networks"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#4d83aa] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">
                Exam Date
              </label>

              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#4d83aa] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">
                Start Time
              </label>

              <input
                type="time"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#4d83aa] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">
                Slot
              </label>

              <select
                value={examSlot}
                onChange={(e) => setExamSlot(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#4d83aa] focus:bg-white"
              >
                <option>Slot A</option>
                <option>Slot B</option>
                <option>Slot C</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">
                Duration
              </label>

              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#4d83aa] focus:bg-white"
              >
                <option>1 Hour</option>
                <option>2 Hours</option>
                <option>3 Hours</option>
                <option>4 Hours</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={addSchedule}
              className="flex items-center gap-2 rounded-lg bg-[#176bb0] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#125b95]"
            >
              <Send size={16} />
              Create Schedule
            </button>

            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
          <Clock3 size={19} className="text-[#1d5b88]" />

          <h2 className="text-[15px] font-semibold text-slate-900">
            Scheduled Examinations
          </h2>
        </div>

        {schedules.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No examinations scheduled.
          </div>
        ) : (
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

                  <div className="mt-2 text-xs text-slate-500">
                    Date: {schedule.date}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    Time: {schedule.time} • {schedule.slot}
                  </div>

                  <div className="mt-1 text-xs text-slate-400">
                    Duration: {schedule.duration}
                  </div>
                </div>

                <button
                  onClick={() => deleteSchedule(schedule.id)}
                  className="flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}