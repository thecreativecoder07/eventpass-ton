// Royalty Splitter — Distributes revenue between organizer and platform

import "utils";

struct Split {
    recipient: address;
    bps: uint16; // Basis points (100 = 1%)
}

type SplitDict = dict<address, uint16>;

contract RoyaltySplitter {
    owner: address;
    platformBps: uint16;  // Platform cut in basis points (default 250 = 2.5%)
    splits: SplitDict;
    totalBps: uint16;

    init(owner: address, platformBps: uint16) {
        self.owner = owner;
        self.platformBps = platformBps;
        self.splits = null;
        self.totalBps = 0;
    }

    // Add a revenue split recipient (e.g., co-organizer)
    receive(msg: AddSplit) {
        require(sender() == self.owner, "Only owner");
        require(self.totalBps + msg.bps <= 10000, "Total exceeds 100%");

        self.splits.set(msg.recipient, msg.bps);
        self.totalBps = self.totalBps + msg.bps;
    }

    // Remove a split recipient
    receive(msg: RemoveSplit) {
        require(sender() == self.owner, "Only owner");
        var bps = self.splits.get(msg.recipient) ?? 0;
        self.totalBps = self.totalBps - bps;
        self.splits.delete(msg.recipient);
    }

    // Distribute incoming TON to all split recipients
    receive("distribute") {
        var total = myBalance() - msgValue(); // Available balance
        require(total > 0, "Nothing to distribute");

        // Platform cut
        var platformAmount = (total * self.platformBps) / 10000;
        if (platformAmount > 0) {
            send(self.owner, platformAmount);
        }

        // Remaining distributed to splits
        var remaining = total - platformAmount;
        var splitsTotal = self.totalBps;

        if (splitsTotal > 0) {
            self.splits.foreach(fun(recipient, bps) {
                var amount = (remaining * bps) / splitsTotal;
                if (amount > 0) {
                    send(recipient, amount);
                }
            });
        }
    }

    get fun getPlatformBps(): uint16 {
        return self.platformBps;
    }

    get fun getTotalBps(): uint16 {
        return self.totalBps;
    }
}

struct(0x10) AddSplit {
    recipient: address;
    bps: uint16;
}

struct(0x11) RemoveSplit {
    recipient: address;
}
