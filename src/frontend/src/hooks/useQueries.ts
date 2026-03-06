import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ConversationSummary, Listing, Message } from "../backend.d.ts";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export type { ConversationSummary, Listing, Message };

export function useAllListings() {
  const { actor, isFetching } = useActor();
  return useQuery<Listing[]>({
    queryKey: ["listings"],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getAllListings();
      return result;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useListing(id: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Listing>({
    queryKey: ["listing", id],
    queryFn: async () => {
      if (!actor) throw new Error("No actor");
      return actor.getListing(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useMyListings(principalStr: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Listing[]>({
    queryKey: ["my-listings", principalStr],
    queryFn: async () => {
      if (!actor || !principalStr) return [];
      // Import Principal dynamically to avoid circular deps
      const { Principal } = await import("@icp-sdk/core/principal");
      const p = Principal.fromText(principalStr);
      return actor.getListingsByUser(p);
    },
    enabled: !!actor && !isFetching && !!principalStr,
  });
}

export function useCreateListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      brand: string;
      model: string;
      condition: string;
      price: bigint;
      description: string;
      imageUrl: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createListing(
        data.title,
        data.brand,
        data.model,
        data.condition,
        data.price,
        data.description,
        data.imageUrl,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    },
  });
}

export function useUpdateListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: string;
      title: string;
      brand: string;
      model: string;
      condition: string;
      price: bigint;
      description: string;
      imageUrl: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateListing(
        data.id,
        data.title,
        data.brand,
        data.model,
        data.condition,
        data.price,
        data.description,
        data.imageUrl,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listing", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    },
  });
}

export function useDeleteListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteListing(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    },
  });
}

export function useMarkAsSold() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.markAsSold(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listing", id] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    },
  });
}

// ─── Messaging Hooks ────────────────────────────────────────────────────────

export function useConversationSummaries() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<ConversationSummary[]>({
    queryKey: ["conversation-summaries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getConversationSummaries();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useConversation(
  listingId: string | undefined,
  otherPartyPrincipalStr: string | undefined,
) {
  const { actor, isFetching } = useActor();
  return useQuery<Message[]>({
    queryKey: ["conversation", listingId, otherPartyPrincipalStr],
    queryFn: async () => {
      if (!actor || !listingId || !otherPartyPrincipalStr) return [];
      const { Principal } = await import("@icp-sdk/core/principal");
      const p = Principal.fromText(otherPartyPrincipalStr);
      return actor.getConversation(listingId, p);
    },
    enabled: !!actor && !isFetching && !!listingId && !!otherPartyPrincipalStr,
    refetchInterval: 5000,
  });
}

export function useUnreadCount() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<bigint>({
    queryKey: ["unread-count"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getUnreadCount();
    },
    enabled: !!actor && !isFetching && !!identity,
    refetchInterval: 15_000,
  });
}

export function useMessageNotifications(onOpenInbox: () => void) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const prevCountRef = useRef<number>(-1);

  const { data: unreadCountBigInt } = useQuery<bigint>({
    queryKey: ["unread-count-notifications"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getUnreadCount();
    },
    enabled: !!actor && !isFetching && !!identity,
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (unreadCountBigInt === undefined) return;

    const currentCount = Number(unreadCountBigInt);

    // First load — initialise without firing
    if (prevCountRef.current === -1) {
      prevCountRef.current = currentCount;
      return;
    }

    // Count increased — new message(s) arrived
    if (currentCount > prevCountRef.current) {
      prevCountRef.current = currentCount;

      // Try to find the most recent unread conversation title
      if (actor) {
        actor
          .getConversationSummaries()
          .then((summaries: ConversationSummary[]) => {
            const unread = summaries.find((s) => Number(s.unreadCount) > 0);
            const listingTitle = unread?.listingTitle ?? null;

            toast("New message", {
              description: listingTitle
                ? `You have a new message about "${listingTitle}"`
                : "You have a new message",
              action: {
                label: "Open Inbox",
                onClick: onOpenInbox,
              },
            });
          })
          .catch(() => {
            toast("New message", {
              description: "You have a new message",
              action: {
                label: "Open Inbox",
                onClick: onOpenInbox,
              },
            });
          });
      } else {
        toast("New message", {
          description: "You have a new message",
          action: {
            label: "Open Inbox",
            onClick: onOpenInbox,
          },
        });
      }
    } else {
      prevCountRef.current = currentCount;
    }
  }, [unreadCountBigInt, actor, onOpenInbox]);
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listingId,
      content,
    }: {
      listingId: string;
      content: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.sendMessage(listingId, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation-summaries"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
}

export function useReplyMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listingId,
      buyer,
      content,
    }: {
      listingId: string;
      buyer: string;
      content: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      const { Principal } = await import("@icp-sdk/core/principal");
      const buyerPrincipal = Principal.fromText(buyer);
      return actor.replyMessage(listingId, buyerPrincipal, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation-summaries"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
}

export function useMarkConversationRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listingId,
      otherParty,
    }: {
      listingId: string;
      otherParty: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      const { Principal } = await import("@icp-sdk/core/principal");
      const p = Principal.fromText(otherParty);
      return actor.markConversationRead(listingId, p);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["conversation-summaries"] });
    },
  });
}
