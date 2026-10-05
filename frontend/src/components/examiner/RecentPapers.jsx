import { FileText, MoreVertical } from "lucide-react";

export default function RecentPapers({
  Card,
  SectionHeader,
  StatusBadge,
  papers,
  openPaper,
  setPaperFilter,
  setView,
}) {
  return (
    <Card className="overflow-hidden">
      <SectionHeader
        icon={FileText}
        title="Recent Question Papers"
        action="View all"
        onAction={() => {
          setPaperFilter("All");
          setView("papers");
        }}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-[#fbfcfe] text-[11px] text-slate-500">
              {[
                "Paper ID",
                "Examination",
                "Subject",
                "Set",
                "Exam Schedule",
                "Current Stage",
                "Last Updated",
                "Actions",
              ].map((heading) => (
                <th key={heading} className="px-4 py-3 font-medium">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {papers.slice(0, 5).map((paper) => (
              <tr
                key={paper.id}
                className="border-b border-slate-100 last:border-0 hover:bg-[#fafcff]"
              >
                <td className="px-4 py-3 text-xs font-medium text-slate-800">
                  {paper.id}
                </td>
                <td className="max-w-[150px] px-4 py-3 text-xs text-slate-600">
                  {paper.examination}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {paper.subject}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {paper.set}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  <div>{paper.date}</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    {paper.shift} • {paper.time}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge stage={paper.stage} />
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  <div>{paper.updated}</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    {paper.updatedTime}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => openPaper(paper)}
                    className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  >
                    <MoreVertical size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
