import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import BASE_URL from "../api/api";
import { useTheme } from "../context/ThemeContext";
import { Home, Moon, Sun, ShieldCheck } from "lucide-react";
import { AlertTriangle } from "lucide-react";

function Login() {
  const [data, setData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) { setError(result.message || "Login failed"); setLoading(false); return; }
      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));
      navigate(result.user.role === "admin" ? "/dashboard" : "/my-dashboard");
    } catch {
      setError("Unable to connect to the server.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#080810] dark:bg-[#080810] flex items-center justify-center relative overflow-hidden px-4">

      {/* Dot Matrix Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: theme === "dark"
            ? "radial-gradient(circle, #ffffff10 1px, transparent 1px)"
            : "radial-gradient(circle, #00000010 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Animated Blobs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-violet-600/20 blur-3xl"
        style={{ top: "10%", left: "10%" }}
        animate={{ x: [0, 30, -20, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-80 h-80 rounded-full bg-indigo-600/20 blur-3xl"
        style={{ bottom: "10%", right: "10%" }}
        animate={{ x: [0, -20, 30, 0], y: [0, 20, -30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        <Moon className="w-4 h-4 text-zinc-400" />
        <Switch checked={theme === "light"} onCheckedChange={toggleTheme} />
        <Sun className="w-4 h-4 text-zinc-400" />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="bg-white dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-violet-500/20 rounded-3xl p-9 shadow-xl dark:shadow-[0_0_60px_rgba(124,58,237,0.1)]">

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 bg-violet-100 dark:bg-violet-500/15 border border-violet-200 dark:border-violet-500/30 rounded-full px-3.5 py-1.5 text-xs text-violet-700 dark:text-violet-300 w-fit mb-5"
          >

            <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
            Secure Admin Access
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-500/20 border border-violet-200 dark:border-violet-500/30 flex items-center justify-center mb-4"
          >
            <Home className="w-6 h-6 text-violet-600 dark:text-violet-300" />
          </motion.div>

          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">Rent Manager</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-5">Sign in to your admin panel</p>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase text-zinc-500 tracking-wide font-semibold">Email Address</Label>
              <Input
                type="email"
                placeholder="Enter your Email"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                className="bg-zinc-50 dark:bg-white/[0.04] border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 h-11 rounded-xl focus-visible:ring-violet-500 focus-visible:border-violet-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase text-zinc-500 tracking-wide font-semibold">Password</Label>
              <Input
                type="password"
                placeholder="Enter your Password"
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                className="bg-zinc-50 dark:bg-white/[0.04] border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 h-11 rounded-xl focus-visible:ring-violet-500 focus-visible:border-violet-500"
              />
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-[0_4px_20px_rgba(124,58,237,0.4)]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : "Sign In →"}
              </Button>
            </motion.div>
          </form>

          <p className="text-center text-sm text-zinc-500 mt-5">
            New user?{" "}
            <span
              onClick={() => navigate("/signup")}
              className="text-violet-600 dark:text-violet-400  font-semibold underline underline-offset-2 cursor-pointer hover:text-violet-300"
            >
              Create account
            </span>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}

export default Login;