import { CalendarDays } from "lucide-react";

export default function UpcomingSchedule({ Card, SectionHeader, navigate }) {
  return (
    <Card>
      <SectionHeader
        icon={CalendarDays}
        title="Upcoming Examination Schedule"
        action="View all"
        onAction={() => navigate("papers")}
      />

      <div className="p-4">
        <div className="flex overflow-hidden rounded-lg border border-slate-200">
          <div className="flex w-[92px] flex-col items-center justify-center border-r border-slate-200 bg-[#f8fbfd] py-4">
            <span className="text-[11px] text-slate-500">14</span>
            <span className="text-xl font-semibold text-[#071a3d]">Nov</span>
            <span className="text-[10px] text-slate-400">2026</span>
          </div>

          <div className="flex-1 px-4 py-3">
            <div className="text-xs font-semibold text-slate-900">
              National Eligibility Test
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-500">
              <span>Subject: <strong className="font-medium text-slate-700">Physics</strong></span>
              <span>Set: <strong className="font-medium text-slate-700">A</strong></span>
              <span>Shift: <strong className="font-medium text-slate-700">1</strong></span>
              <span>Time: <strong className="font-medium text-slate-700">10 AM</strong></span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
