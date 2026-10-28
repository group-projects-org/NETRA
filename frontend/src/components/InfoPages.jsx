import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  LockKeyhole,
  Clock3,
  Printer,
  Fingerprint,
  Activity,
  ArrowRight,
  Mail,
  MessageSquare,
  FileCheck2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";

const features = [
  {
    number: "01",
    icon: LockKeyhole,
    title: "Encrypted paper handling",
    tag: "CONFIDENTIALITY",
    text: "Encryption is intended to protect question-paper content while it is stored or transferred between authorised parts of the workflow.",
  },
  {
    number: "02",
    icon: Clock3,
    title: "Time-controlled access",
    tag: "ACCESS CONTROL",
    text: "Access can be aligned with configured release windows, helping prevent examination material from being available earlier than intended.",
  },
  {
    number: "03",
    icon: Printer,
    title: "Controlled printing",
    tag: "EXAM CENTRES",
    text: "The workflow supports authorised retrieval and printing at examination centres, where local procedures remain an important part of security.",
  },
  {
    number: "04",
    icon: Fingerprint,
    title: "Forensic watermarking",
    tag: "TRACEABILITY",
    text: "Embedded identifying information can help investigators examine the possible source of a leaked copy when a marked paper is recovered.",
  },
  {
    number: "05",
    icon: Activity,
    title: "Activity records",
    tag: "ACCOUNTABILITY",
    text: "Recorded actions can help authorised staff review activity and reconstruct events during an operational or security investigation.",
  },
  {
    number: "06",
    icon: FileCheck2,
    title: "Authorised retrieval",
    tag: "WORKFLOW",
    text: "Question papers are intended to be retrieved through a defined process rather than distributed as uncontrolled files.",
  },
];

