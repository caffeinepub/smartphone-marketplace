import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Set "mo:core/Set";
import Time "mo:core/Time";
import MixinStorage "blob-storage/Mixin";
import Migration "migration";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Char "mo:core/Char";

(with migration = Migration.run)
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

  type AnalyticsData = {
    dailyListings : [(Text, Nat)];
    dailyMessages : [(Text, Nat)];
    totalMessages : Nat;
  };

  // Listing Mapping
  let listings = Map.empty<Text, Listing>();

  // Messaging System
  let messages = Map.empty<Text, Message>();

  var adminPrincipal : ?Principal = null;
  var hashedAdminPin : ?Text = null;

  // Listing Compare function to Sort Listings by CreatedAt
  module Listing {
    public func compareByCreatedAt(listing1 : Listing, listing2 : Listing) : Order.Order {
      Int.compare(listing2.createdAt, listing1.createdAt);
    };
  };

  module SingularListing {
    public func compareByCreatedAt(listing1 : Listing, listing2 : Listing) : Order.Order {
      Int.compare(listing2.createdAt, listing1.createdAt);
    };
  };

  // Admin Functions
  public shared ({ caller }) func initAdmin() : async () {
    switch (adminPrincipal) {
      case (null) {
        adminPrincipal := ?caller;
      };
      case (?_) {
        Runtime.trap("Admin has already been initialized");
      };
    };
  };

  public query ({ caller }) func isAdmin() : async Bool {
    switch (adminPrincipal) {
      case (null) { false };
      case (?admin) { caller == admin };
    };
  };

  public query ({ caller }) func isPinSet() : async Bool {
    switch (adminPrincipal, hashedAdminPin) {
      case (null, _) { Runtime.trap("Admin not initialized") };
      case (_, null) { false };
      case (?_, ?pin) { pin != "" };
    };
  };

  public shared ({ caller }) func setAdminPin(pin : Text) : async () {
    assertPinLength(pin);
    switch (adminPrincipal) {
      case (null) { Runtime.trap("Admin not initialized") };
      case (?admin) {
        requireAdmin(caller);
        let hashedPin = hashPin(pin);
        hashedAdminPin := ?hashedPin;
      };
    };
  };

  public shared ({ caller }) func verifyAdminPin(pin : Text) : async Bool {
    assertPinLength(pin);
    switch (adminPrincipal, hashedAdminPin) {
      case (null, _) { Runtime.trap("Admin not initialized") };
      case (_, null) { false };
      case (?admin, ?storedPin) {
        requireAdmin(caller);
        let hashedInputPin = hashPin(pin);
        hashedInputPin == storedPin;
      };
    };
  };

  func assertPinLength(pin : Text) {
    if (pin.size() != 6) { Runtime.trap("PIN must be exactly 6 characters long") };
  };

  func requireAdmin(caller : Principal) {
    switch (adminPrincipal) {
      case (null) { Runtime.trap("Admin has not been initialized! ") };
      case (?admin) {
        if (caller != admin) { Runtime.trap("Caller is not the admin ") };
      };
    };
  };

  func hashPin(pin : Text) : Text {
    pin;
  };

  public query ({ caller }) func getAdminStats() : async AdminStats {
    requireAdmin(caller);

    let allListings = listings.values().toArray();
    let totalListings = allListings.size();
    let activeListings = allListings.filter(func(listing) { not listing.sold }).size();
    let soldListings = allListings.filter(func(listing) { listing.sold }).size();

    let uniqueSellersSet = Set.empty<Principal>();
    for (listing in allListings.values()) {
      uniqueSellersSet.add(listing.seller);
    };
    let uniqueSellers = uniqueSellersSet.size();

    let brandCounts = Map.empty<Text, Nat>();
    for (listing in allListings.values()) {
      switch (brandCounts.get(listing.brand)) {
        case (null) {
          brandCounts.add(listing.brand, 1);
        };
        case (?count) {
          brandCounts.add(listing.brand, count + 1);
        };
      };
    };
    let brandBreakdown = brandCounts.toArray();

    {
      totalListings;
      activeListings;
      soldListings;
      uniqueSellers;
      brandBreakdown;
    };
  };

  public query ({ caller }) func getSellerSummaries() : async [SellerSummary] {
    requireAdmin(caller);

    let summaries = List.empty<SellerSummary>();
    let uniqueSellersSet = Set.empty<Principal>();

    for ((_, listing) in listings.entries()) {
      uniqueSellersSet.add(listing.seller);
    };

    for (seller in uniqueSellersSet.values()) {
      var total = 0;
      var active = 0;
      var sold = 0;

      for ((_, listing) in listings.entries()) {
        if (listing.seller == seller) {
          total += 1;
          if (listing.sold) {
            sold += 1;
          } else {
            active += 1;
          };
        };
      };

      let summary : SellerSummary = {
        seller;
        totalListings = total;
        activeListings = active;
        soldListings = sold;
      };
      summaries.add(summary);
    };

    summaries.toArray();
  };

  public shared ({ caller }) func adminDeleteAllListingsBySeller(seller : Principal) : async () {
    requireAdmin(caller);

    var found = false;
    for ((id, listing) in listings.entries()) {
      if (listing.seller == seller) {
        found := true;
        listings.remove(id);
      };
    };
    if (not found) {
      Runtime.trap("Seller does not exist");
    };
  };

  public query ({ caller }) func getAllListingsAdmin() : async [Listing] {
    requireAdmin(caller);
    listings.values().toArray().sort(Listing.compareByCreatedAt);
  };

  public shared ({ caller }) func adminDeleteListing(id : Text) : async () {
    requireAdmin(caller);
    switch (listings.get(id)) {
      case (null) { Runtime.trap("Listing does not exist") };
      case (?_) {
        listings.remove(id);
      };
    };
  };

  public query ({ caller }) func getAnalytics() : async AnalyticsData {
    requireAdmin(caller);

    // Calculate date range
    let now = Time.now();
    let dayNanos = 24 * 60 * 60 * 1_000_000_000;
    let startDate = now - (29 * dayNanos);

    // Daily listings
    let dailyListingsMap = Map.empty<Text, Nat>();

    for ((id, listing) in listings.entries()) {
      if (listing.createdAt >= startDate and listing.createdAt <= now) {
        let dateString = timestampToDateString(listing.createdAt);
        switch (dailyListingsMap.get(dateString)) {
          case (null) {
            dailyListingsMap.add(dateString, 1);
          };
          case (?count) {
            dailyListingsMap.add(dateString, count + 1);
          };
        };
      };
    };

    let dailyListings = dailyListingsMap.toArray();

    // Daily messages
    let dailyMessagesMap = Map.empty<Text, Nat>();

    for ((id, msg) in messages.entries()) {
      if (msg.createdAt >= startDate and msg.createdAt <= now) {
        let dateString = timestampToDateString(msg.createdAt);
        switch (dailyMessagesMap.get(dateString)) {
          case (null) {
            dailyMessagesMap.add(dateString, 1);
          };
          case (?count) {
            dailyMessagesMap.add(dateString, count + 1);
          };
        };
      };
    };

    let dailyMessages = dailyMessagesMap.toArray();

    // Total messages
    let totalMessages = messages.size();

    {
      dailyListings;
      dailyMessages;
      totalMessages;
    };
  };

  // Helper function to convert timestamp to date string
  func timestampToDateString(timestamp : Int) : Text {
    let nanosPerDay : Int = 24 * 60 * 60 * 1_000_000_000;
    let daysSinceEpoch = timestamp / nanosPerDay;

    let baseYear = 1970;
    let daysPerYear = 365;
    let currentYear = baseYear + Int.abs(daysSinceEpoch) / (daysPerYear : Int);
    let remainingDays = Int.abs(daysSinceEpoch) % (daysPerYear : Int);
    let currentMonth = (remainingDays / 30) + 1;
    let currentDay = (remainingDays % 30) + 1;

    let yearStr = currentYear.toText();
    let monthStr = currentMonth.toText();
    let dayStr = currentDay.toText();

    yearStr # "-" # padNumber(monthStr) # "-" # padNumber(dayStr);
  };

  func padNumber(num : Text) : Text {
    if (num.size() == 1) {
      "0" # num;
    } else {
      num;
    };
  };

  // User Functions

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

  public query ({ caller }) func getListing(id : Text) : async Listing {
    switch (listings.get(id)) {
      case (null) { Runtime.trap("Listing does not exist") };
      case (?listing) { listing };
    };
  };

  public query ({ caller }) func getAllListings() : async [Listing] {
    listings.values().toArray().filter(func(listing) { not listing.sold }).sort(Listing.compareByCreatedAt);
  };

  public query ({ caller }) func getListingsByUser(user : Principal) : async [Listing] {
    listings.values().toArray().filter(func(listing) { listing.seller == user }).sort(Listing.compareByCreatedAt);
  };

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

  // Messaging System Functions

  public shared ({ caller }) func sendMessage(listingId : Text, content : Text) : async () {
    switch (listings.get(listingId)) {
      case (null) { Runtime.trap("Listing does not exist") };
      case (?listing) {
        if (caller == listing.seller) {
          Runtime.trap("Sellers cannot send messages to themselves");
        };
        if (content == "") {
          Runtime.trap("Content cannot be empty");
        };
        let messageId = Time.now().toText();
        let message : Message = {
          id = messageId;
          listingId;
          listingTitle = listing.title;
          sender = caller;
          recipient = listing.seller;
          content;
          createdAt = Time.now();
          isRead = false;
        };
        messages.add(messageId, message);
      };
    };
  };

  public shared ({ caller }) func replyMessage(listingId : Text, buyer : Principal, content : Text) : async () {
    switch (listings.get(listingId)) {
      case (null) { Runtime.trap("Listing does not exist") };
      case (?listing) {
        if (listing.seller != caller) {
          Runtime.trap("Only the seller can reply to messages");
        };
        let messageId = Time.now().toText();
        let message : Message = {
          id = messageId;
          listingId;
          listingTitle = listing.title;
          sender = caller;
          recipient = buyer;
          content;
          createdAt = Time.now();
          isRead = false;
        };
        messages.add(messageId, message);
      };
    };
  };

  public query ({ caller }) func getInboxMessages() : async [Message] {
    messages.values().toArray().filter(func(msg) { msg.recipient == caller }).sort(
      func(m1, m2) { Int.compare(m2.createdAt, m1.createdAt) }
    );
  };

  public query ({ caller }) func getSentMessages() : async [Message] {
    messages.values().toArray().filter(func(msg) { msg.sender == caller }).sort(
      func(m1, m2) { Int.compare(m2.createdAt, m1.createdAt) }
    );
  };

  public query ({ caller }) func getConversation(listingId : Text, otherParty : Principal) : async [Message] {
    messages.values().toArray().filter(
      func(msg) {
        msg.listingId == listingId and ((msg.sender == caller and msg.recipient == otherParty) or (msg.sender == otherParty and msg.recipient == caller));
      }
    ).sort(
      func(m1, m2) { Int.compare(m1.createdAt, m2.createdAt) }
    );
  };

  public query ({ caller }) func getUnreadCount() : async Nat {
    var count = 0;
    for ((_, message) in messages.entries()) {
      if (message.recipient == caller and not message.isRead) {
        count += 1;
      };
    };
    count;
  };

  public shared ({ caller }) func markConversationRead(listingId : Text, otherParty : Principal) : async () {
    for ((id, message) in messages.entries()) {
      if (message.listingId == listingId and message.recipient == caller and message.sender == otherParty) {
        let updatedMessage = { message with isRead = true };
        messages.add(id, updatedMessage);
      };
    };
  };

  public query ({ caller }) func getConversationSummaries() : async [ConversationSummary] {
    let messagesArray = messages.values().toArray().filter(
      func(msg) { msg.sender == caller or msg.recipient == caller }
    );

    let uniqueConversationsMap = Map.empty<Text, ConversationSummary>();

    for (message in messagesArray.values()) {
      let key = message.listingId.concat("_").concat(message.sender.toText()).concat("_").concat(message.recipient.toText());
      switch (uniqueConversationsMap.get(key)) {
        case (null) {
          let otherParty = if (message.sender == caller) { message.recipient } else { message.sender };
          let unreadCount = if (not message.isRead and message.recipient == caller) { 1 } else { 0 };
          let summary : ConversationSummary = {
            listingId = message.listingId;
            listingTitle = message.listingTitle;
            otherParty;
            lastMessage = message.content;
            lastMessageAt = message.createdAt;
            unreadCount;
          };
          uniqueConversationsMap.add(key, summary);
        };
        case (?existing) {
          let updatedSummary : ConversationSummary = {
            existing with
            lastMessage = message.content;
            lastMessageAt = message.createdAt;
            unreadCount = existing.unreadCount + (if (not message.isRead and message.recipient == caller) { 1 } else { 0 });
          };
          uniqueConversationsMap.add(key, updatedSummary);
        };
      };
    };

    let uniqueConversationsArray = uniqueConversationsMap.values().toArray();
    let sortedConversations = uniqueConversationsArray.sort(
      func(c1, c2) { Int.compare(c2.lastMessageAt, c1.lastMessageAt) }
    );
    sortedConversations;
  };
};
