import React, { useState } from "react";
import { motion } from "framer-motion";

// Single-file, production-ready login UI in React (JavaScript + TailwindCSS)
// - Accessible labels & descriptions
// - Client-side validation (email format, min password length)
// - Show/hide password toggle
// - Loading state & disabled submit until valid
// - Remember me, Forgot password, Social buttons
// - Elegant glass card + subtle animation
//
// Usage:
//   1) Ensure Tailwind is enabled in your project.
//   2) Optionally replace the fakeAuth() with a real API call.
//   3) Import and render <LoginScreen onLogin={...} onForgotPassword={...} onProviderLogin={...}/>.

const emailRegex = /^(?:[^\s@]+@[^\s@]+\.[^\s@]+)$/;

function fakeAuth({ email, password }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Demo success if password is at least 8 chars and includes a number.
      if (password.length >= 8 && /\d/.test(password)) resolve({ ok: true, email });
      else reject(new Error("Invalid credentials. Try a longer password with a number."));
    }, 1200);
  });
}

export default function LoginScreen({
  onLogin = (user) => console.log("Logged in:", user),
  onForgotPassword = () => console.log("Forgot password clicked"),
  onProviderLogin = (provider) => console.log("Provider:", provider),
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const emailValid = emailRegex.test(email);
  const pwValid = password.length >= 8;
  const formValid = emailValid && pwValid;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formValid || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fakeAuth({ email, password, remember });
      onLogin(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-tr from-indigo-500/30 via-cyan-400/30 to-emerald-400/30 blur" />
          <div className="relative rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl p-8">
            <header className="mb-8 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-white/10 grid place-items-center shadow">
                <span className="text-white text-xl font-semibold">🔐</span>
              </div>
              <h1 className="text-white text-2xl font-semibold tracking-tight">Welcome back</h1>
              <p className="text-slate-300 text-sm mt-1">Sign in to continue to your dashboard</p>
            </header>

            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-5">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-200">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-400/60"
                    aria-invalid={!emailValid && email.length > 0}
                    aria-describedby="email-help"
                  />
                  <p id="email-help" className="mt-1 text-xs text-slate-400">
                    Use a valid email like name@domain.com
                  </p>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-200">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="text-xs text-indigo-300 hover:text-indigo-200 transition"
                      aria-pressed={showPassword}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-400/60"
                    aria-invalid={!pwValid && password.length > 0}
                    aria-describedby="password-help"
                  />
                  <p id="password-help" className="mt-1 text-xs text-slate-400">
                    Minimum 8 characters. Include a number for this demo.
                  </p>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-white/30 bg-white/10 text-indigo-400 focus:ring-0"
                    />
                    <span className="text-sm text-slate-200">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onForgotPassword()}
                    className="text-sm text-indigo-300 hover:text-indigo-200 transition"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200 text-sm"
                  >
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!formValid || submitting}
                  className="w-full rounded-xl bg-indigo-500/90 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 shadow-lg shadow-indigo-900/30 transition"
                >
                  {submitting ? "Signing in…" : "Sign in"}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs text-slate-400">or continue with</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* Social */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => onProviderLogin("google")}
                    className="rounded-xl border border-white/20 bg-white/10 py-2.5 text-slate-200 hover:bg-white/15 transition"
                  >
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => onProviderLogin("github")}
                    className="rounded-xl border border-white/20 bg-white/10 py-2.5 text-slate-200 hover:bg-white/15 transition"
                  >
                    GitHub
                  </button>
                  <button
                    type="button"
                    onClick={() => onProviderLogin("microsoft")}
                    className="rounded-xl border border-white/20 bg-white/10 py-2.5 text-slate-200 hover:bg-white/15 transition"
                  >
                    Microsoft
                  </button>
                </div>
              </div>
            </form>

            {/* Footer */}
            <p className="mt-8 text-center text-xs text-slate-400">
              By signing in, you agree to our <a href="#" className="underline hover:text-slate-300">Terms</a> &
              <a href="#" className="underline hover:text-slate-300"> Privacy Policy</a>.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
