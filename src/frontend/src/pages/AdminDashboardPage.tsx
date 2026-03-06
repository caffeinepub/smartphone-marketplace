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
  Loader2,
  Package,
  ShieldAlert,
  ShoppingBag,
  Trash2,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { AdminStats, Listing, SellerSummary } from "../backend.d.ts";
import { useActor } from "../hooks/useActor";

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
  return `${str.slice(0, 6)}…${str.slice(-6)}`;
}

function formatPrice(price: bigint): string {
  const num = Math.round(Number(price) / 100);
  return `₨${num.toLocaleString("en-PK")}`;
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
          className={`text-3xl font-bold font-display ${highlight ? "text-primary" : "text-card-foreground"}`}
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

// ── Main Component ─────────────────────────────────────────────────────────────
export function AdminDashboardPage() {
  const { actor, isFetching: actorFetching } = useActor();

  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [sellers, setSellers] = useState<SellerSummary[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Check admin status on mount
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
    if (isAdmin === true) {
      fetchData();
    }
  }, [isAdmin, fetchData]);

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
                      ? `${Math.round((Number(stats.soldListings) / Number(stats.totalListings)) * 100)}%`
                      : "—",
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
                      : "—",
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

      {/* Tabs: Listings / Sellers */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Tabs defaultValue="listings">
          <TabsList className="mb-4">
            <TabsTrigger value="listings" data-ocid="admin.tab.listings">
              <Package className="h-3.5 w-3.5 mr-1.5" />
              Listings
              <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                {sortedListings.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="sellers" data-ocid="admin.tab.sellers">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Sellers
              <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0">
                {sortedSellers.length}
              </Badge>
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
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    No listings found.
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
                          <TableHead className="text-xs font-semibold pr-6 text-right">
                            Action
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
      <TableCell className="text-sm text-center hidden sm:table-cell">
        <Badge className="text-xs font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
          {sellerSummary.activeListings.toString()}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-center hidden sm:table-cell">
        <Badge
          variant="secondary"
          className="text-xs font-medium bg-muted text-muted-foreground"
        >
          {sellerSummary.soldListings.toString()}
        </Badge>
      </TableCell>
      <TableCell className="pr-6 text-right">
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              data-ocid={`admin.seller.delete_button.${index}`}
              className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors gap-1.5"
              aria-label={`Remove all listings for seller ${sellerSummary.seller.toString()}`}
              disabled={isRemoving || sellerSummary.totalListings === 0n}
            >
              {isRemoving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              Remove All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent data-ocid="admin.seller.delete.dialog">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove All Listings</AlertDialogTitle>
              <AlertDialogDescription>
                Permanently delete all{" "}
                <span className="font-semibold text-foreground">
                  {sellerSummary.totalListings.toString()}
                </span>{" "}
                listing(s) by seller{" "}
                <span className="font-mono text-xs text-foreground">
                  {truncatePrincipal(sellerSummary.seller)}
                </span>
                ? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-ocid="admin.seller.delete.cancel_button">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                data-ocid="admin.seller.delete.confirm_button"
                disabled={isRemoving}
                onClick={(e) => {
                  e.preventDefault();
                  handleRemoveAll();
                }}
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
