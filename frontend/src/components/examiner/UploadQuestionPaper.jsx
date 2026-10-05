import {CalendarDays,CheckCircle2,ChevronRight,FileCheck2,FileText,FileUp,Info,ShieldCheck,Upload,X,} from "lucide-react";
import { useState } from "react";
export default function UploadQuestionPaper({
  Card,SectionHeader,fileRef,selectedFile,handleFile,submitMockUpload,uploadMessage,
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    examination: "",
    subject: "",
    set: "",
    language: "",
    schedule: "",
  });

  const [errors, setErrors] = useState({});
  //mock data for examinations and schedules
  const examinations = [
    {
      id: "state-services",
      name: "State Services Prelims",
      subjects: ["General Studies", "Mathematics"],
    },
    {
      id: "net",
      name: "National Eligibility Test",
      subjects: ["Physics", "Chemistry", "Mathematics"],
    },
    {
      id: "board",
      name: "Board Annual Examination",
      subjects: ["Biology", "Physics", "Mathematics"],
    },
  ];

  const schedules = [
    {
      id: "schedule-1",
      examination: "State Services Prelims",
      date: "14 Nov 2026",
      shift: "Shift 1",
      time: "10:00 AM – 1:00 PM",
    },
    {
      id: "schedule-2",
      examination: "National Eligibility Test",
      date: "14 Nov 2026",
      shift: "Shift 2",
      time: "02:00 PM – 05:00 PM",
    },
    {
      id: "schedule-3",
      examination: "National Eligibility Test",
      date: "15 Nov 2026",
      shift: "Shift 1",
      time: "10:00 AM – 01:00 PM",
    },
    {
      id: "schedule-4",
      examination: "Board Annual Examination",
      date: "20 Nov 2026",
      shift: "Shift 1",
      time: "10:00 AM – 01:00 PM",
    },
  ];

  const selectedExamination = examinations.find(
    (item) => item.name === formData.examination,
  );

  const availableSchedules = schedules.filter(
    (item) => item.examination === formData.examination,
  );

  const updateField = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
      ...(field === "examination"
        ? {
            subject: "",
            schedule: "",
          }
        : {}),
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
    }));
  };

  const validateDetails = () => {
    const newErrors = {};

    if (!formData.examination) {
      newErrors.examination = "Select an examination.";
    }
    if (!formData.subject) {
      newErrors.subject = "Select the subject.";
    }
    if (!formData.set) {
      newErrors.set = "Select the paper/set.";
    }
    if (!formData.language) {
      newErrors.language = "Select the paper language.";
    }
    if (!formData.schedule) {
      newErrors.schedule = "Select the assigned examination schedule.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const continueToUpload = () => {
    if (!validateDetails()) return;
    setStep(2);
  };

  const continueToReview = () => {
    if (!selectedFile) {
      return;
    }
    setStep(3);
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    submitMockUpload(formData);
    setStep(1);
    setFormData({
      examination: "",
      subject: "",
      set: "",
      language: "",
      schedule: "",
    });
  };

  const resetForm = () => {
    setStep(1);

    setFormData({
      examination: "",
      subject: "",
      set: "",
      language: "",
      schedule: "",
    });

    setErrors({});
  };

  return (
    <Card className="overflow-hidden">
      <SectionHeader icon={Upload} title="Upload Question Paper" />

      {/* STEP INDICATOR */}
      <div className="border-b border-slate-100 bg-[#fbfcfe] px-5 py-4">
        <div className="flex items-center gap-2 text-xs">
          <StepIndicator
            number="1"
            title="Examination Details"
            active={step === 1}
            completed={step > 1}
          />

          <div className="h-px w-8 bg-slate-200" />

          <StepIndicator
            number="2"
            title="Question Paper"
            active={step === 2}
            completed={step > 2}
          />

          <div className="h-px w-8 bg-slate-200" />

          <StepIndicator
            number="3"
            title="Review & Submit"
            active={step === 3}
          />
        </div>
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="p-5">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Examination Details
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Select the examination and schedule assigned to you before
              uploading the question paper.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Examination */}
            <FormField label="Examination" required error={errors.examination}>
              <select
                value={formData.examination}
                onChange={(e) => updateField("examination", e.target.value)}
                className={selectClass(errors.examination)}
              >
                <option value="">Select examination</option>

                {examinations.map((exam) => (
                  <option key={exam.id} value={exam.name}>
                    {exam.name}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Subject */}
            <FormField label="Subject" required error={errors.subject}>
              <select
                value={formData.subject}
                disabled={!selectedExamination}
                onChange={(e) => updateField("subject", e.target.value)}
                className={selectClass(errors.subject)}
              >
                <option value="">Select subject</option>

                {selectedExamination?.subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Set */}
            <FormField label="Paper / Set" required error={errors.set}>
              <select
                value={formData.set}
                onChange={(e) => updateField("set", e.target.value)}
                className={selectClass(errors.set)}
              >
                <option value="">Select paper / set</option>
                <option value="A">Set A</option>
                <option value="B">Set B</option>
                <option value="C">Set C</option>
              </select>
            </FormField>

            {/* Language */}
            <FormField label="Language" required error={errors.language}>
              <select
                value={formData.language}
                onChange={(e) => updateField("language", e.target.value)}
                className={selectClass(errors.language)}
              >
                <option value="">Select language</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Hindi & English">Hindi & English</option>
              </select>
            </FormField>
          </div>

          {/* Assigned schedule */}
          <div className="mt-5">
            <FormField
              label="Assigned Examination Schedule"
              required
              error={errors.schedule}
            >
              <select
                value={formData.schedule}
                disabled={!formData.examination}
                onChange={(e) => updateField("schedule", e.target.value)}
                className={selectClass(errors.schedule)}
              >
                <option value="">
                  {formData.examination
                    ? "Select assigned schedule"
                    : "Select examination first"}
                </option>

                {availableSchedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.date} · {schedule.shift} · {schedule.time}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Security information */}
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#176bb0]" />

            <div>
              <div className="text-xs font-semibold text-slate-800">
                Secure submission
              </div>

              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                The examination schedule is assigned by the examination
                authority. Verify the details carefully before proceeding.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={continueToUpload}
              className="flex items-center gap-2 rounded-md bg-[#176bb0] px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-[#125b95]"
            >
              Continue to Upload
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="p-5">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Upload Complete Question Paper
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Upload the final and complete question paper corresponding to the
              examination details selected in the previous step.
            </p>
          </div>

          {/* Selected examination summary */}
          <div className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-[#fbfcfe] p-4 md:grid-cols-4">
            <SummaryItem label="Examination" value={formData.examination} />

            <SummaryItem label="Subject" value={formData.subject} />

            <SummaryItem label="Paper / Set" value={`Set ${formData.set}`} />

            <SummaryItem label="Language" value={formData.language} />
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFile}
          />

          <button
            onClick={() => fileRef.current?.click()}
            className="group flex min-h-[190px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#cbd9e5] bg-[#fbfdff] px-4 transition hover:border-[#3f7ba4] hover:bg-[#f7fbfe]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e9f3fa] text-[#1670ad] transition group-hover:bg-[#dceef9]">
              <FileUp size={23} />
            </div>

            <div className="mt-3 text-sm font-semibold text-slate-700">
              {selectedFile
                ? selectedFile.name
                : "Upload the complete question paper"}
            </div>

            {!selectedFile && (
              <>
                <div className="mt-1 text-xs text-slate-400">
                  PDF format only
                </div>

                <span className="mt-3 rounded-md bg-[#176bb0] px-5 py-2 text-xs font-medium text-white shadow-sm">
                  Select PDF File
                </span>
              </>
            )}

            <div className="mt-3 text-[10px] text-slate-400">
              Maximum file size: 50 MB
            </div>
          </button>

          {selectedFile && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-emerald-50/60 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-emerald-600">
                  <FileCheck2 size={18} />
                </div>

                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-slate-800">
                    {selectedFile.name}
                  </div>

                  <div className="mt-0.5 text-[10px] text-slate-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    {" · "}
                    PDF
                  </div>
                </div>

                <CheckCircle2 size={17} className="shrink-0 text-emerald-600" />
              </div>

              <button
                onClick={() => fileRef.current?.click()}
                className="shrink-0 text-xs font-medium text-[#176bb0] hover:text-[#125b95]"
              >
                Replace
              </button>
            </div>
          )}

          {uploadMessage && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
              <Info size={15} className="mt-0.5 shrink-0 text-[#176bb0]" />
              {uploadMessage}
            </div>
          )}

          <div className="mt-5 rounded-lg border border-slate-200 bg-[#fbfcfe] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Info size={16} className="text-[#176bb0]" />
              Before continuing
            </div>

            <div className="mt-3 grid gap-2 text-[11px] text-slate-500 md:grid-cols-2">
              <Guideline text="Ensure every page is included." />
              <Guideline text="Upload only the finalized paper." />
              <Guideline text="Verify the paper/set matches the assignment." />
              <Guideline text="Do not upload drafts or incomplete papers." />
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Back
            </button>

            <button
              onClick={continueToReview}
              disabled={!selectedFile}
              className="flex items-center gap-2 rounded-md bg-[#176bb0] px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-[#125b95] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Review Submission
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="p-5">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Review Submission
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Carefully verify the examination details and uploaded file before
              submitting.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            {/* Details */}
            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-3">
                <div className="text-xs font-semibold text-slate-800">
                  Examination Information
                </div>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-2">
                <ReviewItem label="Examination" value={formData.examination} />

                <ReviewItem label="Subject" value={formData.subject} />

                <ReviewItem label="Paper / Set" value={`Set ${formData.set}`} />

                <ReviewItem label="Language" value={formData.language} />

                <ReviewItem
                  label="Examination Schedule"
                  value={getScheduleText(schedules, formData.schedule)}
                  fullWidth
                />
              </div>
            </div>

            {/* File */}
            <div className="rounded-lg border border-slate-200 bg-[#fbfcfe] p-4">
              <div className="text-xs font-semibold text-slate-800">
                Question Paper
              </div>

              <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/60 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-[#176bb0]">
                    <FileText size={19} />
                  </div>

                  <div className="min-w-0">
                    <div className="break-all text-xs font-semibold text-slate-800">
                      {selectedFile?.name}
                    </div>

                    <div className="mt-1 text-[10px] text-slate-500">
                      {selectedFile
                        ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                        : ""}
                      {" · PDF"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 text-[10px] leading-4 text-slate-500">
                <ShieldCheck
                  size={14}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <span>
                  The document will be submitted for secure processing. Access
                  and subsequent release are controlled by the N.E.T.R.A.
                  workflow.
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50/60 px-4 py-3">
            <Info size={16} className="mt-0.5 shrink-0 text-amber-600" />

            <p className="text-[11px] leading-5 text-slate-600">
              By submitting, you confirm that this is the complete and finalized
              question paper for the selected examination schedule.
            </p>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Back
            </button>

            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 rounded-md bg-[#176bb0] px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-[#125b95]"
            >
              <ShieldCheck size={15} />
              Submit Securely
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS / MESSAGE */}
      {uploadMessage && step === 1 && (
        <div className="border-t border-slate-100 px-5 py-3">
          <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
            {uploadMessage}
          </div>
        </div>
      )}
    </Card>
  );
}

function StepIndicator({ number, title, active, completed }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${
          completed
            ? "bg-emerald-100 text-emerald-700"
            : active
              ? "bg-[#176bb0] text-white"
              : "bg-slate-100 text-slate-400"
        }`}
      >
        {completed ? "✓" : number}
      </div>

      <span
        className={`hidden text-xs font-medium sm:block ${
          active || completed ? "text-slate-700" : "text-slate-400"
        }`}
      >
        {title}
      </span>
    </div>
  );
}

function FormField({ label, required, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}

      {error && <p className="mt-1.5 text-[10px] text-red-500">{error}</p>}
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-1 truncate text-xs font-medium text-slate-700">
        {value}
      </div>
    </div>
  );
}

function ReviewItem({ label, value, fullWidth = false }) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-1 text-xs font-medium text-slate-800">{value}</div>
    </div>
  );
}

function Guideline({ text }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" />
      <span>{text}</span>
    </div>
  );
}

function selectClass(error) {
  return `w-full rounded-md border ${
    error ? "border-red-300" : "border-slate-200"
  } bg-white px-3 py-2.5 text-xs text-slate-700 outline-none transition focus:border-[#176bb0] focus:ring-2 focus:ring-[#176bb0]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`;
}

function getScheduleText(schedules, id) {
  const schedule = schedules.find((item) => item.id === id);

  if (!schedule) return "—";

  return `${schedule.date} · ${schedule.shift} · ${schedule.time}`;
}
