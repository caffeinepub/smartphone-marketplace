import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  KeyRound,
  LineChart as LineChartIcon,
  Loader2,
  Lock,
  MessageSquare,
  Package,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type {
  AdminStats,
  AnalyticsData,
  Listing,
  SellerSummary,
} from "../backend.d.ts";
import { useActor } from "../hooks/useActor";

const SESSION_KEY = "adminPinVerified";

function formatDate(ns: bigint): string {
  const ms = Number(ns / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function truncatePrincipal(principal: { toString(): string }): string {
  const str = principal.toString();
  if (str.length <= 14) return str;
  return `${str.slice(0, 6)}\u2026${str.slice(-6)}`;
}

function formatPrice(price: bigint): string {
  const num = Math.round(Number(price) / 100);
  return `\u20a8${num.toLocaleString("en-PK")}`;
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon: Icon,
  ocid,
  highlight,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  ocid: string;
  highlight?: boolean;
}) {
  return (
    <Card
      data-ocid={ocid}
      className={`relative overflow-hidden transition-shadow hover:shadow-md ${highlight ? "border-primary/40" : ""}`}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon
          className={`h-4 w-4 ${highlight ? "text-primary" : "text-muted-foreground"}`}
        />
      </CardHeader>
      <CardContent>
        <p
          className={`text-3xl font-bold font-display ${
            highlight ? "text-primary" : "text-card-foreground"
          }`}
        >
          {value}
        </p>
      </CardContent>
      {highlight && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/40 rounded-full" />
      )}
    </Card>
  );
}

