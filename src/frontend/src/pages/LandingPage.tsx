import { Lock, ShieldCheck, Smartphone } from "lucide-react";
import type { Variants } from "motion/react";
import { motion } from "motion/react";

interface LandingPageProps {
  onBrowse: () => void;
  onSell: () => void;
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.1,
    },
  },
};

const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: "easeOut" },
  },
};

const logoVariant: Variants = {
  hidden: { opacity: 0, scale: 0.72 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.75, ease: "easeOut" },
  },
};

const featureVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const features = [
  {
    icon: ShieldCheck,
    label: "Verified Sellers",
    desc: "Every seller is identity-verified",
  },
  {
    icon: Lock,
    label: "Secure Payments",
    desc: "Encrypted, safe transactions",
  },
  {
    icon: Smartphone,
    label: "1000+ Listings",
    desc: "Phones from across Pakistan",
  },
];

export function LandingPage({ onBrowse, onSell }: LandingPageProps) {
  return (
    <section
      className="relative min-h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden"
      data-ocid="landing.page"
    >
      {/* Background image with rich overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/assets/generated/hero-bg.dim_1600x900.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Layered dark overlay for depth + contrast */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/75 via-black/60 to-black/85" />
      {/* Subtle radial highlight at top-center */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(250,100,10,0.18)_0%,transparent_70%)]" />

      {/* Main hero content */}
      <motion.div
        className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-10 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={logoVariant} className="mb-7">
          <div className="relative inline-block">
            {/* Glow ring behind logo */}
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-60"
              style={{
                background:
                  "radial-gradient(circle, oklch(0.62 0.21 31 / 0.7) 0%, transparent 70%)",
                transform: "scale(1.3)",
              }}
            />
            <img
              src="/assets/generated/phonebazaar-logo-transparent.dim_320x320.png"
              alt="PhoneBazaar Logo"
              data-ocid="landing.logo"
              className="relative w-44 h-44 md:w-52 md:h-52 object-contain drop-shadow-[0_0_40px_rgba(250,100,10,0.6)]"
            />
          </div>
        </motion.div>

        {/* App name */}
        <motion.h1
          variants={fadeUpVariant}
          className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.05] tracking-tight mb-5"
          style={{ textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}
        >
          Phone
          <span
            className="inline-block"
            style={{
              color: "oklch(0.72 0.21 38)",
              textShadow: "0 0 40px oklch(0.62 0.21 31 / 0.5)",
            }}
          >
            Bazaar
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          variants={fadeUpVariant}
          className="max-w-xl text-lg sm:text-xl text-white/80 mb-10 font-body leading-relaxed"
          style={{ textShadow: "0 1px 8px rgba(0,0,0,0.4)" }}
        >
          Pakistan's best marketplace to{" "}
          <span className="text-white font-semibold">buy and sell</span>{" "}
          smartphones
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={fadeUpVariant}
          className="flex flex-col sm:flex-row gap-4 items-center justify-center"
        >
          <button
            type="button"
            data-ocid="landing.browse.primary_button"
            onClick={onBrowse}
            className="group relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-lg font-display font-bold text-base text-white overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.62 0.21 31), oklch(0.68 0.24 42))",
              boxShadow:
                "0 4px 24px oklch(0.62 0.21 31 / 0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg" />
            <Smartphone className="h-4 w-4 relative z-10" />
            <span className="relative z-10">Browse Phones</span>
          </button>

          <button
            type="button"
            data-ocid="landing.sell.secondary_button"
            onClick={onSell}
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-lg font-display font-bold text-base transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1.5px solid rgba(255,255,255,0.35)",
              color: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.25)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.15)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(255,255,255,0.6)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.07)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(255,255,255,0.35)";
            }}
          >
            <span>Sell Your Phone</span>
          </button>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          variants={fadeUpVariant}
          className="mt-14 flex flex-col items-center gap-1 opacity-50"
        >
          <div className="w-px h-8 bg-gradient-to-b from-white/60 to-transparent" />
          <span className="text-white/60 text-xs uppercase tracking-widest font-body">
            scroll
          </span>
        </motion.div>
      </motion.div>

      {/* Feature highlights bar */}
      <motion.div
        className="relative z-20 w-full"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: 0.12, delayChildren: 0.85 },
          },
        }}
      >
        <div
          className="w-full border-t"
          style={{
            background: "rgba(8,8,16,0.72)",
            backdropFilter: "blur(16px)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <div className="max-w-4xl mx-auto px-6 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-0 sm:divide-x sm:divide-white/10">
            {features.map(({ icon: Icon, label, desc }) => (
              <motion.div
                key={label}
                variants={featureVariant}
                className="flex flex-col sm:items-center text-center sm:px-6 gap-1"
              >
                <div className="flex items-center gap-2.5 justify-start sm:justify-center mb-1">
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      background: "oklch(0.62 0.21 31 / 0.18)",
                      border: "1px solid oklch(0.62 0.21 31 / 0.3)",
                    }}
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{ color: "oklch(0.78 0.18 38)" }}
                    />
                  </div>
                  <span className="font-display font-bold text-white text-sm">
                    {label}
                  </span>
                </div>
                <p className="text-white/55 text-xs font-body leading-snug">
                  {desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
