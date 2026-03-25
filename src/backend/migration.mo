import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import List "mo:core/List";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Int "mo:core/Int";

module {
  type Listing = {
    id : Text;
    title : Text;
    brand : Text;
    model : Text;
    condition : Text;
    price : Nat;
    description : Text;
    imageUrl : Text;
    seller : Principal;
    createdAt : Int;
    sold : Bool;
  };

  type SellerSummary = {
    seller : Principal;
    totalListings : Nat;
    activeListings : Nat;
    soldListings : Nat;
  };

  type AdminStats = {
    totalListings : Nat;
    activeListings : Nat;
    soldListings : Nat;
    uniqueSellers : Nat;
    brandBreakdown : [(Text, Nat)];
  };

  type Message = {
    id : Text;
    listingId : Text;
    listingTitle : Text;
    sender : Principal;
    recipient : Principal;
    content : Text;
    createdAt : Int;
    isRead : Bool;
  };

  type ConversationSummary = {
    listingId : Text;
    listingTitle : Text;
    otherParty : Principal;
    lastMessage : Text;
    lastMessageAt : Int;
    unreadCount : Nat;
  };

  type ActorOld = {
    listings : Map.Map<Text, Listing>;
    messages : Map.Map<Text, Message>;
    adminPrincipal : ?Principal;
  };

  type ActorNew = {
    listings : Map.Map<Text, Listing>;
    messages : Map.Map<Text, Message>;
    adminPrincipal : ?Principal;
    hashedAdminPin : ?Text;
  };

  public func run(old : ActorOld) : ActorNew {
    {
      listings = old.listings;
      messages = old.messages;
      adminPrincipal = old.adminPrincipal;
      hashedAdminPin = null;
    };
  };
};
