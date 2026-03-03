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
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, Edit2, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { ListingImage } from "../components/ListingImage";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeleteListing,
  useMarkAsSold,
  useMyListings,
} from "../hooks/useQueries";
import type { Listing } from "../hooks/useQueries";

interface MyListingsPageProps {
  onSell: () => void;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onLogin: () => void;
}

export function MyListingsPage({
  onSell,
  onEdit,
  onView,
  onLogin,
}: MyListingsPageProps) {
  const { identity } = useInternetIdentity();
  const principalStr = identity?.getPrincipal().toString();
  const { data: listings = [], isLoading } = useMyListings(principalStr);
  const deleteMutation = useDeleteListing();
  const markSoldMutation = useMarkAsSold();

  if (!identity) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">👤</div>
        <h2 className="text-2xl font-bold font-display mb-2">My Listings</h2>
        <p className="text-muted-foreground mb-6">
          Sign in to see and manage your listings.
        </p>
        <Button data-ocid="my.login.button" onClick={onLogin}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold font-display">My Listings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLoading
              ? "Loading…"
              : `${listings.length} listing${listings.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button data-ocid="my.sell.button" onClick={onSell}>
          <PlusCircle className="h-4 w-4 mr-2" />
          New Listing
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {(["sk1", "sk2", "sk3"] as const).map((sk) => (
            <div
              key={sk}
              className="flex gap-4 p-4 border border-border rounded-xl"
            >
              <Skeleton className="h-20 w-20 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div data-ocid="my.listings.empty_state" className="text-center py-20">
          <div className="text-5xl mb-4">📦</div>
          <h2 className="text-xl font-semibold font-display mb-2">
            No listings yet
          </h2>
          <p className="text-muted-foreground mb-6">
            Post your first phone for sale.
          </p>
          <Button data-ocid="my.sell.empty.button" onClick={onSell}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Post a Listing
          </Button>
        </div>
      ) : (
        <div className="space-y-4" data-ocid="my.listings.list">
          {listings.map((listing, idx) => (
            <MyListingRow
              key={listing.id}
              listing={listing}
              index={idx + 1}
              onView={() => onView(listing.id)}
              onEdit={() => onEdit(listing.id)}
              onDelete={async () => {
                await deleteMutation.mutateAsync(listing.id);
                toast.success("Listing deleted");
              }}
              onMarkSold={async () => {
                await markSoldMutation.mutateAsync(listing.id);
                toast.success("Marked as sold");
              }}
              isDeleting={deleteMutation.isPending}
              isMarkingSold={markSoldMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MyListingRow({
  listing,
  index,
  onView,
  onEdit,
  onDelete,
  onMarkSold,
  isDeleting,
  isMarkingSold,
}: {
  listing: Listing;
  index: number;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onMarkSold: () => Promise<void>;
  isDeleting: boolean;
  isMarkingSold: boolean;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const price = Number(listing.price) / 100;

  return (
    <motion.div
      data-ocid={`my.listings.item.${index}`}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.3) }}
      className="flex gap-4 p-4 border border-border rounded-xl bg-card hover:shadow-sm transition-shadow"
    >
      {/* Image */}
      <button
        type="button"
        className="h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer"
        onClick={onView}
        aria-label={`View ${listing.title}`}
      >
        <ListingImage
          imageUrl={listing.imageUrl}
          alt={listing.title}
          className="w-full h-full object-cover"
        />
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <button
            type="button"
            className="font-semibold font-display text-card-foreground hover:text-primary transition-colors truncate text-left"
            onClick={onView}
          >
            {listing.title}
          </button>
          {listing.sold && (
            <Badge variant="secondary" className="flex-shrink-0 text-xs">
              Sold
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {listing.brand} · {listing.model} · {listing.condition}
        </p>
        <p className="text-base font-bold text-primary mt-1">
          ₨{Math.round(price).toLocaleString()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          data-ocid={`my.listings.edit_button.${index}`}
          onClick={onEdit}
          aria-label="Edit listing"
        >
          <Edit2 className="h-4 w-4" />
        </Button>

        {!listing.sold && (
          <Button
            variant="ghost"
            size="icon"
            data-ocid={`my.listings.sold_button.${index}`}
            onClick={onMarkSold}
            disabled={isMarkingSold}
            aria-label="Mark as sold"
          >
            {isMarkingSold ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
          </Button>
        )}

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              data-ocid={`my.listings.delete_button.${index}`}
              aria-label="Delete listing"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent data-ocid={`my.listings.delete.dialog.${index}`}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Listing</AlertDialogTitle>
              <AlertDialogDescription>
                Delete &ldquo;{listing.title}&rdquo;? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                data-ocid={`my.listings.delete.cancel_button.${index}`}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                data-ocid={`my.listings.delete.confirm_button.${index}`}
                onClick={async () => {
                  setDeleteOpen(false);
                  await onDelete();
                }}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}
