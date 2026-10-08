import {ArrowRight,BarChart3,Fingerprint,LockKeyhole,MapPin,Printer,ShieldCheck,Clock3,UserRound,} from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
function Home() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#07111d]">
      <header className="absolute left-0 top-0 z-50 w-full">
        <nav className="flex w-full items-center justify-between px-[4.5%] py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-white/20 bg-white/5 backdrop-blur-sm">
              <ShieldCheck size={27} strokeWidth={1.5} className="text-sky-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-[0.12em] text-white">
                N.E.T.R.A.
              </h1>
              <p className="text-[9px] tracking-wide text-slate-300">
                Nodal Encrypted Transmission & Retrieval for Assessments
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-8 lg:flex">
            <a href="#home" className="relative text-sm text-white">
              Home
              <span className="absolute -bottom-3 left-0 h-px w-full bg-sky-300" />
            </a>
            <a href="#how-it-works" className="text-sm text-slate-300 transition hover:text-white">
              How It Works
            </a>
            <a href="#features" className="text-sm text-slate-300 transition hover:text-white">
              Features
            </a>
            <a href="#contact" className="text-sm text-slate-300 transition hover:text-white">
              Contact
            </a>
          </div>

          <button onClick={() => navigate("/login")}
            className="flex items-center gap-2 rounded-md border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:border-white/40 hover:bg-white/10">
            <UserRound size={16} />
            Login
          </button>
        </nav>
      </header>

      <section id="home" className="relative min-h-[calc(100vh-105px)] overflow-hidden">
        <div className="absolute inset-0 scale-105 bg-cover bg-center" style={{ backgroundImage: "url('/netra.png')" }}/>
        <div className="absolute inset-0 bg-[#061321]/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#061321]/90 via-[#061321]/45 to-[#061321]/10" />
        <div className="relative z-10 flex min-h-[calc(100vh-105px)] w-full items-center px-[4%] pb-16 pt-28">
          <div className="max-w-3xl">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-10 bg-sky-300" />
                <span className="text-[11px] font-medium uppercase tracking-[0.28em] text-sky-100">
                Secure Examinations&nbsp; | &nbsp;Fair Future
              </span>
            </div>

            <h2 className="text-5xl font-bold leading-[1.04] tracking-tight text-white md:text-6xl lg:text-[64px]">
              Ensuring Confidentiality
              <br />
              in Every{" "}
              <span className="inline-block bg-[linear-gradient(110deg,#8fc9e8_20%,#ffffff_40%,#8fc9e8_60%)] bg-[length:200%_100%] bg-clip-text text-transparent animate-[textShine_5s_linear_infinite]">
                Examination.
              </span>
            </h2>

            <p className="mt-7 max-w-xl text-base leading-7 text-slate-200 md:text-lg">
              N.E.T.R.A. is a secure, end-to-end platform for encrypted
              question paper delivery, controlled printing, and forensic leak
              attribution — built for the integrity of national examinations.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <button onClick={() =>document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                className="group flex items-center gap-3 rounded-md bg-[#1d4f73] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition duration-300 hover:bg-[#245f89]">
                Explore N.E.T.R.A.

              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1"/>
              </button>

              <button onClick={() =>document.getElementById("architecture")?.scrollIntoView({ behavior: "smooth" })}
                className="flex items-center gap-3 rounded-md border border-white/30 bg-white/5 px-6 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition duration-300 hover:bg-white/10">
                <ShieldCheck size={18} />
                Security
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="features"className="relative z-20 border-t border-white/10 bg-[#071521]">
        <div className="grid w-full grid-cols-2 lg:grid-cols-6">
          <Feature icon={<LockKeyhole />} title="End-to-End Encryption" description="AES-256 secured question papers"/>
          <Feature icon={<Clock3 />} title="Time-Bound Access" description="T-60 key release mechanism"/>
          <Feature icon={<Printer />} title="Secure Printing" description="In-memory decryption at exam centres"/>
          <Feature icon={<Fingerprint />} title="Steganographic Watermarking" description="Invisible, tamper-resistant identification"/>
          <Feature icon={<MapPin />} title="Forensic Leak Attribution" description="Identify source if leaked online/offline"/>
          <Feature icon={<BarChart3 />} title="Real-Time Monitoring" description="Complete audit trail and alerts"/>
        </div>
      </section>

      <section id="about" className="hidden" />
      <section id="architecture" className="hidden" />
      <section id="how-it-works" className="hidden" />
      <section id="security" className="hidden" />
      <section id="contact" className="hidden" />
    </div>
  );
}

function Feature({ icon, title, description }) {
  return (
    <div className="group flex min-h-[105px] items-center gap-4 border-r border-white/10 px-5 py-5 transition-colors duration-300 last:border-r-0 hover:bg-white/[0.025]">
      <div className="shrink-0 text-sky-300 transition-transform duration-300 group-hover:-translate-y-1">
        {React.cloneElement(icon, {
          size: 25,
          strokeWidth: 1.5,
        })}
      </div>

      <div>
        <h3 className="text-[12px] font-semibold text-white">
          {title}
        </h3>

        <p className="mt-1 text-[10px] leading-4 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}
export default Home;