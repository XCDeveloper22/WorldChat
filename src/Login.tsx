import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, Loader2, MessageCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [demoCodeMsg, setDemoCodeMsg] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setDemoCodeMsg(`Demo Code: ${data.demoCode}`);
      setStep("code");
    } catch (err: any) {
      setError(err.message || "Failed to send code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user_data", JSON.stringify(data.user));
      navigate("/chat");
    } catch (err: any) {
      setError(err.message || "Invalid code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-zinc-950 p-6 text-zinc-50 font-sans">
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              <p className="text-sm font-medium tracking-wide text-zinc-400">Signing you in...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm space-y-8"
      >
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-950">
            <MessageCircle size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight text-white">Join World Chat</h2>
            <p className="text-sm text-zinc-400">Connect with anyone, anywhere.</p>
          </div>
        </div>

        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50 shadow-xl">
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20 text-center">
              {error}
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-zinc-500 tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl bg-zinc-950/50 border border-zinc-800 py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3 text-sm font-semibold text-zinc-900 hover:bg-white active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Send Login Code <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-zinc-500 tracking-wider">Verification Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                  className="w-full rounded-xl bg-zinc-950/50 border border-zinc-800 py-3 px-4 text-center text-lg tracking-widest text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-colors"
                />
                {demoCodeMsg && <p className="text-xs text-green-400 text-center mt-2">{demoCodeMsg}</p>}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-xl bg-zinc-100 py-3 text-sm font-semibold text-zinc-900 hover:bg-white active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Verify & Join
              </button>
              <button
                type="button"
                onClick={() => setStep("email")}
                className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 pt-2"
              >
                Use a different email
              </button>
            </form>
          )}

          {step === "email" && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-zinc-900 px-2 text-zinc-500">OR CONTINUE WITH</span>
                </div>
              </div>

              <div className="flex justify-center w-full mt-4">
                <button
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      const res = await fetch("/api/auth/vercel-start", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" }
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || "Failed to start auth");
                      
                      // Redirect to the Vercel connection URL
                      window.location.href = data.url;
                    } catch (err: any) {
                      setError("Google Login (via Vercel) Failed: " + err.message);
                      setIsLoading(false);
                    }
                  }}
                  className="gsi-material-button w-full relative h-10 flex items-center justify-center bg-white text-zinc-950 font-medium rounded-xl hover:bg-zinc-100 transition-colors"
                >
                  <div className="absolute left-4">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span>Sign in with Google</span>
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
