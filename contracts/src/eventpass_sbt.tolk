// EventPassSBT — Soulbound Ticket Token
// Non-transferable, non-burnable NFT for event tickets on TON

import "stdlib";

// ============================================================
// Structs
// ============================================================

struct Ticket {
    eventId: uint32;
    tier: uint8;        // 0=General, 1=VIP, 2=Premium
    seatInfo: slice;    // "GA" or "Row A, Seat 42"
    mintedAt: uint64;
    checkInTime: uint64; // 0 = not checked in
    paymentChain: slice; // "ton", "ethereum", "polygon", "bnb"
    paymentTxHash: slice;
    pricePaid: uint64;  // nanotons
}

struct Event {
    organizer: slice;    // address
    name: slice;
    description: slice;
    date: uint64;
    location: slice;
    maxTickets: uint32;
    ticketsSold: uint32;
    basePrice: uint64;  // nanotons
    royaltyBps: uint16; // 0-1500 = 0-15%
    active: uint1;      // 1 = active, 0 = inactive
}

struct SwapClaim {
    recipient: slice;
    eventId: uint32;
    tier: uint8;
    amount: uint64;
    claimed: uint1;
}

// ============================================================
// Contract
// ============================================================

contract EventPassSBT {

    // State
    owner: slice;           // Contract owner (platform)
    nextId: uint32;         // Auto-incrementing ticket ID
    nextEventId: uint32;    // Auto-incrementing event ID

    // Storage
    // tickets: map<uint32, Ticket>;
    // ownerOf: map<uint32, slice>;
    // balanceOf: map<slice, uint32>;
    // events: map<uint32, Event>;
    // swapClaims: map<slice, SwapClaim>;

    init(owner: slice) {
        self.owner = owner;
        self.nextId = 0;
        self.nextEventId = 0;
    }

    // ============================================================
    // Getters
    // ============================================================

    get fun owner(): slice {
        return self.owner;
    }

    get fun nextId(): uint32 {
        return self.nextId;
    }

    get fun nextEventId(): uint32 {
        return self.nextEventId;
    }

    // ============================================================
    // Internal helpers
    // ============================================================

    fun calculatePrice(basePrice: uint64, tier: uint8): uint64 {
        if (tier == 0) { return basePrice; }       // General
        if (tier == 1) { return basePrice * 2; }    // VIP
        if (tier == 2) { return basePrice * 5; }    // Premium
        return basePrice;
    }

    // BLOCK ALL TRANSFERS — Soulbound by design
    // Transfer attempts throw an error
}