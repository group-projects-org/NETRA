import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("Examiner");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaChecked, setCaptchaChecked] = useState(false);

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateY = (x / rect.width - 0.5) * 4;
    const rotateX = (y / rect.height - 0.5) * -4;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };
  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform =
      "perspective(1000px) rotateX(0deg) rotateY(0deg)";
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-900">
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center"
        style={{
          backgroundImage: "url('/netra.png')",
          filter: "blur(2px)",
        }}
      />

      <div className="absolute inset-0 bg-slate-900/30" />

      <header className="relative z-10 flex items-center justify-between px-[4.5%] py-6">
        <div>
          <h1 className="text-2xl font-bold tracking-[0.12em] text-white">
            N.E.T.R.A.
          </h1>

          <p className="mt-1 text-[9px] tracking-wide text-slate-200">
            Nodal Encrypted Transmission & Retrieval for Assessments
          </p>
        </div>

        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-white/80 transition hover:text-white"
        >
          <ArrowLeft size={15} />
          Back to Home
        </button>
      </header>

      <section className="relative z-10 flex min-h-[calc(100vh-96px)] items-center justify-center px-5 pb-10">
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full max-w-[420px] rounded-lg border border-slate-200 bg-slate-50 px-7 py-6 shadow-[0_20px_50px_rgba(0,0,0,0.28)] transition-transform duration-300 ease-out"
        >
          <div className="mb-6 border-b border-slate-200 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#1E4E70]">
                <ShieldCheck size={18} className="text-white" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Sign in
                </h2>

                <p className="text-xs text-slate-500">
                  N.E.T.R.A. Secure Examination System
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">
                Portal
              </label>

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1E4E70] focus:ring-1 focus:ring-[#1E4E70]/20"
              >
                <option>Examiner</option>
                <option>Centre Superintendent</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="officialId"
                className="mb-1.5 block text-xs font-medium text-slate-600"
              >
                Official ID
              </label>

              <input
                id="officialId"
                type="text"
                placeholder="Enter your official ID"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 transition focus:border-[#1E4E70] focus:ring-1 focus:ring-[#1E4E70]/20"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-slate-600"
                >
                  Password
                </label>

                <button
                  type="button"
                  className="text-xs text-[#1E4E70] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm text-slate-800 outline-none placeholder:text-slate-400 transition focus:border-[#1E4E70] focus:ring-1 focus:ring-[#1E4E70]/20"           />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-3">
              <label className="flex items-center gap-2.5 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={captchaChecked}
                  onChange={(e) => setCaptchaChecked(e.target.checked)}
                  className="h-4 w-4 accent-[#1E4E70]"
                />
                I'm not a robot
              </label>

              <span className="text-[10px] text-slate-400">Verification</span>
            </div>

            <button
             onClick={()=>navigate("/examiner/dashboard")}
              type="button"
              
              disabled={!captchaChecked}
              className="w-full rounded-md bg-[#1E4E70] py-2.5 text-sm font-medium text-white transition hover:bg-[#173E59] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sign In
            </button>
          </div>

          <div className="mt-5 border-t border-slate-200 pt-4 text-center">
            <p className="text-[10px] text-slate-500">Authorized users only</p>

            <p className="mt-1 text-[9px] text-slate-400">
              N.E.T.R.A. Secure Examination Infrastructure
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
export default Login;
