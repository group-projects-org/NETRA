import { useState } from "react";
import {UserRound, Mail,Phone,Building2,MapPin,Camera,Save,X,CheckCircle2,ShieldCheck,LockKeyhole,} from "lucide-react";
export default function ExaminerProfile({ examiner }) {
  const initialProfile = {
    name: examiner.name || "",
    email: examiner.email || "",
    phone: examiner.phone || "",
    organization: examiner.organization || "",
    department: examiner.department || "",
    designation: examiner.role || "Examiner",
    location: "",
    alternateEmail: "",
    address: "",
  };

  const [profile, setProfile] = useState(initialProfile);
  const [savedProfile, setSavedProfile] = useState(initialProfile);
  const [photo, setPhoto] = useState("");
  const [savedPhoto, setSavedPhoto] = useState("");
  const [message, setMessage] = useState("");

  const update = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setMessage("");
  };

  const requiredFields = [
    "name", "email", "phone", "organization", "department",
  ];

  const completion = Math.round(
    (requiredFields.filter((field) => profile[field]?.trim()).length /
      requiredFields.length) * 100
  );

  const saveProfile = (e) => {
    e.preventDefault();
    if (!profile.name.trim() || !profile.email.trim() || !profile.phone.trim() || !profile.organization.trim() || !profile.department.trim()) {
      setMessage("Please complete all required fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    setSavedProfile({ ...profile });
    setSavedPhoto(photo);
    setMessage("Profile changes saved in this session.");
  };

  const cancelChanges = () => {
    setProfile({ ...savedProfile });
    setPhoto(savedPhoto);
    setMessage("");
  };

  const field = (label, key, Icon, required = false, type = "text") => (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
        {label}{required && <span className="text-red-500"> *</span>}
      </span>
      <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:focus-within:ring-blue-950">
        <span className="border-r border-slate-100 px-3 py-2.5 text-slate-400 dark:border-slate-700">
          <Icon size={17} />
        </span>
        <input
          type={type}
          value={profile[key]}
          onChange={(e) => update(key, e.target.value)}
          required={required}
          maxLength={key === "phone" ? 20 : 150}
          className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none dark:text-slate-100"
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      </div>
    </label>
  );

  const readOnlyField = (label, value, Icon) => (
    <div>
      <span className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
        <Icon size={17} className="shrink-0 text-slate-400" />
        <span className="truncate text-sm font-medium text-slate-600 dark:text-slate-300">
          {value || "Not available"}
        </span>
      </div>
    </div>
  );

  const sectionTitle = (title, subtitle) => (
    <div className="mb-5">
      <h2 className="text-base font-bold text-slate-900 dark:text-white">
        {title}
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {subtitle}
      </p>
    </div>
  );

  return (
    <form onSubmit={saveProfile} className="space-y-5">
      {/* Heading and completion */}
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your personal information and account details.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-blue-100 text-sm font-bold text-blue-700 dark:border-blue-950 dark:text-blue-300"
            style={{
              background: `conic-gradient(#2563eb ${completion}%, #e2e8f0 ${completion}%)`,
            }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-slate-900">
              {completion}%
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">
              Profile completion
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {completion === 100 ? "Required fields complete" : "Complete required fields"}
            </p>
          </div>
          {completion === 100 && (
            <CheckCircle2 size={19} className="text-emerald-500" />
          )}
        </div>
      </div>

      {/* Personal information */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
        {sectionTitle("Personal Information", "Your name and contact details.")}

        <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
          <div className="flex flex-col items-center border-b border-slate-100 pb-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5 dark:border-slate-800">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#3e6484] text-2xl font-bold text-white ring-4 ring-blue-50 dark:ring-slate-800">
                {photo ? (
                  <img src={photo} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "EX"
                )}
              </div>
              <label title="Upload profile photo" className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-blue-700 text-white dark:border-slate-900">
                <Camera size={16} />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      setMessage("Profile photo must be smaller than 2 MB.");
                      e.target.value = "";
                      return;
                    }
                    setPhoto(URL.createObjectURL(file));
                    setMessage("");
                  }}
                />
              </label>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-white">
              {profile.name || "Your name"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Examiner · {examiner.id}
            </p>
            <p className="mt-3 text-center text-[11px] text-slate-400">
              JPG, PNG or WEBP · Max 2 MB
            </p>
          </div>

          <div className="grid content-start gap-4 sm:grid-cols-2">
            {field("Full Name", "name", UserRound, true)}
            {field("Phone Number", "phone", Phone, true, "tel")}
            {field("Email Address", "email", Mail, true, "email")}
            {field("Alternate Email", "alternateEmail", Mail, false, "email")}
          </div>
        </div>
      </section>

      {/* Organization and account */}
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
          {sectionTitle("Organization Details", "Your official work information.")}
          <div className="space-y-4">
            {field("Organization", "organization", Building2, true)}
            {field("Department", "department", Building2, true)}
            {field("Designation", "designation", UserRound)}
            {field("Location / Office", "location", MapPin)}
          </div>
          <div className="mt-4">
            {field("Office Address", "address", MapPin)}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-slate-900">
          {sectionTitle("Account Information", "System-managed details that cannot be edited here.")}
          <div className="space-y-4">
            {readOnlyField("Examiner ID", examiner.id, ShieldCheck)}
            {readOnlyField("Role", examiner.role, UserRound)}
            {readOnlyField("Account Status", examiner.status, CheckCircle2)}
            {readOnlyField("Last Login", examiner.lastLogin, LockKeyhole)}
          </div>
          <div className="mt-5 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
            Your Examiner ID, role and account status are controlled by the administrator.
          </div>
        </section>
      </div>

      {/* Feedback and actions */}
      {message && (
        <p role="status" className="text-sm font-medium text-blue-700 dark:text-blue-300">
          {message}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
        <button
          type="button"
          onClick={cancelChanges}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <X size={16} /> Cancel
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"
        >
          <Save size={16} /> Save Changes
        </button>
      </div>
    </form>
  );
};
