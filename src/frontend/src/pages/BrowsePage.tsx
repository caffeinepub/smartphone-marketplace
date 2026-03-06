import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { ListingImage } from "../components/ListingImage";
import { useAllListings } from "../hooks/useQueries";
import type { Listing } from "../hooks/useQueries";

const BRANDS = [
  "All",
  "Apple",
  "Samsung",
  "Google",
  "OnePlus",
  "Xiaomi",
  "Sony",
  "Infinix",
  "Tecno",
  "QMobile",
  "Itel",
  "Vivo",
  "Oppo",
  "Realme",
  "Nokia",
  "Other",
];
const CONDITIONS = ["All", "New", "Like New", "Good", "Fair", "Poor"];

interface BrowsePageProps {
  onViewListing: (id: string) => void;
}

export function BrowsePage({ onViewListing }: BrowsePageProps) {
  const { data: listings = [], isLoading } = useAllListings();
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("All");
  const [conditionFilter, setConditionFilter] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return listings
      .filter((l) => !l.sold)
      .filter((l) => {
        const q = search.toLowerCase();
        if (
          q &&
          !l.title.toLowerCase().includes(q) &&
          !l.model.toLowerCase().includes(q) &&
          !l.brand.toLowerCase().includes(q)
        )
          return false;
        if (brandFilter !== "All" && l.brand !== brandFilter) return false;
        if (conditionFilter !== "All" && l.condition !== conditionFilter)
          return false;
        if (maxPrice && Number(l.price) / 100 > Number(maxPrice)) return false;
        return true;
      })
      .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
  }, [listings, search, brandFilter, conditionFilter, maxPrice]);

  const clearFilters = () => {
    setSearch("");
    setBrandFilter("All");
    setConditionFilter("All");
    setMaxPrice("");
  };

  const hasFilters =
    search || brandFilter !== "All" || conditionFilter !== "All" || maxPrice;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold font-display text-foreground tracking-tight">
          Browse Phones
        </h1>
        <p className="text-muted-foreground mt-1">
          {isLoading
            ? "Loading listings…"
            : `${filtered.length} listing${filtered.length !== 1 ? "s" : ""} available`}
        </p>
      </motion.div>

      {/* Search + filter bar */}
      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              data-ocid="browse.search_input"
              className="pl-9"
              placeholder="Search by brand, model, or title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            data-ocid="browse.filter.toggle"
            onClick={() => setShowFilters((v) => !v)}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
          {hasFilters && (
            <Button
              variant="ghost"
              size="icon"
              data-ocid="browse.filter.clear"
              onClick={clearFilters}
              aria-label="Clear filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger data-ocid="browse.brand.select">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                {BRANDS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={conditionFilter} onValueChange={setConditionFilter}>
              <SelectTrigger data-ocid="browse.condition.select">
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              data-ocid="browse.maxprice.input"
              type="number"
              placeholder="Max price (PKR)"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </motion.div>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {(
            ["sk1", "sk2", "sk3", "sk4", "sk5", "sk6", "sk7", "sk8"] as const
          ).map((sk) => (
            <div
              key={sk}
              className="rounded-xl border border-border overflow-hidden"
            >
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-1/4 mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          data-ocid="browse.empty_state"
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="text-5xl mb-4">📱</div>
          <h2 className="text-xl font-semibold font-display mb-2">
            No listings found
          </h2>
          <p className="text-muted-foreground max-w-sm">
            {hasFilters
              ? "Try adjusting your search or filters."
              : "Be the first to list a phone for sale!"}
          </p>
          {hasFilters && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((listing, idx) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              index={idx + 1}
              onClick={() => onViewListing(listing.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingCard({
  listing,
  index,
  onClick,
}: {
  listing: Listing;
  index: number;
  onClick: () => void;
}) {
  const price = Number(listing.price) / 100;

  return (
    <motion.button
      type="button"
      data-ocid={`browse.item.${index}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
      className="group rounded-xl border border-border bg-card overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left w-full"
      onClick={onClick}
      aria-label={`View ${listing.title}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <ListingImage
          imageUrl={listing.imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 left-2">
          <Badge
            variant={listing.condition === "New" ? "default" : "secondary"}
            className="text-xs"
          >
            {listing.condition}
          </Badge>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
          {listing.brand}
        </p>
        <h3 className="font-semibold font-display text-card-foreground line-clamp-1 mb-1">
          {listing.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
          {listing.model}
        </p>
        <p className="text-lg font-bold text-primary">
          ₨{Math.round(price).toLocaleString()}
        </p>
      </div>
    </motion.button>
  );
}