// ── PIN Input (6 boxes) ────────────────────────────────────────────────────────
function PinBoxes({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(idx: number, char: string) {
    const digit = char.replace(/\D/g, "").slice(-1);
    const newVal = `${value.slice(0, idx)}${digit}${value.slice(idx + 1)}`;
    const clamped = newVal.slice(0, 6);
    onChange(clamped);
    if (digit && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  }

  function handleKeyDown(
    idx: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (e.key === "Backspace") {
      if (value[idx]) {
        const newVal = `${value.slice(0, idx)}${value.slice(idx + 1)}`;
        onChange(newVal);
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
        const newVal = `${value.slice(0, idx - 1)}${value.slice(idx)}`;
        onChange(newVal);
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    onChange(pasted.padEnd(6, "").slice(0, 6));
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    e.preventDefault();
  }

  return (
    <div className="flex gap-2 justify-center">
      {[0, 1, 2, 3, 4, 5].map((idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputRefs.current[idx] = el;
          }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] || ""}
          disabled={disabled}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className="w-11 h-12 text-center text-xl font-bold rounded-lg border-2 bg-background text-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-50 caret-transparent"
          style={{
            borderColor: value[idx] ? "hsl(var(--primary))" : undefined,
          }}
        />
      ))}
    </div>
  );
}

// ── Set PIN Screen ────────────────────────────────────────────────────────────
function SetPinScreen({ onPinSet }: { onPinSet: () => void }) {
  const { actor } = useActor();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSetPin() {
    if (pin.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match. Try again.");
      return;
    }
    if (!actor) return;
    setIsSubmitting(true);
    setError("");
    try {
      await actor.setAdminPin(pin);
      sessionStorage.setItem(SESSION_KEY, "true");
      toast.success("Admin PIN set successfully");
      onPinSet();
    } catch {
      setError("Failed to set PIN. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div
      data-ocid="admin.pin.set.panel"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-[70vh] flex items-center justify-center px-4"
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 ring-1 ring-primary/20">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-display mb-2">
            Create Admin PIN
          </h1>
          <p className="text-sm text-muted-foreground">
            Set a 6-digit PIN to secure your admin dashboard. You&apos;ll need
            it each session.
          </p>
        </div>

        <Card className="border-border/60 shadow-lg">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground text-center uppercase tracking-widest">
                New PIN
              </p>
              <PinBoxes value={pin} onChange={setPin} disabled={isSubmitting} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground text-center uppercase tracking-widest">
                Confirm PIN
              </p>
              <PinBoxes
                value={confirmPin}
                onChange={setConfirmPin}
                disabled={isSubmitting}
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive text-center font-medium"
                  data-ocid="admin.pin.error_state"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <Button
              data-ocid="admin.pin.set.submit_button"
              className="w-full"
              onClick={handleSetPin}
              disabled={isSubmitting || pin.length < 6 || confirmPin.length < 6}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? "Setting PIN..." : "Set PIN & Enter Dashboard"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

// ── Verify PIN Screen ─────────────────────────────────────────────────────────
function VerifyPinScreen({ onVerified }: { onVerified: () => void }) {
  const { actor } = useActor();
  const [pin, setPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const handleVerify = useCallback(
    async (pinValue: string) => {
      if (pinValue.length !== 6) return;
      if (!actor) return;
      setIsVerifying(true);
      setError("");
      try {
        const ok = await actor.verifyAdminPin(pinValue);
        if (ok) {
          sessionStorage.setItem(SESSION_KEY, "true");
          onVerified();
        } else {
          setPin("");
          setError("Incorrect PIN. Please try again.");
          setShake(true);
          setTimeout(() => setShake(false), 600);
        }
      } catch {
        setError("Verification failed. Please try again.");
      } finally {
        setIsVerifying(false);
      }
    },
    [actor, onVerified],
  );

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (pin.length === 6 && !isVerifying) {
      handleVerify(pin);
    }
  }, [pin, isVerifying, handleVerify]);

  return (
    <motion.div
      data-ocid="admin.pin.verify.panel"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-[70vh] flex items-center justify-center px-4"
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4 ring-1 ring-primary/20">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold font-display mb-2">Admin Access</h1>
          <p className="text-sm text-muted-foreground">
            Enter your 6-digit PIN to access the dashboard.
          </p>
        </div>

        <Card className="border-border/60 shadow-lg">
          <CardContent className="pt-6 space-y-6">
            <motion.div
              animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <PinBoxes value={pin} onChange={setPin} disabled={isVerifying} />
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-destructive text-center font-medium"
                  data-ocid="admin.pin.error_state"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <Button
              data-ocid="admin.pin.verify.submit_button"
              className="w-full"
              onClick={() => handleVerify(pin)}
              disabled={isVerifying || pin.length < 6}
            >
              {isVerifying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4 mr-2" />
              )}
              {isVerifying ? "Verifying..." : "Unlock Dashboard"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────
function AnalyticsTab({ stats }: { stats: AdminStats }) {
  const { actor } = useActor();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!actor) return;
    setIsLoading(true);
    actor
      .getAnalytics()
      .then((data) => {
        setAnalytics(data);
        setIsLoading(false);
      })
      .catch(() => {
        setError("Failed to load analytics data.");
        setIsLoading(false);
      });
  }, [actor]);

  const soldRate =
    stats.totalListings > 0n
      ? Math.round(
          (Number(stats.soldListings) / Number(stats.totalListings)) * 100,
        )
      : 0;

  const totalMessages = analytics ? Number(analytics.totalMessages) : 0;

  const listingsChartData = analytics
    ? analytics.dailyListings
        .slice(-30)
        .map(([date, count]) => ({ date, count: Number(count) }))
    : [];

  const messagesChartData = analytics
    ? analytics.dailyMessages
        .slice(-30)
        .map(([date, count]) => ({ date, count: Number(count) }))
    : [];

  const listingsChartConfig = {
    count: { label: "Listings", color: "hsl(var(--primary))" },
  };

  const messagesChartConfig = {
    count: { label: "Messages", color: "hsl(var(--chart-2))" },
  };

  if (isLoading) {
    return (
      <div data-ocid="admin.analytics.loading_state" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-ocid="admin.analytics.error_state"
        className="text-center py-12 text-muted-foreground"
      >
        <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-destructive" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div data-ocid="admin.analytics.panel" className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Messages
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-display text-card-foreground">
              {totalMessages.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sold Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold font-display text-primary">
              {soldRate}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Listings line chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold font-display flex items-center gap-2">
            <LineChartIcon className="h-4 w-4 text-primary" />
            Listings Over Last 30 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          {listingsChartData.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No listing activity yet.
            </div>
          ) : (
            <ChartContainer
              config={listingsChartConfig}
              className="h-56 w-full"
            >
              <LineChart data={listingsChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/40"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Messages bar chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold font-display flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-chart-2" />
            Messages Over Last 30 Days
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messagesChartData.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No message activity yet.
            </div>
          ) : (
            <ChartContainer
              config={messagesChartConfig}
              className="h-56 w-full"
            >
              <BarChart data={messagesChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border/40"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="hsl(var(--chart-2))"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function AdminDashboardPage() {
  const { actor, isFetching: actorFetching } = useActor();

  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // PIN state
  type PinState = "checking" | "set-pin" | "verify-pin" | "verified";
  const [pinState, setPinState] = useState<PinState>("checking");

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [sellers, setSellers] = useState<SellerSummary[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Check admin status
  useEffect(() => {
    if (!actor || actorFetching) return;

    async function checkAdmin() {
      if (!actor) return;
      try {
        await actor.initAdmin();
        const result = await actor.isAdmin();
        setIsAdmin(result);
      } catch {
        setIsAdmin(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    }

    checkAdmin();
  }, [actor, actorFetching]);

  // Check PIN state once admin confirmed
  useEffect(() => {
    if (!actor || !isAdmin) return;

    // Already verified this session
    if (sessionStorage.getItem(SESSION_KEY) === "true") {
      setPinState("verified");
      return;
    }

    actor
      .isPinSet()
      .then((pinSet) => {
        setPinState(pinSet ? "verify-pin" : "set-pin");
      })
      .catch(() => {
        setPinState("set-pin");
      });
  }, [actor, isAdmin]);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    if (!actor || !isAdmin) return;
    setIsLoadingData(true);
    setLoadError(null);
    try {
      const [fetchedStats, fetchedListings, fetchedSellers] = await Promise.all(
        [
          actor.getAdminStats(),
          actor.getAllListingsAdmin(),
          actor.getSellerSummaries(),
        ],
      );
      setStats(fetchedStats);
      setListings(fetchedListings);
      setSellers(fetchedSellers);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoadingData(false);
    }
  }, [actor, isAdmin]);

  useEffect(() => {
    if (pinState === "verified") {
      fetchData();
    }
  }, [pinState, fetchData]);

  // Delete a listing
  async function handleDelete(id: string) {
    if (!actor) return;
    setDeletingId(id);
    try {
      await actor.adminDeleteListing(id);
      toast.success("Listing deleted successfully");
      await fetchData();
    } catch {
      toast.error("Failed to delete listing");
    } finally {
      setDeletingId(null);
    }
  }

  // ── Loading: checking admin ──
  if (actorFetching || isCheckingAdmin) {
    return (
      <div
        data-ocid="admin.loading_state"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6"
      >
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  // ── Access denied ──
  if (isAdmin === false) {
    return (
      <div
        data-ocid="admin.access_denied.panel"
        className="max-w-lg mx-auto px-4 py-20 text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-5">
          <ShieldAlert className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold font-display mb-2">Access Denied</h1>
        <p className="text-muted-foreground">
          You don&apos;t have admin privileges to view this page. Only the
          designated admin account can access this dashboard.
        </p>
      </div>
    );
  }

  // ── PIN screens ──
  if (isAdmin && pinState === "set-pin") {
    return <SetPinScreen onPinSet={() => setPinState("verified")} />;
  }

  if (isAdmin && pinState === "verify-pin") {
    return <VerifyPinScreen onVerified={() => setPinState("verified")} />;
  }

  // ── Error ──
  if (loadError) {
    return (
      <div
        data-ocid="admin.error_state"
        className="max-w-lg mx-auto px-4 py-20 text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mb-5">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold font-display mb-2">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mb-6">{loadError}</p>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  // ── Loading: data ──
  if (isLoadingData || !stats) {
    return (
      <div
        data-ocid="admin.loading_state"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6"
      >
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  // Sort brand breakdown by count descending
  const sortedBrands = [...stats.brandBreakdown].sort(
    ([, a], [, b]) => Number(b) - Number(a),
  );

  // Sort listings by date descending
  const sortedListings = [...listings].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt),
  );

  // Sort sellers by total listings descending
  const sortedSellers = [...sellers].sort(
    (a, b) => Number(b.totalListings) - Number(a.totalListings),
  );

  return (
    <div
      data-ocid="admin.dashboard.page"
      className="max-w-6xl mx-auto px-4 sm:px-6 py-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3 mb-8"
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display leading-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            PhoneBazaar platform overview
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={fetchData}
          disabled={isLoadingData}
        >
          {isLoadingData ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Activity className="h-3.5 w-3.5 mr-1.5" />
          )}
          Refresh
        </Button>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
      >
        <StatCard
          title="Total Listings"
          value={stats.totalListings.toString()}
          icon={Package}
          ocid="admin.stat.total_listings.card"
          highlight
        />
        <StatCard
          title="Active Listings"
          value={stats.activeListings.toString()}
          icon={ShoppingBag}
          ocid="admin.stat.active_listings.card"
        />
        <StatCard
          title="Sold"
          value={stats.soldListings.toString()}
          icon={CheckCircle2}
          ocid="admin.stat.sold_listings.card"
        />
        <StatCard
          title="Unique Sellers"
          value={stats.uniqueSellers.toString()}
          icon={Users}
          ocid="admin.stat.unique_sellers.card"
        />
      </motion.div>

      {/* Brand Breakdown + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Brand Breakdown */}
        <motion.div
          data-ocid="admin.brand.table"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold font-display flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Brand Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedBrands.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No brand data
                </p>
              ) : (
                <div className="space-y-2">
                  {sortedBrands.map(([brand, count], idx) => {
                    const total = Number(stats.totalListings) || 1;
                    const pct = Math.round((Number(count) / total) * 100);
                    return (
                      <div key={brand} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-card-foreground truncate">
                            {idx + 1}. {brand}
                          </span>
                          <span className="text-muted-foreground ml-2 flex-shrink-0">
                            {count.toString()}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Summary panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold font-display flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Platform Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {[
                {
                  label: "Sell-Through Rate",
                  value:
                    stats.totalListings > 0n
                      ? `${Math.round(
                          (Number(stats.soldListings) /
                            Number(stats.totalListings)) *
                            100,
                        )}%`
                      : "\u2014",
                  sub: "sold vs total",
                },
                {
                  label: "Avg. Listings / Seller",
                  value:
                    stats.uniqueSellers > 0n
                      ? (
                          Number(stats.totalListings) /
                          Number(stats.uniqueSellers)
                        ).toFixed(1)
                      : "\u2014",
                  sub: "per unique seller",
                },
                {
                  label: "Active",
                  value: stats.activeListings.toString(),
                  sub: "currently for sale",
                },
                {
                  label: "Brands Listed",
                  value: stats.brandBreakdown.length.toString(),
                  sub: "distinct brands",
                },
              ].map(({ label, value, sub }) => (
                <div
                  key={label}
                  className="rounded-xl bg-muted/50 px-4 py-3 border border-border"
                >
                  <p className="text-xs text-muted-foreground mb-0.5">{sub}</p>
                  <p className="text-2xl font-bold font-display text-card-foreground">
                    {value}
                  </p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {label}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Tabs defaultValue="listings">
          <TabsList className="mb-4">
            <TabsTrigger value="listings" data-ocid="admin.listings.tab">
              <Package className="h-3.5 w-3.5 mr-1.5" />
              Listings
              <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                {sortedListings.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="sellers" data-ocid="admin.sellers.tab">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Sellers
              <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                {sortedSellers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="analytics" data-ocid="admin.analytics.tab">
              <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* ── Listings Tab ── */}
          <TabsContent value="listings">
            <Card data-ocid="admin.listings.table">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold font-display flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  All Listings
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {sortedListings.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {sortedListings.length === 0 ? (
                  <div
                    data-ocid="admin.listings.empty_state"
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    No listings yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="pl-6 text-xs font-semibold">
                            Title
                          </TableHead>
                          <TableHead className="text-xs font-semibold">
                            Brand
                          </TableHead>
                          <TableHead className="text-xs font-semibold hidden md:table-cell">
                            Condition
                          </TableHead>
                          <TableHead className="text-xs font-semibold">
                            Price
                          </TableHead>
                          <TableHead className="text-xs font-semibold">
                            Status
                          </TableHead>
                          <TableHead className="text-xs font-semibold hidden lg:table-cell">
                            Seller
                          </TableHead>
                          <TableHead className="text-xs font-semibold hidden sm:table-cell">
                            Date
                          </TableHead>
                          <TableHead className="pr-6 text-right text-xs font-semibold">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedListings.map((listing, idx) => (
                          <AdminListingRow
                            key={listing.id}
                            listing={listing}
                            index={idx + 1}
                            isDeleting={deletingId === listing.id}
                            onDelete={() => handleDelete(listing.id)}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Sellers Tab ── */}
          <TabsContent value="sellers">
            <Card data-ocid="admin.sellers.table">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold font-display flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  All Sellers
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {sortedSellers.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {sortedSellers.length === 0 ? (
                  <div
                    data-ocid="admin.sellers.empty_state"
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    No sellers yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="pl-6 text-xs font-semibold w-10">
                            #
                          </TableHead>
                          <TableHead className="text-xs font-semibold">
                            Seller
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-center">
                            Total
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-center hidden sm:table-cell">
                            Active
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-center hidden sm:table-cell">
                            Sold
                          </TableHead>
                          <TableHead className="text-xs font-semibold pr-6 text-right">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedSellers.map((seller, idx) => (
                          <AdminSellerRow
                            key={seller.seller.toString()}
                            sellerSummary={seller}
                            index={idx + 1}
                            onDeleted={fetchData}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Analytics Tab ── */}
          <TabsContent value="analytics">
            <AnalyticsTab stats={stats} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

// ── Admin Listing Row ──────────────────────────────────────────────────────────
function AdminListingRow({
  listing,
  index,
  isDeleting,
  onDelete,
}: {
  listing: Listing;
  index: number;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <TableRow
      data-ocid={`admin.listing.item.${index}`}
      className="group hover:bg-muted/30 transition-colors"
    >
      <TableCell className="pl-6 font-medium text-sm max-w-[200px]">
        <span className="truncate block" title={listing.title}>
          {listing.title}
        </span>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {listing.brand}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
        {listing.condition}
      </TableCell>
      <TableCell className="text-sm font-semibold text-primary">
        {formatPrice(listing.price)}
      </TableCell>
      <TableCell>
        {listing.sold ? (
          <Badge
            variant="secondary"
            className="text-xs font-medium bg-muted text-muted-foreground"
          >
            Sold
          </Badge>
        ) : (
          <Badge className="text-xs font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
            Active
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground hidden lg:table-cell font-mono">
        {truncatePrincipal(listing.seller)}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
        {formatDate(listing.createdAt)}
      </TableCell>
      <TableCell className="pr-6 text-right">
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              data-ocid={`admin.listing.delete_button.${index}`}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label={`Delete ${listing.title}`}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent data-ocid="admin.delete.dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Listing</AlertDialogTitle>
              <AlertDialogDescription>
                Permanently delete &ldquo;{listing.title}&rdquo;? This action
                cannot be undone and will remove the listing for all users.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-ocid="admin.delete.cancel_button">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                data-ocid="admin.delete.confirm_button"
                disabled={isDeleting}
                onClick={() => {
                  setDialogOpen(false);
                  onDelete();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : null}
                Delete Listing
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}

// ── Admin Seller Row ───────────────────────────────────────────────────────────
function AdminSellerRow({
  sellerSummary,
  index,
  onDeleted,
}: {
  sellerSummary: SellerSummary;
  index: number;
  onDeleted: () => void;
}) {
  const { actor } = useActor();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleRemoveAll() {
    if (!actor) return;
    setIsRemoving(true);
    try {
      await actor.adminDeleteAllListingsBySeller(sellerSummary.seller);
      toast.success("All listings by this seller have been removed");
      setDialogOpen(false);
      onDeleted();
    } catch {
      toast.error("Failed to remove seller listings");
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <TableRow
      data-ocid={`admin.seller.item.${index}`}
      className="group hover:bg-muted/30 transition-colors"
    >
      <TableCell className="pl-6 text-sm text-muted-foreground w-10">
        {index}
      </TableCell>
      <TableCell className="text-xs font-mono text-card-foreground">
        <span title={sellerSummary.seller.toString()}>
          {truncatePrincipal(sellerSummary.seller)}
        </span>
      </TableCell>
      <TableCell className="text-sm font-semibold text-center text-card-foreground">
        {sellerSummary.totalListings.toString()}
      </TableCell>
      <TableCell className="text-sm text-center text-muted-foreground hidden sm:table-cell">
        {sellerSummary.activeListings.toString()}
      </TableCell>
      <TableCell className="text-sm text-center text-muted-foreground hidden sm:table-cell">
        {sellerSummary.soldListings.toString()}
      </TableCell>
      <TableCell className="pr-6 text-right">
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              data-ocid={`admin.seller.delete_button.${index}`}
              className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Remove All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent data-ocid="admin.seller.delete.dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove All Listings</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all listings by{" "}
                <span className="font-mono text-xs">
                  {truncatePrincipal(sellerSummary.seller)}
                </span>
                . This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-ocid="admin.seller.delete.cancel_button">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                data-ocid="admin.seller.delete.confirm_button"
                disabled={isRemoving}
                onClick={handleRemoveAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isRemoving ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : null}
                Remove All Listings
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}
