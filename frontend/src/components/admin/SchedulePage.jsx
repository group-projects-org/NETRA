import { useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock3,
  Layers,
  Loader2,
  Plus,
  Search,
  Send,
  Users,
  X,
  Trash2
} from "lucide-react";

const API_BASE_URL = (
  import.meta.env.VITE_NODE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  ""
).replace(/\/$/, "");

// Aligned with AdminDashboard.jsx DEPARTMENTS list
const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Other",
];

const newTopic = () => ({
  id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  topicName: "",
  easyQuestions: 0,
  mediumQuestions: 0,
  hardQuestions: 0,
});

export default function SchedulePage({ schedules = [], setSchedules }) {
  const [showForm, setShowForm] = useState(false);

  // Blueprint Form State
  const [examName, setExamName] = useState("");
  const [subject, setSubject] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [marksMode, setMarksMode] = useState("UNIFORM");
  const [marksPerQuestion, setMarksPerQuestion] = useState("1");
  const [easyMarks, setEasyMarks] = useState("1");
  const [mediumMarks, setMediumMarks] = useState("2");
  const [hardMarks, setHardMarks] = useState("3");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");
  const [distributionType, setDistributionType] = useState("ALL");

  // Department-wise Examiner Selection State (mirrors AdminDashboard Notification pattern)
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [departmentExaminers, setDepartmentExaminers] = useState([]);
  const [selectedExaminerIds, setSelectedExaminerIds] = useState([]);
  const [loadingExaminers, setLoadingExaminers] = useState(false);
  const [examinerError, setExaminerError] = useState("");

  // Topic-wise Question Distribution State
  const [sections, setSections] = useState([newTopic()]);

  // Form Submission State
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successInfo, setSuccessInfo] = useState(null);

  const handleDistributionChange = (mode) => {
    setDistributionType(mode);
    setSelectedDepartment("");
    setDepartmentExaminers([]);
    setSelectedExaminerIds([]);
    setExaminerError("");
    setFormError("");
  };

  // Exact department-wise examiner fetch pattern from AdminDashboard.jsx
  const handleDepartmentChange = async (event) => {
    const department = event.target.value;
    setSelectedDepartment(department);
    setDepartmentExaminers([]);
    setSelectedExaminerIds([]);
    setExaminerError("");

    if (!department) return;
    if (!API_BASE_URL) {
      setExaminerError("VITE_NODE_API_URL is not configured in the frontend .env file.");
      return;
    }

    setLoadingExaminers(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications/examiners?department=${encodeURIComponent(department)}`
      );
      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to fetch examiners for this department.");
      }

      const examinerList = Array.isArray(data)
        ? data
        : data.examiners ?? data.data ?? [];
      setDepartmentExaminers(examinerList);
    } catch (error) {
      setExaminerError(error.message || "Something went wrong while fetching examiners.");
    } finally {
      setLoadingExaminers(false);
    }
  };

  const toggleExaminerSelection = (examinerDbId) => {
    setSelectedExaminerIds((current) =>
      current.includes(examinerDbId)
        ? current.filter((id) => id !== examinerDbId)
        : [...current, examinerDbId]
    );
  };

  const toggleSelectAllExaminers = () => {
    const allIds = departmentExaminers.map((examiner) => Number(examiner.id));
    const allSelected =
      allIds.length > 0 && allIds.every((id) => selectedExaminerIds.includes(id));

    setSelectedExaminerIds((current) =>
      allSelected
        ? current.filter((id) => !allIds.includes(id))
        : [...new Set([...current, ...allIds])]
    );
  };

  const updateSection = (id, field, value) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== id) return sec;
        if (field === "topicName") return { ...sec, topicName: value };
        const cleanNum = value === "" ? "" : Math.max(0, Math.floor(Number(value) || 0));
        return { ...sec, [field]: cleanNum };
      })
    );
  };

  const totals = sections.reduce(
    (acc, s) => {
      const e = Number(s.easyQuestions) || 0;
      const m = Number(s.mediumQuestions) || 0;
      const h = Number(s.hardQuestions) || 0;
      acc.easy += e;
      acc.medium += m;
      acc.hard += h;
      acc.all += e + m + h;
      return acc;
    },
    { easy: 0, medium: 0, hard: 0, all: 0 }
  );

  const calculatedMarks = marksMode === "UNIFORM"
    ? totals.all * (Number(marksPerQuestion) || 0)
    : totals.easy * (Number(easyMarks) || 0) + totals.medium * (Number(mediumMarks) || 0) + totals.hard * (Number(hardMarks) || 0);

  const resetForm = () => {
    setExamName("");
    setSubject("");
    setTotalMarks("");
    setMarksMode("UNIFORM");
    setMarksPerQuestion("1");
    setEasyMarks("1");
    setMediumMarks("2");
    setHardMarks("3");
    setDeadlineDate("");
    setDeadlineTime("");
    setDistributionType("ALL");
    setSelectedDepartment("");
    setDepartmentExaminers([]);
    setSelectedExaminerIds([]);
    setExaminerError("");
    setSections([newTopic()]);
  };

  const handleCreateBlueprint = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setFormError("");
    setSuccessInfo(null);

    if (!examName.trim() || !subject.trim()) {
      return setFormError("Examination Name and Subject are required.");
    }
    const marksNum = Number(totalMarks);
    if (!Number.isInteger(marksNum) || marksNum <= 0) {
      return setFormError("Total Marks must be a positive whole number.");
    }
    if (!deadlineDate || !deadlineTime) {
      return setFormError("Please select both Deadline Date and Time.");
    }
    const policyValues = marksMode === "UNIFORM"
      ? [Number(marksPerQuestion)]
      : [Number(easyMarks), Number(mediumMarks), Number(hardMarks)];
    if (policyValues.some((value) => !Number.isSafeInteger(value) || value <= 0)) {
      return setFormError("Marks per question must be positive whole numbers.");
    }
    if (distributionType === "DEPARTMENT") {
      if (!selectedDepartment) {
        return setFormError("Please select a department.");
      }
      if (selectedExaminerIds.length === 0) {
        return setFormError("Please select at least one examiner from this department.");
      }
    }
    if (sections.length === 0) {
      return setFormError("At least one topic section is required.");
    }

    for (let i = 0; i < sections.length; i += 1) {
      const sec = sections[i];
      if (!sec.topicName.trim()) {
        return setFormError(`Topic #${i + 1} name cannot be empty.`);
      }
      const qTotal =
        (Number(sec.easyQuestions) || 0) +
        (Number(sec.mediumQuestions) || 0) +
        (Number(sec.hardQuestions) || 0);
      if (qTotal <= 0) {
        return setFormError(`Add at least 1 question in "${sec.topicName.trim()}".`);
      }
    }

    if (calculatedMarks !== marksNum) {
      return setFormError(`The marking policy calculates ${calculatedMarks} marks, but Total Marks is ${marksNum}. Please make them match.`);
    }

    if (!API_BASE_URL) {
      return setFormError("VITE_NODE_API_URL is not configured in the frontend .env file.");
    }

    const formattedTime = deadlineTime.length === 5 ? `${deadlineTime}:00` : deadlineTime;
    const payload = {
      examName: examName.trim(),
      subject: subject.trim(),
      totalMarks: marksNum,
      marksMode,
      marksPerQuestion: marksMode === "UNIFORM" ? Number(marksPerQuestion) : null,
      easyMarks: marksMode === "DIFFICULTY_BASED" ? Number(easyMarks) : null,
      mediumMarks: marksMode === "DIFFICULTY_BASED" ? Number(mediumMarks) : null,
      hardMarks: marksMode === "DIFFICULTY_BASED" ? Number(hardMarks) : null,
      deadline: `${deadlineDate} ${formattedTime}`,
      distributionType,
      sections: sections.map(({ topicName, easyQuestions, mediumQuestions, hardQuestions }) => ({
        topicName: topicName.trim(),
        easyQuestions: Number(easyQuestions) || 0,
        mediumQuestions: Number(mediumQuestions) || 0,
        hardQuestions: Number(hardQuestions) || 0,
      })),
    };

    if (distributionType === "DEPARTMENT") {
      payload.targetDepartment = selectedDepartment;
      payload.examinerIds = selectedExaminerIds.map(Number);
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/blueprints/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to create blueprint.");
      }

      const createdId = result.data?.blueprintId;
      const assignedCount = result.data?.assignedExaminerCount ?? null;

      if (typeof setSchedules === "function" && createdId != null) {
        setSchedules((prev) => [
          {
            id: createdId,
            examination: `${payload.examName} (${payload.subject})`,
            date: deadlineDate,
            time: formattedTime,
            slot:
              distributionType === "ALL"
                ? "All Active Examiners"
                : `${selectedDepartment} (${selectedExaminerIds.length} Examiners)`,
            duration: `${marksNum} Marks • ${totals.all} Questions`,
          },
          ...prev,
        ]);
      }

      setSuccessInfo({
        message: result.message || "Blueprint created and assigned successfully.",
        blueprintId: result.data?.blueprintId,
        assignedExaminerCount: assignedCount,
      });

      resetForm();
      setShowForm(false);
    } catch (err) {
      setFormError(err.message || "Unable to create blueprint.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-[#1d5b88] focus:bg-white focus:ring-2 focus:ring-blue-100";

  return (
    <div className="w-full space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#071a3d]">
            Exam Schedule &amp; Question Blueprints
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure examination schedules, topic-wise question distributions, and examiner assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm((prev) => !prev);
            setFormError("");
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#176bb0] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#125b95]"
        >
          {showForm ? <X size={17} /> : <Plus size={17} />}
          {showForm ? "Close Form" : "Add Exam"}
        </button>
      </div>

      {/* Success Feedback */}
      {successInfo && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
            <div className="text-sm">
              <p className="font-semibold">{successInfo.message}</p>
              {(successInfo.blueprintId != null || successInfo.assignedExaminerCount != null) && (
                <p className="mt-1 text-xs text-emerald-700">
                  {successInfo.blueprintId != null && `Blueprint ID: #${successInfo.blueprintId}`}
                  {successInfo.blueprintId != null && successInfo.assignedExaminerCount != null && " • "}
                  {successInfo.assignedExaminerCount != null &&
                    `Assigned Examiners: ${successInfo.assignedExaminerCount}`}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessInfo(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Question Blueprint Creation Form */}
      {showForm && (
        <form
          onSubmit={handleCreateBlueprint}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.05)]"
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-[#f8fbff] px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#176bb0] text-white">
                <BookOpen size={18} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#071a3d]">
                  Create Examination &amp; Question Blueprint
                </h2>
                <p className="text-xs text-slate-500">
                  Define paper structure, marks, submission deadline, and target examiners.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6">
            {formError && (
              <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Section 1: Exam Details */}
            <div>
              <h3 className="mb-3.5 text-xs font-semibold uppercase tracking-wider text-[#1d5b88]">
                1. Exam Details
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Examination Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="e.g. JEE Main 2026"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Physics"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Total Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    placeholder="e.g. 100"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Deadline Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Deadline Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h4 className="text-sm font-semibold text-slate-800">Question marking policy</h4><p className="mt-1 text-xs text-slate-500">The examiner will follow these marks while creating questions.</p></div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${calculatedMarks === Number(totalMarks) && Number(totalMarks) > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>Calculated: {calculatedMarks} / {Number(totalMarks) || 0} marks</span>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div><label className="text-xs font-semibold text-slate-700">Marking mode</label><select value={marksMode} onChange={(e) => setMarksMode(e.target.value)} className={inputCls}><option value="UNIFORM">Uniform marks per question</option><option value="DIFFICULTY_BASED">Marks by difficulty</option></select></div>
                  {marksMode === "UNIFORM" ? <div><label className="text-xs font-semibold text-slate-700">Marks per question</label><input type="number" min="1" step="1" value={marksPerQuestion} onChange={(e) => setMarksPerQuestion(e.target.value)} className={inputCls}/></div> : <div className="grid grid-cols-3 gap-2 sm:col-span-1"><div><label className="text-xs font-semibold text-slate-700">Easy</label><input type="number" min="1" step="1" value={easyMarks} onChange={(e) => setEasyMarks(e.target.value)} className={inputCls}/></div><div><label className="text-xs font-semibold text-slate-700">Medium</label><input type="number" min="1" step="1" value={mediumMarks} onChange={(e) => setMediumMarks(e.target.value)} className={inputCls}/></div><div><label className="text-xs font-semibold text-slate-700">Hard</label><input type="number" min="1" step="1" value={hardMarks} onChange={(e) => setHardMarks(e.target.value)} className={inputCls}/></div></div>}
                </div>
                <p className="mt-3 text-xs text-slate-500">Marks are calculated from the topic-wise question counts below. The calculated value must equal Total Marks before creation.</p>
              </div>
            </div>

            {/* Section 2: Distribution */}
            <div className="border-t border-slate-100 pt-6">
              <h3 className="mb-3.5 text-xs font-semibold uppercase tracking-wider text-[#1d5b88]">
                2. Examiner Distribution
              </h3>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleDistributionChange("ALL")}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                    distributionType === "ALL"
                      ? "border-[#176bb0] bg-[#f3f8fe] ring-2 ring-blue-100"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      distributionType === "ALL"
                        ? "bg-[#176bb0] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Users size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">All Active Examiners</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Assign automatically to all active examiners across departments.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDistributionChange("DEPARTMENT")}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                    distributionType === "DEPARTMENT"
                      ? "border-[#176bb0] bg-[#f3f8fe] ring-2 ring-blue-100"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      distributionType === "DEPARTMENT"
                        ? "bg-[#176bb0] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Building2 size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Department-wise</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Choose a department and select specific active examiners.
                    </p>
                  </div>
                </button>
              </div>

              {distributionType === "DEPARTMENT" && (
                <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="grid gap-4 md:grid-cols-2 md:items-end">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedDepartment}
                        onChange={handleDepartmentChange}
                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#1d5b88] focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Select department</option>
                        {DEPARTMENTS.map((department) => (
                          <option key={department} value={department}>
                            {department}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs">
                      <span className="text-slate-600">Selected examiners</span>
                      <span className="rounded bg-[#eef5fc] px-2.5 py-0.5 font-semibold text-[#174b85]">
                        {selectedExaminerIds.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-800">Available Examiners</h4>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {departmentExaminers.length} examiner{departmentExaminers.length === 1 ? "" : "s"} found
                      </p>
                    </div>
                    {departmentExaminers.length > 0 && (
                      <button
                        type="button"
                        onClick={toggleSelectAllExaminers}
                        className="text-xs font-semibold text-[#176bb0] hover:text-[#125b95]"
                      >
                        {departmentExaminers.every((examiner) =>
                          selectedExaminerIds.includes(Number(examiner.id))
                        )
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    )}
                  </div>

                  {examinerError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                      {examinerError}
                    </div>
                  )}

                  <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                    {loadingExaminers ? (
                      <div className="flex min-h-[140px] items-center justify-center gap-2 text-xs text-slate-500">
                        <Loader2 size={17} className="animate-spin text-[#176bb0]" />
                        Loading examiners...
                      </div>
                    ) : !selectedDepartment ? (
                      <div className="flex min-h-[140px] flex-col items-center justify-center px-4 text-center text-slate-400">
                        <Search size={20} className="mb-2" />
                        <p className="text-xs">Select a department to view examiners.</p>
                      </div>
                    ) : departmentExaminers.length === 0 ? (
                      <div className="flex min-h-[140px] items-center justify-center px-4 text-center text-xs text-slate-500">
                        No active examiners found in this department.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {departmentExaminers.map((examiner) => {
                          const examinerDbId = Number(examiner.id);
                          const isSelected = selectedExaminerIds.includes(examinerDbId);
                          return (
                            <label
                              key={examiner.id}
                              className={`flex cursor-pointer items-start gap-3 px-4 py-3.5 transition hover:bg-slate-50 ${
                                isSelected ? "bg-[#f4f9fe]" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleExaminerSelection(examinerDbId)}
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#176bb0]"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-semibold text-slate-800">
                                  {examiner.full_name || examiner.name || "Unnamed examiner"}
                                </span>
                                <span className="mt-0.5 block font-mono text-[11px] text-[#1d5b88]">
                                  {examiner.examiner_id || examiner.examinerId || ""}
                                </span>
                                <span className="mt-0.5 block break-all text-[11px] text-slate-500">
                                  {examiner.department || selectedDepartment}
                                  {examiner.email ? ` • ${examiner.email}` : ""}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Topic-wise Question Distribution */}
            <div className="border-t border-slate-100 pt-6">
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-[#1d5b88]" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1d5b88]">
                    3. Topic-wise Question Distribution
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSections((prev) => [...prev, newTopic()])}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#176bb0] bg-[#f4f9fe] px-3 py-1.5 text-xs font-semibold text-[#176bb0] transition hover:bg-[#e5f0fc]"
                >
                  <Plus size={14} />
                  Add Topic
                </button>
              </div>

              <div className="space-y-3">
                {sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 sm:grid-cols-2 lg:grid-cols-[minmax(0,2.2fr)_repeat(3,minmax(0,1fr))_auto] lg:items-end"
                  >
                    <div className="sm:col-span-2 lg:col-span-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Topic #{idx + 1} Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={sec.topicName}
                        onChange={(e) => updateSection(sec.id, "topicName", e.target.value)}
                        placeholder="e.g. Mechanics"
                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#1d5b88]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700">Easy Questions</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={sec.easyQuestions}
                        onChange={(e) => updateSection(sec.id, "easyQuestions", e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#1d5b88]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700">Medium Questions</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={sec.mediumQuestions}
                        onChange={(e) => updateSection(sec.id, "mediumQuestions", e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#1d5b88]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700">Hard Questions</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={sec.hardQuestions}
                        onChange={(e) => updateSection(sec.id, "hardQuestions", e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#1d5b88]"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={sections.length <= 1}
                      onClick={() => setSections((prev) => prev.filter((s) => s.id !== sec.id))}
                      title="Remove Topic"
                      className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={15} />
                      <span className="lg:hidden">Remove</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Total Questions Summary */}
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-[#dce8f2] bg-[#f6faff] px-4 py-3 text-xs sm:grid-cols-4">
                <div>
                  <span className="text-slate-500">Easy</span>
                  <p className="mt-0.5 text-base font-bold text-slate-800">{totals.easy}</p>
                </div>
                <div>
                  <span className="text-slate-500">Medium</span>
                  <p className="mt-0.5 text-base font-bold text-slate-800">{totals.medium}</p>
                </div>
                <div>
                  <span className="text-slate-500">Hard</span>
                  <p className="mt-0.5 text-base font-bold text-slate-800">{totals.hard}</p>
                </div>
                <div className="sm:border-l sm:border-[#dce8f2] sm:pl-4">
                  <span className="font-semibold text-[#1d5b88]">Total Questions</span>
                  <p className="mt-0.5 text-base font-bold text-[#071a3d]">{totals.all}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Action Footer */}
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#176bb0] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#125b95] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {submitting ? "Creating Blueprint..." : "Create & Assign Blueprint"}
            </button>
          </div>
        </form>
      )}

      {/* Scheduled Examinations & Blueprints List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
          <Clock3 size={19} className="text-[#1d5b88]" />
          <h2 className="text-[15px] font-semibold text-slate-900">Created Blueprints</h2>
        </div>

        {schedules.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No examinations scheduled yet. Click &ldquo;Add Exam&rdquo; to create a question blueprint.
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
                  <div className="mt-1.5 text-xs text-slate-500">
                    Deadline: {schedule.date} • {schedule.time}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Distribution: {schedule.slot} • {schedule.duration}
                  </div>
                </div>


              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}