// EventFactory — Event creation & management
// Deploys EventPassSBT instances for each event

import "stdlib";

contract EventFactory {

    owner: slice;
    eventCount: uint32;
    // events: map<uint32, slice>;  // eventId => SBT contract address

    init(owner: slice) {
        self.owner = owner;
        self.eventCount = 0;
    }

    get fun owner(): slice {
        return self.owner;
    }

    get fun eventCount(): uint32 {
        return self.eventCount;
    }
}