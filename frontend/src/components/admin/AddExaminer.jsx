
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const departments = [
  "Computer Science",
  "Information Technology",
  "Electronics",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Other",
];

const initialFormData = {
  fullName: "",
  email: "",
  phone: "",
  department: "",
};

export default function AddExaminer() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [copyMessage, setCopyMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validate = () => {
    const next = {};

    if (!formData.fullName.trim()) {
      next.fullName = "Please enter the examiner's full name.";
    }

    if (!formData.email.trim()) {
      next.email = "Email address is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      next.email = "Please enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      next.phone = "Phone number is required.";
    } else if (!/^\d{10,15}$/.test(formData.phone.trim())) {
      next.phone = "Enter a valid phone number.";
    }

    if (!formData.department) {
      next.department = "Please select a department.";
    }

    setErrors(next);

    return Object.keys(next).length === 0;
  };

  // Create examiner through backend API
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5001/api/admin/examiners/add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            fullName: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to create examiner."
        );
      }

      setSuccessData(result.data);
      setCopyMessage("");
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error.message || "Something went wrong.",
      }));
    } finally {
      setLoading(false);
    }
  };

  // Copy generated credentials
  const handleCopyCredentials = async () => {
    const credentials = [
      `Examiner ID: ${successData.examinerId}`,
      `Temporary Password: ${successData.temporaryPassword}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(credentials);
      setCopyMessage("Credentials copied successfully.");
    } catch {
      setCopyMessage("Unable to copy. Please copy the credentials manually.");
    }
  };

  // Reset form for another examiner
  const handleAddAnother = () => {
    setFormData(initialFormData);
    setErrors({});
    setSuccessData(null);
    setCopyMessage("");
  };

  const inputStyle =
    "w-full rounded-md border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  const labelStyle =
    "mb-2 block text-sm font-medium text-slate-700";

  const fieldError = (name) =>
    errors[name] ? (
      <p className="mt-1.5 text-xs text-red-600">
        {errors[name]}
      </p>
    ) : null;

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-800">

      {/* Minimal Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#142c4e] text-lg font-bold text-white">
              N
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-wide text-[#142c4e]">
                NETRA
              </h1>
              <p className="text-[9px] font-medium tracking-[2px] text-slate-400">
                SECURE EXAMINATION SYSTEM
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <span>←</span>
            <span className="hidden sm:inline">
              Back to Dashboard
            </span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12">

        {/* Breadcrumb */}
        <div className="mb-7 flex items-center gap-2 text-xs text-slate-500">
          <span>Administration</span>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-blue-700">
            Add Examiner
          </span>
        </div>

        {/* Page Heading */}
        <div className="mb-9">
          <div className="mb-3 inline-flex items-center gap-2 rounded border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[10px] font-semibold tracking-[1.3px] text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            EXAMINER MANAGEMENT
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Add New Examiner
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Create an examiner account by providing their basic
            information. NETRA will take care of account credentials
            automatically.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_310px]">

          {/* Form Section */}
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)]">

            <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
              <h3 className="text-base font-semibold text-slate-900">
                Examiner Details
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Fields marked with * are mandatory.
              </p>
            </div>

            {/* SUCCESS SCREEN */}
            {successData ? (
              <div className="px-6 py-12 sm:px-8">

                <div className="mx-auto max-w-md text-center">

                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl text-emerald-600">
                    ✓
                  </div>

                  <h3 className="text-xl font-semibold text-slate-900">
                    Examiner Created Successfully
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    The examiner account has been successfully
                    registered in the NETRA system.
                  </p>

                  <div className="mt-8 space-y-5 rounded-lg border border-slate-200 bg-slate-50 p-5 text-left">

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        Examiner Name
                      </p>
                      <p className="mt-1.5 text-sm font-semibold text-slate-800">
                        {successData.fullName}
                      </p>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        Examiner ID
                      </p>
                      <p className="mt-1.5 break-all text-base font-semibold tracking-wide text-[#174b85]">
                        {successData.examinerId}
                      </p>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        Temporary Password
                      </p>
                      <p className="mt-1.5 break-all font-mono text-sm font-semibold text-slate-800">
                        {successData.temporaryPassword}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                      <span className="text-xs text-slate-500">
                        Account Status
                      </span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        Active
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Password Change
                      </span>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                        Required
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-left">
                    <p className="text-xs font-semibold text-amber-800">
                      Important Security Notice
                    </p>
                    <p className="mt-1 text-xs leading-5 text-amber-700">
                      Save these credentials securely and share them
                      only with the intended examiner. The temporary
                      password will not be shown again after leaving
                      this screen.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                    <button
                      type="button"
                      onClick={handleCopyCredentials}
                      className="flex-1 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Copy Credentials
                    </button>

                    <button
                      type="button"
                      onClick={handleAddAnother}
                      className="flex-1 rounded-md bg-[#174b85] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#123c6b]"
                    >
                      Add Another Examiner
                    </button>

                  </div>

                  {copyMessage && (
                    <p
                      role="status"
                      className="mt-3 text-xs text-slate-600"
                    >
                      {copyMessage}
                    </p>
                  )}
                </div>
              </div>
            ) : (

              /* EXAMINER FORM */
              <form onSubmit={handleSubmit}>

                <div className="px-6 py-7 sm:px-8">

                  {/* Personal Information */}
                  <div className="mb-7">

                    <h4 className="mb-5 text-sm font-semibold text-slate-800">
                      Personal Information
                    </h4>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">

                      <div className="sm:col-span-2">
                        <label className={labelStyle}>
                          Full Name <span className="text-red-500">*</span>
                        </label>

                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          placeholder="Enter full name"
                          className={inputStyle}
                          autoComplete="name"
                        />

                        {fieldError("fullName")}
                      </div>

                      <div>
                        <label className={labelStyle}>
                          Email Address <span className="text-red-500">*</span>
                        </label>

                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="name@organization.com"
                          className={inputStyle}
                          autoComplete="email"
                        />

                        {fieldError("email")}
                      </div>

                      <div>
                        <label className={labelStyle}>
                          Phone Number <span className="text-red-500">*</span>
                        </label>

                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Enter phone number"
                          className={inputStyle}
                          autoComplete="tel"
                        />

                        {fieldError("phone")}
                      </div>

                      <div className="sm:col-span-2">
                        <label className={labelStyle}>
                          Department <span className="text-red-500">*</span>
                        </label>

                        <select
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          className={`${inputStyle} ${
                            !formData.department
                              ? "text-slate-400"
                              : ""
                          }`}
                        >
                          <option value="">
                            Select department
                          </option>

                          {departments.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>

                        {fieldError("department")}
                      </div>

                    </div>
                  </div>

                  {/* Account Settings */}
                  <div className="border-t border-slate-100 pt-7">

                    <h4 className="mb-4 text-sm font-semibold text-slate-800">
                      Account Settings
                    </h4>

                    <div className="rounded-md border border-slate-200 bg-slate-50 p-4 sm:p-5">

                      <div className="flex gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-blue-700 shadow-sm">
                          <svg
                            viewBox="0 0 24 24"
                            width="19"
                            height="19"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          >
                            <rect
                              x="4"
                              y="10"
                              width="16"
                              height="11"
                              rx="2"
                            />
                            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                          </svg>
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Automatic account credentials
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            A unique Examiner ID and temporary password
                            will be generated automatically after
                            submission. The password will be securely
                            hashed before storage.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4">

                        <div>
                          <p className="text-[10px] font-semibold tracking-wider text-slate-400">
                            EXAMINER ID
                          </p>

                          <p className="mt-1.5 text-sm font-medium text-slate-700">
                            Auto-generated
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold tracking-wider text-slate-400">
                            INITIAL STATUS
                          </p>

                          <p className="mt-1.5 text-sm font-medium text-emerald-600">
                            Active
                          </p>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* API Error */}
                  {errors.submit && (
                    <div
                      role="alert"
                      className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                      {errors.submit}
                    </div>
                  )}

                </div>

                {/* Form Footer */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">

                  <p className="text-xs text-slate-400">
                    <span className="text-red-500">*</span> Required information
                  </p>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row">

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setFormData(initialFormData);
                        setErrors({});
                      }}
                      className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      Clear Form
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-md bg-[#174b85] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#123c6b] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Creating...
                        </span>
                      ) : (
                        <>
                          Create Examiner <span className="ml-1">→</span>
                        </>
                      )}
                    </button>

                  </div>
                </div>

              </form>
            )}
          </section>

          {/* Information Panel */}
          <aside className="space-y-5">

            <section className="rounded-lg border border-slate-200 bg-white p-5">

              <h3 className="text-sm font-semibold text-slate-900">
                What happens next?
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Account creation workflow
              </p>

              <div className="mt-6 space-y-5">

                {[
                  [
                    "01",
                    "Submit details",
                    "Admin enters and submits examiner information.",
                  ],
                  [
                    "02",
                    "Generate credentials",
                    "NETRA creates a unique ID and temporary password.",
                  ],
                  [
                    "03",
                    "Save account",
                    "Examiner details and password hash are saved securely.",
                  ],
                ].map(([number, title, description]) => (
                  <div key={number} className="flex gap-3">

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600">
                      {number}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}

              </div>
            </section>

            <section className="rounded-lg border border-blue-100 bg-[#eef5fc] p-5">

              <div className="flex items-center gap-2">

                <svg
                  viewBox="0 0 24 24"
                  width="19"
                  height="19"
                  fill="none"
                  stroke="#174b85"
                  strokeWidth="1.8"
                >
                  <path d="M12 3 4 6v5c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-3Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>

                <h3 className="text-sm font-semibold text-[#174b85]">
                  Data Security
                </h3>

              </div>

              <p className="mt-3 text-xs leading-6 text-slate-600">
                Examiner passwords are processed securely on the backend
                using password hashing. Plain-text passwords are never
                stored in the database.
              </p>
            </section>

            <p className="px-1 text-[11px] leading-5 text-slate-400">
              NETRA · Secure Examination Management System
            </p>

          </aside>
        </div>
      </main>
    </div>
  );
}
