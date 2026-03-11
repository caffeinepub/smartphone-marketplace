import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft, Loader2, Lock, Shield } from "lucide-react";
import type { Variants } from "motion/react";
import { motion } from "motion/react";
import { SiFacebook, SiGoogle } from "react-icons/si";

interface SignInPageProps {
  onLogin: () => void;
  isLoggingIn: boolean;
  onBack: () => void;
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

const logoVariant: Variants = {
  hidden: { opacity: 0, scale: 0.78 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.65, ease: "easeOut" },
  },
};

export function SignInPage({ onLogin, isLoggingIn, onBack }: SignInPageProps) {
  return (
    <TooltipProvider>
      <section
        className="relative min-h-[calc(100vh-3.5rem)] flex items-center justify-center overflow-hidden"
        data-ocid="signin.page"
      >
        {/* Background hero image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage:
              "url('/assets/generated/hero-bg.dim_1600x900.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-black/80 via-black/70 to-black/85" />
        {/* Orange radial highlight */}
        <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_55%_50%_at_50%_50%,rgba(250,100,10,0.12)_0%,transparent_70%)]" />

        {/* Card */}
        <motion.div
          className="relative z-20 w-full max-w-md mx-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(10, 10, 18, 0.82)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow:
                "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            {/* Top accent bar */}
            <div
              className="h-1 w-full"
              style={{
                background:
                  "linear-gradient(90deg, oklch(0.62 0.21 31), oklch(0.72 0.24 45), oklch(0.62 0.21 31))",
              }}
            />

            <div className="px-8 pt-8 pb-10 flex flex-col items-center gap-0">
              {/* Logo */}
              <motion.div variants={logoVariant} className="mb-5">
                <div className="relative inline-block">
                  <div
                    className="absolute inset-0 rounded-full blur-2xl opacity-50"
                    style={{
                      background:
                        "radial-gradient(circle, oklch(0.62 0.21 31 / 0.6) 0%, transparent 70%)",
                      transform: "scale(1.4)",
                    }}
                  />
                  <img
                    src="/assets/uploads/logo-transparent-1.png"
                    alt="PhoneBazaar"
                    data-ocid="signin.logo"
                    className="relative object-contain drop-shadow-[0_0_30px_rgba(250,100,10,0.5)]"
                    style={{ height: "120px", width: "auto" }}
                  />
                </div>
              </motion.div>

              {/* App name */}
              <motion.h1
                variants={fadeUpVariant}
                className="font-display font-black text-3xl text-white tracking-tight mb-1"
                style={{ textShadow: "0 2px 16px rgba(0,0,0,0.5)" }}
              >
                Phone
                <span style={{ color: "oklch(0.72 0.21 38)" }}>Bazaar</span>
              </motion.h1>

              {/* Tagline */}
              <motion.p
                variants={fadeUpVariant}
                className="text-sm font-body mb-8"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Pakistan's #1 Phone Marketplace
              </motion.p>

              {/* Internet Identity sign in button */}
              <motion.div variants={fadeUpVariant} className="w-full">
                <button
                  type="button"
                  data-ocid="signin.ii_button"
                  onClick={onLogin}
                  disabled={isLoggingIn}
                  className="group relative w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-display font-bold text-base text-white overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
                  style={{
                    background: isLoggingIn
                      ? "linear-gradient(135deg, oklch(0.55 0.19 31), oklch(0.60 0.22 42))"
                      : "linear-gradient(135deg, oklch(0.62 0.21 31), oklch(0.68 0.24 42))",
                    boxShadow:
                      "0 4px 24px oklch(0.62 0.21 31 / 0.35), inset 0 1px 0 rgba(255,255,255,0.18)",
                  }}
                >
                  <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
                  {isLoggingIn ? (
                    <Loader2 className="h-4 w-4 animate-spin relative z-10 shrink-0" />
                  ) : (
                    <Shield className="h-4 w-4 relative z-10 shrink-0" />
                  )}
                  <span className="relative z-10">
                    {isLoggingIn
                      ? "Signing in…"
                      : "Sign in with Internet Identity"}
                  </span>
                </button>
              </motion.div>

              {/* Trust hint */}
              <motion.div
                variants={fadeUpVariant}
                className="flex items-center gap-1.5 mt-2.5 mb-6"
              >
                <Lock
                  className="h-3 w-3"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                />
                <p
                  className="text-xs font-body"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  Secure & decentralized sign-in — no passwords needed
                </p>
              </motion.div>

              {/* Divider */}
              <motion.div
                variants={fadeUpVariant}
                className="flex items-center gap-3 w-full mb-6"
              >
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                />
                <span
                  className="text-xs font-body font-semibold px-1"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  OR
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                />
              </motion.div>

              {/* Social buttons (disabled, coming soon) */}
              <motion.div
                variants={fadeUpVariant}
                className="flex flex-col gap-3 w-full"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      data-ocid="signin.google_button"
                      disabled
                      aria-disabled="true"
                      className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-body font-medium text-sm cursor-not-allowed opacity-40 transition-all"
                      style={{
                        background: "rgba(255,255,255,0.92)",
                        color: "#3c4043",
                        border: "1px solid rgba(255,255,255,0.2)",
                      }}
                    >
                      <SiGoogle
                        className="h-4 w-4 shrink-0"
                        style={{ color: "#4285F4" }}
                      />
                      Continue with Google
                      <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        Soon
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Google sign-in is not yet available on this platform</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      data-ocid="signin.facebook_button"
                      disabled
                      aria-disabled="true"
                      className="w-full inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-body font-medium text-sm cursor-not-allowed opacity-40 transition-all"
                      style={{
                        background: "#1877F2",
                        color: "#ffffff",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <SiFacebook className="h-4 w-4 shrink-0" />
                      Continue with Facebook
                      <span
                        className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(255,255,255,0.2)",
                          color: "rgba(255,255,255,0.8)",
                        }}
                      >
                        Soon
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>
                      Facebook sign-in is not yet available on this platform
                    </p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>

              {/* Back link */}
              <motion.div variants={fadeUpVariant} className="mt-8">
                <button
                  type="button"
                  data-ocid="signin.back.link"
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 text-sm font-body transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "rgba(255,255,255,0.75)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "rgba(255,255,255,0.4)";
                  }}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Home
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>
    </TooltipProvider>
  );
}
