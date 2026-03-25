import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface SellerSummary {
    soldListings: bigint;
    activeListings: bigint;
    seller: Principal;
    totalListings: bigint;
}
export interface AdminStats {
    soldListings: bigint;
    uniqueSellers: bigint;
    activeListings: bigint;
    totalListings: bigint;
    brandBreakdown: Array<[string, bigint]>;
}
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
export interface Message {
    id: string;
    content: string;
    listingId: string;
    createdAt: bigint;
    recipient: Principal;
    isRead: boolean;
    sender: Principal;
    listingTitle: string;
}
export interface ConversationSummary {
    lastMessageAt: bigint;
    listingId: string;
    lastMessage: string;
    otherParty: Principal;
    unreadCount: bigint;
    listingTitle: string;
}
export interface AnalyticsData {
    totalMessages: bigint;
    dailyMessages: Array<[string, bigint]>;
    dailyListings: Array<[string, bigint]>;
}
export interface backendInterface {
    adminDeleteAllListingsBySeller(seller: Principal): Promise<void>;
    adminDeleteListing(id: string): Promise<void>;
    createListing(title: string, brand: string, model: string, condition: string, price: bigint, description: string, imageUrl: string): Promise<string>;
    deleteListing(id: string): Promise<void>;
    getAdminStats(): Promise<AdminStats>;
    getAllListings(): Promise<Array<Listing>>;
    getAllListingsAdmin(): Promise<Array<Listing>>;
    getAnalytics(): Promise<AnalyticsData>;
    getConversation(listingId: string, otherParty: Principal): Promise<Array<Message>>;
    getConversationSummaries(): Promise<Array<ConversationSummary>>;
    getInboxMessages(): Promise<Array<Message>>;
    getListing(id: string): Promise<Listing>;
    getListingsByUser(user: Principal): Promise<Array<Listing>>;
    getSellerSummaries(): Promise<Array<SellerSummary>>;
    getSentMessages(): Promise<Array<Message>>;
    getUnreadCount(): Promise<bigint>;
    initAdmin(): Promise<void>;
    isAdmin(): Promise<boolean>;
    isPinSet(): Promise<boolean>;
    markAsSold(id: string): Promise<void>;
    markConversationRead(listingId: string, otherParty: Principal): Promise<void>;
    replyMessage(listingId: string, buyer: Principal, content: string): Promise<void>;
    sendMessage(listingId: string, content: string): Promise<void>;
    setAdminPin(pin: string): Promise<void>;
    updateListing(id: string, title: string, brand: string, model: string, condition: string, price: bigint, description: string, imageUrl: string): Promise<void>;
    verifyAdminPin(pin: string): Promise<boolean>;
}
