import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Listing } from "../backend.d.ts";
import { useActor } from "./useActor";

export type { Listing };

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
