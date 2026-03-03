import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Listing {
    id: string;
    model: string;
    title: string;
    createdAt: bigint;
    sold: boolean;
    description: string;
    seller: Principal;
    imageUrl: string;
    brand: string;
    price: bigint;
    condition: string;
}
export interface backendInterface {
    createListing(title: string, brand: string, model: string, condition: string, price: bigint, description: string, imageUrl: string): Promise<string>;
    deleteListing(id: string): Promise<void>;
    getAllListings(): Promise<Array<Listing>>;
    getListing(id: string): Promise<Listing>;
    getListingsByUser(user: Principal): Promise<Array<Listing>>;
    markAsSold(id: string): Promise<void>;
    updateListing(id: string, title: string, brand: string, model: string, condition: string, price: bigint, description: string, imageUrl: string): Promise<void>;
}
