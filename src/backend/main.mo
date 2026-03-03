import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import MixinStorage "blob-storage/Mixin";

actor {
  include MixinStorage();

  // Types
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

  // Listing Mapping
  let listings = Map.empty<Text, Listing>();

  // Listing Compare function to Sort Listings by CreatedAt
  module Listing {
    public func compareByCreatedAt(listing1 : Listing, listing2 : Listing) : Order.Order {
      Int.compare(listing2.createdAt, listing1.createdAt);
    };
  };

  // Public functions user listings are verified against seller (caller) :
  // The only ones being public are the ones requested by the client.

  // Create Listing
  public shared ({ caller }) func createListing(title : Text, brand : Text, model : Text, condition : Text, price : Nat, description : Text, imageUrl : Text) : async Text {
    let id = title.concat(Time.now().toText());
    let listing : Listing = {
      id;
      title;
      brand;
      model;
      condition;
      price;
      description;
      imageUrl;
      seller = caller;
      createdAt = Time.now();
      sold = false;
    };
    listings.add(id, listing);
    id;
  };

  // Get Single Listing
  public query ({ caller }) func getListing(id : Text) : async Listing {
    switch (listings.get(id)) {
      case (null) { Runtime.trap("Listing does not exist") };
      case (?listing) { listing };
    };
  };

  // Get All Active Listings (not sold)
  public query ({ caller }) func getAllListings() : async [Listing] {
    listings.values().toArray().filter(func(listing) { not listing.sold }).sort(Listing.compareByCreatedAt);
  };

  // Get Listings by User
  public query ({ caller }) func getListingsByUser(user : Principal) : async [Listing] {
    listings.values().toArray().filter(func(listing) { listing.seller == user }).sort(Listing.compareByCreatedAt);
  };

  // Update Listing
  public shared ({ caller }) func updateListing(id : Text, title : Text, brand : Text, model : Text, condition : Text, price : Nat, description : Text, imageUrl : Text) : async () {
    switch (listings.get(id)) {
      case (null) { Runtime.trap("Listing does not exist") };
      case (?listing) {
        if (listing.seller != caller) {
          Runtime.trap("You are not the owner of this listing");
        };
        let updatedListing : Listing = {
          id;
          title;
          brand;
          model;
          condition;
          price;
          description;
          imageUrl;
          seller = caller;
          createdAt = listing.createdAt;
          sold = listing.sold;
        };
        listings.add(id, updatedListing);
      };
    };
  };

  // Delete Listing
  public shared ({ caller }) func deleteListing(id : Text) : async () {
    switch (listings.get(id)) {
      case (null) { Runtime.trap("Listing does not exist") };
      case (?listing) {
        if (listing.seller != caller) {
          Runtime.trap("You are not the owner of this listing");
        };
        listings.remove(id);
      };
    };
  };

  // Mark Listing as Sold
  public shared ({ caller }) func markAsSold(id : Text) : async () {
    switch (listings.get(id)) {
      case (null) { Runtime.trap("Listing does not exist") };
      case (?listing) {
        if (listing.seller != caller) {
          Runtime.trap("You are not the owner of this listing");
        };
        let updatedListing : Listing = {
          id = listing.id;
          title = listing.title;
          brand = listing.brand;
          model = listing.model;
          condition = listing.condition;
          price = listing.price;
          description = listing.description;
          imageUrl = listing.imageUrl;
          seller = listing.seller;
          createdAt = listing.createdAt;
          sold = true;
        };
        listings.add(id, updatedListing);
      };
    };
  };
};
