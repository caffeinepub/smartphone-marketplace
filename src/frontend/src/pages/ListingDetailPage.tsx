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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Edit2,
  Loader2,
  MessageCircle,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { ListingImage } from "../components/ListingImage";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeleteListing,
  useListing,
  useMarkAsSold,
  useSendMessage,
} from "../hooks/useQueries";

interface ListingDetailPageProps {
  listingId: string;
  onBack: () => void;
  onEdit: (id: string) => void;
  onNavigateToMessages?: () => void;
}

export function ListingDetailPage({
  listingId,
  onBack,
  onEdit,
  onNavigateToMessages,
}: ListingDetailPageProps) {
  const { data: listing, isLoading, isError } = useListing(listingId);
  const { identity, login } = useInternetIdentity();
  const deleteMutation = useDeleteListing();
  const markSoldMutation = useMarkAsSold();
  const sendMessageMutation = useSendMessage();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageContent, setMessageContent] = useState("");

  const myPrincipal = identity?.getPrincipal().toString();
  const isAuthenticated = !!identity;
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

  const handleOpenMessageDialog = () => {
    if (!isAuthenticated) {
      toast.info("Please sign in to contact the seller.");
      login();
      return;
    }
    setMessageDialogOpen(true);
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !listing) return;
    try {
      await sendMessageMutation.mutateAsync({
        listingId: listing.id,
        content: messageContent.trim(),
      });
      toast.success("Message sent to seller!");
      setMessageContent("");
      setMessageDialogOpen(false);
      onNavigateToMessages?.();
    } catch {
      toast.error("Failed to send message. Please try again.");
    }
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

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Asking Price
            </p>
            <p className="text-3xl font-bold text-primary">
              ₨{Math.round(price).toLocaleString()}
            </p>
          </div>

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
                <>
                  <Button
                    data-ocid="detail.message_seller.button"
                    onClick={handleOpenMessageDialog}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message Seller
                  </Button>
                  {!isAuthenticated && (
                    <p className="w-full text-xs text-muted-foreground">
                      You need to sign in to contact the seller.
                    </p>
                  )}
                </>
              )
            )}
          </div>
        </div>
      </motion.div>

      {/* Message Seller Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent
          data-ocid="detail.message.dialog"
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Message Seller</DialogTitle>
            <DialogDescription>
              Send a message about &ldquo;{listing.title}&rdquo;. The seller
              will reply in your Inbox.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="message-content" className="sr-only">
              Your message
            </Label>
            <Textarea
              id="message-content"
              data-ocid="detail.message.textarea"
              placeholder={`Hi, I'm interested in your ${listing.title}. Is it still available?`}
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              rows={4}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) {
                  void handleSendMessage();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Ctrl + Enter to send
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              data-ocid="detail.message.cancel_button"
              onClick={() => {
                setMessageDialogOpen(false);
                setMessageContent("");
              }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="detail.message.submit_button"
              onClick={handleSendMessage}
              disabled={!messageContent.trim() || sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4 mr-2" />
              )}
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