const workflow = [
  {
    number: "01",
    title: "Prepare the examination paper",
    text: "The paper is prepared by the responsible team and entered into the examination workflow.",
    note: "PREPARATION",
  },
  {
    number: "02",
    title: "Protect and schedule access",
    text: "The system's intended security flow applies protection and uses configured access timing for authorised users.",
    note: "PROTECTION",
  },
  {
    number: "03",
    title: "Retrieve at the examination centre",
    text: "Authorised personnel retrieve the required paper for the relevant examination session and follow the centre's printing procedure.",
    note: "DISTRIBUTION",
  },
  {
    number: "04",
    title: "Review records if an incident occurs",
    text: "Available activity records and forensic markings may support a review if a paper is suspected to have leaked.",
    note: "INVESTIGATION",
  },
];

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const links = [
  { label: "Home", to: "/" },
  { label: "How It Works", to: "/how-it-works" },
  { label: "Features", to: "/features" },
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
];

  return (
    <header className="border-b border-white/10 bg-[#07111d]">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-5 py-4 sm:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="NETRA home">
          <span className="flex h-10 w-10 items-center justify-center border border-sky-300/30 bg-sky-300/[0.07] text-sky-300">
            <ShieldCheck size={23} strokeWidth={1.6} />
          </span>
          <span>
            <span className="block text-lg font-semibold tracking-[0.16em] text-white">N.E.T.R.A.</span>
            <span className="mt-0.5 hidden text-[9px] tracking-[0.12em] text-slate-400 sm:block">NODAL ENCRYPTED TRANSMISSION & RETRIEVAL</span>
          </span>
        </Link>

        <div className="order-3 flex w-full items-center gap-x-5 gap-y-2 overflow-x-auto border-t border-white/[0.07] pt-3 text-sm md:order-2 md:w-auto md:border-0 md:pt-0">
          {links.map(({ label, to }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap border-b pb-2 transition-colors md:pb-1 ${
                  active
                    ? "border-sky-300 text-white"
                    : "border-transparent text-slate-400 hover:border-white/30 hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <button
          onClick={() => navigate("/login")}
          className="order-2 border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:border-sky-300/60 hover:bg-white/[0.04] md:order-3"
        >
          Login <ArrowRight className="ml-1 inline" size={14} />
        </button>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050c15] px-5 py-6 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-xs text-slate-500 sm:flex-row sm:items-center">
        <p>© {new Date().getFullYear()} N.E.T.R.A. · Examination security workflow</p>
        <p>Confidentiality · Controlled access · Traceability</p>
      </div>
    </footer>
  );
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#07111d] text-white">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="mb-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-300">
      <span className="h-px w-7 bg-sky-300/70" />
      {children}
    </p>
  );
}

function PageIntro({ index, label, title, description }) {
  return (
    <div className="grid gap-8 border-b border-white/10 pb-10 md:grid-cols-[150px_minmax(0,1fr)] md:gap-12 md:pb-12">
      <div className="flex items-start gap-3 text-xs tracking-[0.16em] text-slate-500 md:block">
        <span className="text-sky-300">{index}</span>
        <span className="hidden md:inline">/</span>
        <span>{label}</span>
      </div>
      <div className="max-w-4xl">
        <h1 className="text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">{description}</p>
      </div>
    </div>
  );
}

export function About() {
  return (
    <Layout>
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <PageIntro
          index="01"
          label="ABOUT THE PROJECT"
          title={<>A controlled route for sensitive examination material.</>}
          description="N.E.T.R.A. — Nodal Encrypted Transmission & Retrieval for Assessments — is a project focused on protecting examination-paper handling through access control, secure retrieval and forensic traceability."
        />

        <div className="grid gap-12 py-12 md:grid-cols-[1.05fr_0.95fr] md:gap-20 md:py-16">
          <div>
            <SectionLabel>Why this matters</SectionLabel>
            <h2 className="max-w-xl text-2xl font-medium leading-snug tracking-tight sm:text-3xl">Examination security is a process, not a single feature.</h2>
            <p className="mt-5 max-w-2xl leading-7 text-slate-400">
              Question papers pass through several stages before an examination begins. Each hand-off creates a need to control who can access the material, when it becomes available and how activity can be reviewed later.
            </p>
            <p className="mt-4 max-w-2xl leading-7 text-slate-400">
              NETRA brings these concerns into one proposed workflow. Its effectiveness depends on the implemented modules, deployment configuration and the procedures followed by the people using it.
            </p>
          </div>

          <div className="border-y border-white/10">
            {[
              ["01", "Confidentiality", "Limit exposure of paper content during handling and transfer."],
              ["02", "Controlled access", "Make authorised access and release timing explicit."],
              ["03", "Traceability", "Support later review with available records and forensic markings."],
            ].map(([number, title, text]) => (
              <div key={number} className="grid grid-cols-[42px_1fr] gap-4 border-b border-white/10 py-5 last:border-b-0">
                <span className="pt-1 text-xs tracking-widest text-sky-300">{number}</span>
                <div>
                  <h3 className="font-medium text-white">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6 border-t border-white/10 pt-7 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-white">Explore the system workflow</p>
            <p className="mt-1 text-sm text-slate-500">See how the stages fit together.</p>
          </div>
          <Link to="/how-it-works" className="inline-flex items-center gap-2 self-start border border-white/20 px-4 py-3 text-sm text-white transition hover:border-sky-300/50 hover:text-sky-200 sm:self-auto">
            View workflow <ChevronRight size={16} />
          </Link>
        </div>
      </section>
    </Layout>
  );
}


export function HowItWorks() {
  const stages = [
    {
      number: "01",
      label: "PREPARATION",
      title: "Prepare the examination paper",
      description:
        "The examination paper is prepared by the authorized team and made ready for secure distribution.",
      output: "Examination material ready"
    },
    {
      number: "02",
      label: "PROTECTION",
      title: "Encrypt and protect",
      description:
        "The paper is protected before transmission so that access to sensitive content can be controlled.",
      output: "Protected paper package"
    },
    {
      number: "03",
      label: "AUTHORIZATION",
      title: "Release access at the right time",
      description:
        "Authorized recipients retrieve the material according to the access permissions and release schedule configured for the system.",
      output: "Authorized access"
    },
    {
      number: "04",
      label: "EXAMINATION CENTRE",
      title: "Retrieve and print securely",
      description:
        "The examination centre retrieves the required paper and follows the configured secure-printing process.",
      output: "Printed examination paper"
    },
    {
      number: "05",
      label: "TRACEABILITY",
      title: "Support forensic investigation",
      description:
        "If a suspected leak occurs, available watermark and audit evidence can help investigators examine the paper's origin and handling history.",
      output: "Evidence for investigation"
    }
  ];

  return (
    <Layout>
      <section className="px-6 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
              NETRA / SYSTEM WORKFLOW
            </p>

            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
              Five stages.
              <br />
              <span className="text-slate-400">
                One accountable workflow.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300">
              NETRA is designed to support the secure handling of examination
              papers, from preparation and controlled distribution to
              traceability when a potential leak needs investigation.
            </p>
          </div>

          <div className="mt-14 grid gap-3 border-y border-white/15 py-5 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Process
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                Preparation to investigation
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Primary focus
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                Confidentiality and access control
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Supporting evidence
              </p>
              <p className="mt-2 text-sm font-medium text-white">
                Available audit and watermark data
              </p>
            </div>
          </div>

          <div className="mt-12">
            {stages.map((stage, index) => (
              <article
                key={stage.number}
                className="grid gap-4 border-b border-white/10 py-8 sm:grid-cols-[80px_1fr_220px] sm:gap-8 sm:py-10"
              >
                <div>
                  <span className="text-2xl font-light tabular-nums text-sky-300">
                    {stage.number}
                  </span>
                </div>

                <div>
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500">
                    {stage.label}
                  </p>
                  <h2 className="mt-3 text-xl font-semibold text-white sm:text-2xl">
                    {stage.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                    {stage.description}
                  </p>
                </div>

                <div className="flex items-start sm:justify-end">
                  <div className="border-l-2 border-sky-300/40 py-1 pl-4">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      Stage outcome
                    </p>
                    <p className="mt-2 text-sm text-slate-200">
                      {stage.output}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-col justify-between gap-5 border border-white/15 p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-300">
                Implementation note
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                This is the intended high-level workflow. Actual steps and
                security controls depend on the modules implemented and
                configured in the deployed system.
              </p>
            </div>

            <Link
              to="/features"
              className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-white transition hover:text-sky-300"
            >
              Explore features <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}


export function FeaturesPage() {
  return (
    <Layout>
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <PageIntro
          index="03"
          label="CAPABILITIES"
          title={<>Security functions, with a clear purpose.</>}
          description="NETRA's design brings together controls for protecting paper content, managing access and supporting review. The descriptions below explain the intended role of each capability."
        />

        <div className="py-8 sm:py-12">
          <div className="hidden grid-cols-[64px_minmax(180px,0.8fr)_150px_minmax(0,1.4fr)] gap-6 border-b border-white/15 pb-3 text-[10px] uppercase tracking-[0.18em] text-slate-500 md:grid">
            <span>No.</span><span>Capability</span><span>Focus</span><span>Purpose</span>
          </div>
          {features.map(({ number, icon: Icon, title, tag, text }) => (
            <article key={number} className="grid gap-3 border-b border-white/10 py-6 md:grid-cols-[64px_minmax(180px,0.8fr)_150px_minmax(0,1.4fr)] md:items-start md:gap-6">
              <span className="text-xs tracking-widest text-sky-300">{number}</span>
              <div className="flex items-start gap-3">
                <Icon size={19} strokeWidth={1.6} className="mt-0.5 shrink-0 text-sky-300" />
                <h2 className="font-medium text-white">{title}</h2>
              </div>
              <p className="text-[10px] font-medium tracking-[0.16em] text-slate-500">{tag}</p>
              <p className="text-sm leading-7 text-slate-400">{text}</p>
            </article>
          ))}
        </div>

        <div className="flex flex-col justify-between gap-5 border-t border-white/10 pt-7 sm:flex-row sm:items-center">
          <p className="max-w-2xl text-sm leading-6 text-slate-400">The capabilities shown describe the project's intended design; their availability depends on the modules implemented and configured.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 self-start border border-white/20 px-4 py-3 text-sm text-white transition hover:border-sky-300/50 hover:text-sky-200 sm:self-auto">
            Contact the project team <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </Layout>
  );
}


export function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState("");

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));

    setSubmitted(false);
    setFeedback("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    setSubmitted(true);
    setFeedback(
      "Your message is ready. Choose Copy message or Open email app to send it."
    );
  }

  const formattedMessage = [
    "NETRA — Project Enquiry",
    "",
    `Name: ${form.name}`,
    `Email: ${form.email}`,
    `Subject: ${form.subject}`,
    "",
    "Message:",
    form.message,
  ].join("\n");

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(formattedMessage);
      setFeedback("Message copied. You can now paste it into an email.");
    } catch {
      setFeedback(
        "Automatic copying was blocked. Please select and copy your message manually."
      );
    }
  }

  function openEmailApp() {
    const subject = encodeURIComponent(`[NETRA] ${form.subject}`);
    const body = encodeURIComponent(formattedMessage);

    window.location.href = `mailto:?subject=${subject}&body=${body}`;

    setFeedback(
      "Your email app should open. Add the project's real contact address in the To field, then send the email."
    );
  }

  const inputClass =
    "mt-2 w-full border border-white/15 bg-[#050c15] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-300/70";

  return (
    <Layout>
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <PageIntro
          index="04"
          label="CONTACT"
          title={<>Send a question to the NETRA team.</>}
          description="Use this form to describe a project question, report a UI issue or share feedback. Please do not include confidential examination papers or sensitive credentials."
        />

        <div className="grid gap-12 py-12 md:grid-cols-[0.7fr_1.3fr] md:gap-20 md:py-16">
          <aside>
            <SectionLabel>Before you write</SectionLabel>

            <h2 className="text-xl font-medium">
              A useful message starts with context.
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-400">
              Tell us which part of the project your question relates to and
              what you expected to happen. That makes it easier to understand
              the issue.
            </p>

            <div className="mt-8 space-y-4 border-t border-white/10 pt-5">
              <div className="flex gap-3">
                <MessageSquare
                  size={18}
                  className="mt-0.5 shrink-0 text-sky-300"
                />
                <div>
                  <p className="text-sm font-medium text-white">
                    Project feedback
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    UI, navigation or workflow suggestions.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <ClipboardCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-sky-300"
                />
                <div>
                  <p className="text-sm font-medium text-white">Issue report</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Include the page and steps that reproduce the issue.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Mail
                  size={18}
                  className="mt-0.5 shrink-0 text-sky-300"
                />
                <div>
                  <p className="text-sm font-medium text-white">
                    Email delivery
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Prepare the message here, then send it using your email app.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <form
            onSubmit={handleSubmit}
            className="border border-white/10 p-5 sm:p-8"
          >
            <div className="mb-7 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <h2 className="text-lg font-medium">Contact form</h2>
                <p className="mt-1 text-xs text-slate-500">
                  All fields are required.
                </p>
              </div>

              <span className="border border-white/10 px-2.5 py-1 text-[10px] tracking-wider text-slate-500">
                NETRA / MESSAGE
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm text-slate-300">
                Full name
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="Your name"
                  className={inputClass}
                />
              </label>

              <label className="block text-sm text-slate-300">
                Email address
                <input
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={updateField}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </label>
            </div>

            <label className="mt-5 block text-sm text-slate-300">
              Subject
              <input
                required
                maxLength={150}
                type="text"
                name="subject"
                value={form.subject}
                onChange={updateField}
                placeholder="What is this about?"
                className={inputClass}
              />
            </label>

            <label className="mt-5 block text-sm text-slate-300">
              Message
              <textarea
                required
                minLength={10}
                maxLength={5000}
                rows={5}
                name="message"
                value={form.message}
                onChange={updateField}
                placeholder="Describe your question or feedback..."
                className={`${inputClass} resize-y`}
              />
              <span className="mt-1 block text-right text-xs text-slate-500">
                {form.message.length}/5000
              </span>
            </label>

            <button
              type="submit"
              className="mt-6 inline-flex items-center gap-2 border border-sky-300/50 bg-sky-300/[0.08] px-5 py-3 text-sm font-medium text-white transition hover:bg-sky-300/[0.15]"
            >
              Prepare message <ArrowRight size={15} />
            </button>

            {submitted && (
              <div
                role="status"
                className="mt-6 border border-white/15 bg-white/[0.03] p-5"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={19}
                    className="mt-0.5 shrink-0 text-sky-300"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">
                      Message prepared
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {feedback}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={copyMessage}
                    className="border border-white/20 px-4 py-2.5 text-sm text-white transition hover:bg-white/[0.06]"
                  >
                    Copy message
                  </button>

                  <button
                    type="button"
                    onClick={openEmailApp}
                    className="inline-flex items-center gap-2 border border-sky-300/40 bg-sky-300/[0.08] px-4 py-2.5 text-sm text-white transition hover:bg-sky-300/[0.15]"
                  >
                    Open email app <ArrowRight size={14} />
                  </button>
                </div>

                <p className="mt-4 text-xs leading-5 text-slate-500">
                  No message is sent or stored by this page. Add the project's
                  actual email address before sending. Delivery is not confirmed
                  by opening your email app.
                </p>
              </div>
            )}
          </form>
        </div>
      </section>
    </Layout>
  );
}
