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
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Edit2,
  MessageCircle,
  Trash2,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { ListingImage } from "../components/ListingImage";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeleteListing,
  useListing,
  useMarkAsSold,
} from "../hooks/useQueries";

interface ListingDetailPageProps {
  listingId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
}

export function ListingDetailPage({
  listingId,
  onBack,
  onEdit,
}: ListingDetailPageProps) {
  const { data: listing, isLoading, isError } = useListing(listingId);
  const { identity } = useInternetIdentity();
  const deleteMutation = useDeleteListing();
  const markSoldMutation = useMarkAsSold();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const myPrincipal = identity?.getPrincipal().toString();
  const isOwner = myPrincipal && listing?.seller?.toString() === myPrincipal;
  const price = listing ? Number(listing.price) / 100 : 0;

  const handleDelete = async () => {
    if (!listing) return;
    await deleteMutation.mutateAsync(listing.id);
    onBack();
  };

  const handleMarkSold = async () => {
    if (!listing) return;
    await markSoldMutation.mutateAsync(listing.id);
  };

  if (isLoading) {
    return (
      <div
        className="max-w-4xl mx-auto px-4 sm:px-6 py-8"
        data-ocid="detail.loading_state"
      >
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <div
        className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center"
        data-ocid="detail.error_state"
      >
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-semibold font-display mb-2">
          Listing not found
        </h2>
        <p className="text-muted-foreground mb-4">
          This listing may have been removed.
        </p>
        <Button onClick={onBack}>Back to browse</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Button
        variant="ghost"
        size="sm"
        data-ocid="detail.back.button"
        onClick={onBack}
        className="mb-6 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        {/* Image */}
        <div className="rounded-xl overflow-hidden border border-border aspect-square bg-muted">
          <ListingImage
            imageUrl={listing.imageUrl}
            alt={listing.title}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={listing.sold ? "secondary" : "default"}>
                {listing.sold ? "Sold" : "Available"}
              </Badge>
              <Badge variant="outline">{listing.condition}</Badge>
            </div>
            <h1 className="text-2xl font-bold font-display text-foreground">
              {listing.title}
            </h1>
            <p className="text-muted-foreground mt-1">
              {listing.brand} · {listing.model}
            </p>
          </div>

          <p className="text-3xl font-bold text-primary">
            ₨{Math.round(price).toLocaleString()}
          </p>

          {listing.description && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Description
              </h2>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            Listed{" "}
            {new Date(
              Number(listing.createdAt) / 1_000_000,
            ).toLocaleDateString()}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            {isOwner ? (
              <>
                <Button
                  variant="outline"
                  data-ocid="detail.edit.button"
                  onClick={() => onEdit(listing.id)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Listing
                </Button>

                {!listing.sold && (
                  <Button
                    variant="secondary"
                    data-ocid="detail.mark_sold.button"
                    onClick={handleMarkSold}
                    disabled={markSoldMutation.isPending}
                  >
                    {markSoldMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Mark as Sold
                  </Button>
                )}

                <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      data-ocid="detail.delete.button"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent data-ocid="detail.delete.dialog">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &ldquo;{listing.title}
                        &rdquo;? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-ocid="detail.delete.cancel_button">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        data-ocid="detail.delete.confirm_button"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              !listing.sold && (
                <Button
                  data-ocid="detail.contact.button"
                  onClick={() => {
                    const subject = encodeURIComponent(
                      `Interested in: ${listing.title}`,
                    );
                    window.open(`mailto:?subject=${subject}`);
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Seller
                </Button>
              )
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
