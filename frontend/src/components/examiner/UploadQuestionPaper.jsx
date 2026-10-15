import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileImage,
  FileText,
  Flag,
  LayoutDashboard,
  LockKeyhole,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

const ASSIGNMENT = {
  id: "EX-102",
  examination: "National Eligibility Test",
  subject: "Computer Networks",
  set: "A",
  language: "English",
  requiredQuestions: 10,
  deadline: "10 Nov 2026",
};

const EMPTY_QUESTION = {
  text: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  difficulty: "Medium",
  marks: "1",
  negativeMarks: "0",
  image: null,
};

const OPTION_LABELS = ["A", "B", "C", "D"];

function Panel({ children, className = "" }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 ${className}`}>{children}</section>;
}

function FieldLabel({ children, optional = false }) {
  return <label className="mb-2 block text-sm font-semibold text-slate-700">{children}{optional && <span className="ml-1.5 font-normal text-slate-400">Optional</span>}</label>;
}

function StatusPill({ children, color = "slate" }) {
  const colors = {
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${colors[color]}`}>{children}</span>;
}

export default function UploadQuestionPaper({ embedded = false }) {
  const [questions, setQuestions] = useState([]);
  const [question, setQuestion] = useState({ ...EMPTY_QUESTION, options: [...EMPTY_QUESTION.options] });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionPage, setQuestionPage] = useState(1);
  const fileRef = useRef(null);

  const pageSize = 5;
  const filteredQuestions = questions.filter((item) => item.text.toLowerCase().includes(questionSearch.trim().toLowerCase()) || item.id.toLowerCase().includes(questionSearch.trim().toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const visibleQuestions = filteredQuestions.slice((questionPage - 1) * pageSize, questionPage * pageSize);

  const completedCount = questions.length;
  const progress = Math.min(100, Math.round((completedCount / ASSIGNMENT.requiredQuestions) * 100));
  const remaining = Math.max(0, ASSIGNMENT.requiredQuestions - completedCount);
  const canFinish = completedCount >= ASSIGNMENT.requiredQuestions;
  const totalMarks = useMemo(() => questions.reduce((total, item) => total + Number(item.marks || 0), 0), [questions]);

  const updateQuestion = (key, value) => {
    setQuestion((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setNotice("");
  };

  const updateOption = (index, value) => {
    setQuestion((current) => ({ ...current, options: current.options.map((option, i) => i === index ? value : option) }));
    setErrors((current) => ({ ...current, options: "" }));
  };

  const resetForm = () => {
    setQuestion({ ...EMPTY_QUESTION, options: [...EMPTY_QUESTION.options] });
    setErrors({});
    setActiveQuestion(null);
    setNotice("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const validateQuestion = () => {
    const nextErrors = {};
    if (!question.text.trim()) nextErrors.text = "Add the question statement before saving.";
    if (question.options.some((option) => !option.trim())) nextErrors.options = "Fill in all four answer options.";
    if (new Set(question.options.map((option) => option.trim().toLowerCase())).size !== 4) nextErrors.options = "Each answer option must be different.";
    if (!question.correctAnswer) nextErrors.correctAnswer = "Choose the correct answer.";
    if (!question.marks || Number(question.marks) <= 0) nextErrors.marks = "Marks must be greater than zero.";
    return nextErrors;
  };

  const saveQuestion = (event) => {
    event.preventDefault();
    const nextErrors = validateQuestion();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setNotice("");
      return;
    }

    const savedQuestion = {
      ...question,
      options: [...question.options],
      id: activeQuestion ?? `Q-${String(questions.length + 1).padStart(2, "0")}`,
    };

    setQuestions((current) => activeQuestion
      ? current.map((item) => item.id === activeQuestion ? savedQuestion : item)
      : [...current, savedQuestion]);
    if (!activeQuestion) setQuestionPage(Math.max(1, Math.ceil((questions.length + 1) / pageSize)));
    setNotice(activeQuestion ? "Question changes saved." : "Question added to this assignment.");
    resetForm();
  };

  const editQuestion = (item) => {
    setQuestion({ ...item, options: [...item.options] });
    setActiveQuestion(item.id);
    setErrors({});
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteQuestion = (id) => {
    setQuestions((current) => current.filter((item) => item.id !== id));
    setQuestionPage((current) => Math.min(current, Math.max(1, Math.ceil((questions.length - 1) / pageSize))));
    if (activeQuestion === id) resetForm();
    setNotice("Question removed from the assignment.");
  };

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setErrors((current) => ({ ...current, image: "Use a PNG, JPG, or WebP image." }));
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((current) => ({ ...current, image: "Image must be smaller than 5 MB." }));
      event.target.value = "";
      return;
    }
    updateQuestion("image", file);
  };

  const finishAssignment = () => {
    if (!canFinish) return;
    setNotice("All required questions are present. Backend submission and encryption need to be connected before this can be finalized.");
  };

  return (
    <div className={embedded ? "text-slate-900" : "min-h-screen bg-[#f5f7fb] text-slate-900"}>
      <div className={embedded ? "flex" : "flex min-h-screen"}>
        {!embedded && <aside className="hidden w-[248px] shrink-0 flex-col bg-[#101c35] text-white lg:flex">
          <div className="flex h-[82px] items-center gap-3 border-b border-white/10 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 shadow-lg shadow-blue-950/30"><ShieldCheck size={22} /></div>
            <div><p className="text-[15px] font-bold tracking-wide">N.E.T.R.A.</p><p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.19em] text-slate-400">Secure assessment</p></div>
          </div>
          <div className="px-4 pt-7">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
            <button type="button" className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"><LayoutDashboard size={18} /> Dashboard</button>
            <button type="button" className="mt-1 flex w-full items-center gap-3 rounded-xl bg-blue-500/15 px-3 py-3 text-sm font-semibold text-blue-300 ring-1 ring-inset ring-blue-400/20"><BookOpen size={18} /> Create questions <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" /></button>
            <button type="button" className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"><FileText size={18} /> My question bank</button>
          </div>
          <div className="mt-auto p-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-200"><LockKeyhole size={15} className="text-emerald-400" /> Secure workspace</div>
              <p className="text-xs leading-5 text-slate-400">Your questions are prepared inside your assigned examination workspace.</p>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-medium text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Session active</div>
            </div>
            <div className="mt-4 flex items-center gap-3 border-t border-white/10 px-2 pt-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-xs font-bold">EX</div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">Examiner workspace</p><p className="mt-0.5 text-xs text-slate-400">Question setter</p></div>
              <ChevronDown size={16} className="text-slate-400" />
            </div>
          </div>
        </aside>}

        <main className="min-w-0 flex-1">
          {!embedded && <header className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
            <div className="flex items-center gap-2 text-sm"><span className="text-slate-400">Workspace</span><span className="text-slate-300">/</span><span className="font-semibold text-slate-700">Create questions</span></div>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1.5 text-xs font-medium text-slate-500 sm:flex"><LockKeyhole size={14} /> Private workspace</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700 ring-1 ring-blue-100">EX</div>
            </div>
          </header>}

          <div className={embedded ? "mx-auto w-full max-w-[1440px]" : "mx-auto max-w-[1440px] px-4 py-6 sm:px-8 sm:py-8"}>
            <div className="mb-5 border-b border-slate-200 pb-5">
  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
    <div className="min-w-0 flex-1">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          <FileText size={14} />
          Assignment {ASSIGNMENT.id}
        </span>

        <span className="inline-flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
          <Clock3 size={14} />
          Due {ASSIGNMENT.deadline}
        </span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[30px]">
        Create question set
      </h1>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Prepare and review multiple-choice questions for your assigned examination.
      </p>
    </div>

    <div className="flex shrink-0 flex-wrap items-center gap-3 xl:pl-6">
      <button
        type="button"
        onClick={resetForm}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 active:bg-slate-100"
      >
        Clear form
      </button>

      <button
        type="button"
        onClick={finishAssignment}
        disabled={!canFinish}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white"
      >
        <ShieldCheck size={17} />
        Finish assignment
        <ArrowRight size={16} />
      </button>
    </div>
  </div>

            </div>

            <Panel className="mb-6 overflow-hidden">
              <div className="grid gap-0 md:grid-cols-[1.4fr_1fr]">
                <div className="p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><BookOpen size={23} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-slate-900">{ASSIGNMENT.examination}</h2><StatusPill>Set {ASSIGNMENT.set}</StatusPill></div>
                      <p className="mt-1 text-sm text-slate-500">Subject: <span className="font-semibold text-slate-700">{ASSIGNMENT.subject}</span></p>
                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500"><span>Language: <strong className="font-semibold text-slate-700">{ASSIGNMENT.language}</strong></span><span>Question type: <strong className="font-semibold text-slate-700">Multiple choice</strong></span><span>Assignment ID: <strong className="font-semibold text-slate-700">{ASSIGNMENT.id}</strong></span></div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6 md:border-l md:border-t-0">
                  <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold text-slate-700">Assignment progress</p><span className="text-sm font-bold text-slate-900">{completedCount}<span className="font-medium text-slate-400"> / {ASSIGNMENT.requiredQuestions}</span></span></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300" style={{ width: `${progress}%` }} /></div>
                  <div className="mt-3 flex items-center justify-between text-xs"><span className="font-medium text-slate-500">{remaining ? `${remaining} more ${remaining === 1 ? "question" : "questions"} required` : "Required question count reached"}</span><span className="font-bold text-blue-700">{progress}%</span></div>
                </div>
              </div>
            </Panel>

            {notice && <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800"><CheckCircle2 size={18} className="mt-0.5 shrink-0" /><p>{notice}</p><button type="button" onClick={() => setNotice("")} aria-label="Dismiss message" className="ml-auto text-blue-500 hover:text-blue-800"><X size={16} /></button></div>}

            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
              <Panel className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><FileText size={19} /></div><div><h2 className="font-bold text-slate-900">{activeQuestion ? "Edit question" : "Question details"}</h2><p className="mt-0.5 text-xs text-slate-500">Fields marked with * are required</p></div></div>
                  <StatusPill color="blue">{activeQuestion ?? `New question ${completedCount + 1}`}</StatusPill>
                </div>

                <form onSubmit={saveQuestion} className="space-y-6 p-5 sm:p-6">
                  <div>
                    <FieldLabel>Question statement <span className="text-rose-500">*</span></FieldLabel>
                    <textarea value={question.text} onChange={(event) => updateQuestion("text", event.target.value)} rows={4} maxLength={2000} placeholder="Type the question clearly. Include all details needed to answer it..." className={`w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 ${errors.text ? "border-rose-300" : "border-slate-200"}`} />
                    <div className="mt-1.5 flex items-center justify-between"><p className="text-xs text-rose-600">{errors.text}</p><p className="text-xs text-slate-400">{question.text.length}/2000</p></div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between"><FieldLabel>Answer options <span className="text-rose-500">*</span></FieldLabel><span className="text-xs font-medium text-slate-400">Select the correct answer below</span></div>
                    <div className="space-y-3">
                      {question.options.map((option, index) => (
                        <div key={OPTION_LABELS[index]} className={`flex items-center gap-3 rounded-xl border p-3 transition ${question.correctAnswer === OPTION_LABELS[index] ? "border-emerald-300 bg-emerald-50/60" : "border-slate-200 bg-white focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-500/5"}`}>
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${question.correctAnswer === OPTION_LABELS[index] ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>{OPTION_LABELS[index]}</span>
                          <input value={option} onChange={(event) => updateOption(index, event.target.value)} placeholder={`Enter option ${OPTION_LABELS[index]}`} className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" />
                          <button type="button" onClick={() => updateQuestion("correctAnswer", OPTION_LABELS[index])} aria-label={`Mark option ${OPTION_LABELS[index]} as correct`} className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition ${question.correctAnswer === OPTION_LABELS[index] ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}>{question.correctAnswer === OPTION_LABELS[index] ? <Check size={14} /> : <span className="h-3.5 w-3.5 rounded-full border border-current" />}{question.correctAnswer === OPTION_LABELS[index] ? "Correct" : "Mark correct"}</button>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-rose-600">{errors.options || errors.correctAnswer}</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div><FieldLabel>Difficulty level</FieldLabel><select value={question.difficulty} onChange={(event) => updateQuestion("difficulty", event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
                    <div><FieldLabel>Marks <span className="text-rose-500">*</span></FieldLabel><input type="number" min="0.5" max="100" step="0.5" value={question.marks} onChange={(event) => updateQuestion("marks", event.target.value)} className={`w-full rounded-xl border px-3.5 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 ${errors.marks ? "border-rose-300" : "border-slate-200"}`} /><p className="mt-1 text-xs text-rose-600">{errors.marks}</p></div>
                    <div><FieldLabel>Negative marks</FieldLabel><input type="number" min="0" max="100" step="0.25" value={question.negativeMarks} onChange={(event) => updateQuestion("negativeMarks", event.target.value)} className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" /></div>
                  </div>

                  <div>
                    <FieldLabel optional>Question image</FieldLabel>
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImage} className="hidden" />
                    {question.image ? (
                      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-emerald-700"><FileImage size={20} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{question.image.name}</p><p className="text-xs text-slate-500">{(question.image.size / 1024).toFixed(0)} KB</p></div><button type="button" onClick={() => { updateQuestion("image", null); if (fileRef.current) fileRef.current.value = ""; }} aria-label="Remove image" className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-rose-600"><Trash2 size={16} /></button></div>
                    ) : (
                      <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-5 text-center transition hover:border-blue-400 hover:bg-blue-50/40"><span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"><UploadCloud size={20} /></span><span className="text-sm font-semibold text-slate-700">Click to upload an image</span><span className="mt-1 text-xs text-slate-400">PNG, JPG or WebP · Maximum 5 MB</span></button>
                    )}
                    <p className="mt-1.5 text-xs text-rose-600">{errors.image}</p>
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-2"><button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">Cancel</button><button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"><Save size={16} /> {activeQuestion ? "Save changes" : "Add question"} <Plus size={15} /></button></div>
                  </div>
                </form>
              </Panel>

              <div className="space-y-6">
                <Panel className="overflow-hidden">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900">Question bank</h2>
                        <p className="mt-1 text-xs leading-5 text-slate-500">Review and manage questions in this assignment.</p>
                      </div>
                      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-slate-100 px-2 text-sm font-semibold text-slate-700">{completedCount}</span>
                    </div>
                    <div className="relative mt-4">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input value={questionSearch} onChange={(event) => { setQuestionSearch(event.target.value); setQuestionPage(1); }} placeholder="Search questions..." aria-label="Search saved questions" className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" />
                    </div>
                  </div>

                  <div className="p-3">
                    {questions.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                        <FileText size={22} className="mx-auto text-slate-400" />
                        <p className="mt-3 text-sm font-medium text-slate-700">No questions added</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">Questions you add will appear here.</p>
                      </div>
                    ) : filteredQuestions.length === 0 ? (
                      <div className="px-3 py-8 text-center">
                        <Search size={20} className="mx-auto text-slate-400" />
                        <p className="mt-2 text-sm font-medium text-slate-700">No matching questions</p>
                        <p className="mt-1 text-xs text-slate-500">Try another question number or keyword.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {visibleQuestions.map((item) => {
                          const questionNumber = questions.findIndex((saved) => saved.id === item.id) + 1;
                          return (
                            <div key={item.id} className={`py-3 first:pt-1 last:pb-1 ${activeQuestion === item.id ? "rounded-lg bg-blue-50 px-2" : "px-1"}`}>
                              <div className="flex items-start gap-3">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600">{String(questionNumber).padStart(2, "0")}</span>
                                <div className="min-w-0 flex-1">
                                  <button type="button" onClick={() => editQuestion(item)} className="block w-full text-left text-[13px] font-medium leading-5 text-slate-800 transition hover:text-blue-700">{item.text}</button>
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <StatusPill color={item.difficulty === "Easy" ? "green" : item.difficulty === "Hard" ? "amber" : "blue"}>{item.difficulty}</StatusPill>
                                    <span className="text-[11px] text-slate-500">{item.marks} {Number(item.marks) === 1 ? "mark" : "marks"}</span>
                                    <button type="button" onClick={() => editQuestion(item)} className="ml-auto text-xs font-semibold text-blue-700 hover:text-blue-900">Edit</button>
                                    <button type="button" onClick={() => deleteQuestion(item.id)} aria-label={`Remove question ${questionNumber}`} className="rounded-md p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {filteredQuestions.length > 0 && (
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <p className="text-[11px] text-slate-500">Showing {((questionPage - 1) * pageSize) + 1}–{Math.min(questionPage * pageSize, filteredQuestions.length)} of {filteredQuestions.length}</p>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => setQuestionPage((page) => Math.max(1, page - 1))} disabled={questionPage === 1} aria-label="Previous questions" className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={15} /></button>
                          <span className="min-w-12 text-center text-xs font-medium text-slate-600">{questionPage} / {totalPages}</span>
                          <button type="button" onClick={() => setQuestionPage((page) => Math.min(totalPages, page + 1))} disabled={questionPage === totalPages} aria-label="Next questions" className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={15} /></button>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Total marks</span><span className="font-semibold tabular-nums text-slate-900">{totalMarks}</span></div>
                      <div className="mt-2 flex items-center justify-between text-xs"><span className="text-slate-500">Questions remaining</span><span className={`font-semibold tabular-nums ${remaining ? "text-amber-700" : "text-emerald-700"}`}>{remaining}</span></div>
                    </div>
                  </div>
                </Panel>

                <Panel className="p-5">
                  <div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><CircleHelp size={19} /></div><div><h3 className="text-sm font-bold text-slate-900">Before you submit</h3><p className="mt-1 text-xs leading-5 text-slate-500">Review the correct answer, ensure options are distinct, and confirm the marks are accurate.</p></div></div>
                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-2.5 text-xs text-slate-600"><CheckCircle2 size={15} className="text-emerald-600" /> Four answer options per question</div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-600"><CheckCircle2 size={15} className="text-emerald-600" /> One correct answer selected</div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-600"><CheckCircle2 size={15} className="text-emerald-600" /> Required question count reached</div>
                  </div>
                </Panel>

              
              </div>
            </div>
            <footer className="mt-8 flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>© 2026 N.E.T.R.A. · Secure assessment workspace</span><span className="flex items-center gap-1.5"><LockKeyhole size={12} /> Confidential examiner interface</span></footer>
          </div>
        </main>
      </div>
    </div>
  );
}
