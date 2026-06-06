// EventPass SBT — Soulbound Ticket Token
// Non-transferable, non-burnable event ticket on TON

import "utils";

// === STORAGE ===

struct Storage {
    owner: address;
    nextId: uint32;
    nextEventId: uint32;
}

struct Ticket {
    eventId: uint32;
    tier: uint8;        // 0=General, 1=VIP, 2=Premium
    seatInfo: slice;    // "GA" or "Row A, Seat 42"
    mintedAt: uint64;
    checkInTime: uint64; // 0 = not checked in
    paymentChain: slice; // "ton", "ethereum", "polygon", "bnb"
    pricePaid: uint64;   // nanotons
}

struct Event {
    organizer: address;
    name: slice;
    description: slice;
    date: uint64;
    location: slice;
    maxTickets: uint32;
    ticketsSold: uint32;
    basePrice: uint64;   // nanotons
    royaltyBps: uint16;  // 0-1500 = 0-15%
    active: bool;
}

struct SwapClaim {
    recipient: address;
    eventId: uint32;
    tier: uint8;
    amount: uint64;
    claimed: bool;
}

// === MESSAGES ===

struct(0x1) CreateEvent {
    name: slice;
    description: slice;
    date: uint64;
    location: slice;
    maxTickets: uint32;
    basePrice: uint64;
    royaltyBps: uint16;
}

struct(0x2) MintTicket {
    recipient: address;
    eventId: uint32;
    tier: uint8;
    seatInfo: slice;
    paymentChain: slice;
    pricePaid: uint64;
}

struct(0x3) MintTicketCrossChain {
    swapId: slice;
    recipient: address;
    eventId: uint32;
    tier: uint8;
    seatInfo: slice;
    paymentChain: slice;
    pricePaid: uint64;
}

struct(0x4) CheckIn {
    ticketId: uint32;
}

struct(0x5) DeactivateEvent {
    eventId: uint32;
}

// === DICTS ===

type TicketDict = dict<uint32, Ticket>;
type OwnerDict = dict<uint32, address>;
type BalanceDict = dict<address, uint32>;
type EventDict = dict<uint32, Event>;
type SwapClaimDict = dict<slice, SwapClaim>;

// === CONTRACT ===

contract EventPassSBT {
    // Persistent state
    owner: address;
    nextId: uint32;
    nextEventId: uint32;
    tickets: TicketDict;
    ownerOf: OwnerDict;
    balanceOf: BalanceDict;
    events: EventDict;
    swapClaims: SwapClaimDict;

    init(owner: address) {
        self.owner = owner;
        self.nextId = 0;
        self.nextEventId = 0;
        self.tickets = null;
        self.ownerOf = null;
        self.balanceOf = null;
        self.events = null;
        self.swapClaims = null;
    }

    receive(msg: CreateEvent) {
        require(sender() == self.owner, "Only owner can create events");

        var eventId = self.nextEventId;
        self.events.set(eventId, Event{
            organizer: sender(),
            name: msg.name,
            description: msg.description,
            date: msg.date,
            location: msg.location,
            maxTickets: msg.maxTickets,
            ticketsSold: 0,
            basePrice: msg.basePrice,
            royaltyBps: msg.royaltyBps,
            active: true,
        });
        self.nextEventId = self.nextEventId + 1;
    }

    receive(msg: MintTicket) {
        require(sender() == self.owner, "Only owner can mint");
        self._mintTicket(
            msg.recipient, msg.eventId, msg.tier,
            msg.seatInfo, msg.paymentChain, msg.pricePaid
        );
    }

    receive(msg: MintTicketCrossChain) {
        require(sender() == self.owner, "Only owner can mint");

        // Prevent double-minting for same swap
        var existing = self.swapClaims.get(msg.swapId);
        require(existing.isNone(), "Swap already claimed");

        self._mintTicket(
            msg.recipient, msg.eventId, msg.tier,
            msg.seatInfo, msg.paymentChain, msg.pricePaid
        );

        // Mark swap as claimed
        self.swapClaims.set(msg.swapId, SwapClaim{
            recipient: msg.recipient,
            eventId: msg.eventId,
            tier: msg.tier,
            amount: msg.pricePaid,
            claimed: true,
        });
    }

    receive(msg: CheckIn) {
        var ticket = self.tickets.get(msg.ticketId)!!;
        var ticketOwner = self.ownerOf.get(msg.ticketId)!!;
        require(sender() == ticketOwner, "Only ticket owner can check in");
        require(ticket.checkInTime == 0, "Already checked in");

        ticket.checkInTime = now();
        self.tickets.set(msg.ticketId, ticket);
    }

    receive(msg: DeactivateEvent) {
        var event = self.events.get(msg.eventId)!!;
        require(sender() == event.organizer || sender() == self.owner, "Not authorized");
        event.active = false;
        self.events.set(msg.eventId, event);
    }

    // BLOCK ALL TRANSFERS — Soulbound Token
    receive("transfer") {
        throw(0xFFFF); // "EventPass tickets are soulbound — cannot be transferred"
    }

    // === INTERNAL ===

    fun _mintTicket(
        recipient: address,
        eventId: uint32,
        tier: uint8,
        seatInfo: slice,
        paymentChain: slice,
        pricePaid: uint64
    ) {
        var event = self.events.get(eventId)!!;
        require(event.active, "Event not active");
        require(event.ticketsSold < event.maxTickets, "Event sold out");

        var ticketId = self.nextId;

        self.tickets.set(ticketId, Ticket{
            eventId: eventId,
            tier: tier,
            seatInfo: seatInfo,
            mintedAt: now(),
            checkInTime: 0,
            paymentChain: paymentChain,
            pricePaid: pricePaid,
        });

        self.ownerOf.set(ticketId, recipient);
        var currentBalance = self.balanceOf.get(recipient) ?? 0;
        self.balanceOf.set(recipient, currentBalance + 1);

        event.ticketsSold = event.ticketsSold + 1;
        self.events.set(eventId, event);

        self.nextId = self.nextId + 1;
    }

    // === GETTERS ===

    get fun ticketInfo(id: uint32): Ticket {
        return self.tickets.get(id)!!;
    }

    get fun ownerOfTicket(id: uint32): address {
        return self.ownerOf.get(id)!!;
    }

    get fun balanceOfWallet(wallet: address): uint32 {
        return self.balanceOf.get(wallet) ?? 0;
    }

    get fun eventInfo(id: uint32): Event {
        return self.events.get(id)!!;
    }

    get fun totalTickets(): uint32 {
        return self.nextId;
    }

    get fun totalEvents(): uint32 {
        return self.nextEventId;
    }
}
