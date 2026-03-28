import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { useSendOtp, useVerifyOtp } from "@/hooks/use-auth";

const LoginPage = () => {
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const fullPhone = `+91${phone}`;

  const handleSendOtp = async () => {
    if (phone.length < 10) return;
    setError("");
    try {
      await sendOtp.mutateAsync({ phoneNumber: fullPhone });
      setOtpSent(true);
      setCountdown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to send OTP. Please try again.";
      setError(msg);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    try {
      await sendOtp.mutateAsync({ phoneNumber: fullPhone });
      setCountdown(30);
    } catch {
      setError("Failed to resend OTP.");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    setError("");
    try {
      await verifyOtp.mutateAsync({
        phoneNumber: fullPhone,
        otp: otp.join(""),
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Invalid OTP. Please try again.";
      setError(msg);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !otpSent && phone.length >= 10) {
      handleSendOtp();
    }
  };

  const handleOtpEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && otp.every((d) => d)) {
      handleVerify();
    }
  };

  const isLoading = sendOtp.isPending || verifyOtp.isPending;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background p-4 font-sans text-foreground">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.08),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(var(--accent)/0.06),_transparent_50%)]" />
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22currentColor%22%20fill-opacity%3D%221%22%3E%3Ccircle%20cx%3D%221%22%20cy%3D%221%22%20r%3D%221%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />

      {/* Theme Toggle */}
      <div className="absolute right-4 top-4 z-20 md:right-8 md:top-8">
        <ThemeToggle />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-[440px]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Logo & Branding */}
        <div className="mb-8 text-center">
          <motion.div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
          >
            <ShieldCheck className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">EdVa Super Admin</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Platform management console</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-border bg-card p-7 shadow-2xl shadow-black/5 dark:shadow-black/20">
          {/* Access badge */}
          <div className="mb-6 flex items-center gap-2.5 rounded-lg border border-warning/25 bg-warning/5 px-3.5 py-2.5">
            <Lock className="h-4 w-4 flex-shrink-0 text-warning" />
            <span className="text-xs font-medium text-warning dark:text-warning/90">
              Restricted access — Authorized administrators only
            </span>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3.5 py-2.5"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
              <span className="text-xs font-medium text-destructive">{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Phone Number
              </label>
              <div className="flex items-center gap-2">
                <div className="flex h-11 items-center rounded-lg border border-border bg-secondary px-3 text-sm font-medium text-muted-foreground">
                  +91
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter registered mobile"
                  disabled={isLoading}
                  className="h-11 flex-1 rounded-lg border border-border bg-secondary px-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15 disabled:opacity-50"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!otpSent ? (
                <motion.div key="send" initial={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }}>
                  <Button
                    className="h-11 w-full font-semibold transition-all"
                    onClick={handleSendOtp}
                    disabled={phone.length < 10 || isLoading}
                  >
                    {sendOtp.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Send Verification Code
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Verification Code
                    </label>
                    <div className="flex justify-between gap-2">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => {
                            otpRefs.current[i] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => {
                            handleOtpKeyDown(i, e);
                            handleOtpEnter(e);
                          }}
                          disabled={isLoading}
                          className="aspect-square w-full max-w-[52px] rounded-lg border border-border bg-secondary text-center text-xl font-bold text-foreground outline-none transition-all focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/15 disabled:opacity-50"
                        />
                      ))}
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Sent to +91 {phone}</span>
                      {countdown > 0 ? (
                        <span className="text-xs text-muted-foreground">Resend in {countdown}s</span>
                      ) : (
                        <button
                          onClick={handleResendOtp}
                          disabled={sendOtp.isPending}
                          className="text-xs font-semibold text-primary transition-colors hover:text-primary/80 disabled:opacity-50"
                        >
                          Resend Code
                        </button>
                      )}
                    </div>
                  </div>

                  <Button
                    className="h-11 w-full font-bold shadow-lg shadow-primary/15 transition-all"
                    onClick={handleVerify}
                    disabled={otp.some((d) => !d) || isLoading}
                  >
                    {verifyOtp.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & Sign In"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-border pt-5">
            <Lock className="h-3 w-3 text-muted-foreground/50" />
            <span className="text-[11px] text-muted-foreground/70">Encrypted connection — Session monitored</span>
          </div>
        </div>

        {/* Bottom text */}
        <p className="mt-6 text-center text-[11px] text-muted-foreground/50">
          EdVa Platform &copy; {new Date().getFullYear()} — Education Plus Advancement
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
