-- EventPass TON — Database Schema
-- PostgreSQL 16+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id     BIGINT UNIQUE,
    wallet_address  TEXT,
    username        TEXT,
    display_name    TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_telegram ON users(telegram_id);
CREATE INDEX idx_users_wallet ON users(wallet_address);

-- ============================================
-- EVENTS
-- ============================================
CREATE TABLE events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id     UUID REFERENCES users(id),
    name            TEXT NOT NULL,
    description     TEXT,
    date             TIMESTAMPTZ NOT NULL,
    location        TEXT,
    image_url       TEXT,
    max_tickets     INT NOT NULL,
    tickets_sold    INT DEFAULT 0,
    base_price      BIGINT NOT NULL,        -- nanotons
    royalty_bps     SMALLINT DEFAULT 500,   -- 5% default
    contract_addr   TEXT,                    -- TON contract address
    status          TEXT DEFAULT 'draft',   -- draft/active/sold_out/ended/cancelled
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_date ON events(date);

-- ============================================
-- TICKET TIERS
-- ============================================
CREATE TABLE ticket_tiers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id        UUID REFERENCES events(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,            -- "General", "VIP", "Premium"
    tier_level      SMALLINT NOT NULL,        -- 0, 1, 2
    price_multiplier SMALLINT NOT NULL DEFAULT 1, -- Multiplier on base_price
    max_quantity    INT NOT NULL,
    sold            INT DEFAULT 0,
    perks           JSONB,                    -- {"seating": "front row", "merch": true}
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tiers_event ON ticket_tiers(event_id);

-- ============================================
-- CROSS-CHAIN SWAPS
-- ============================================
CREATE TABLE swaps (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id),
    event_id        UUID REFERENCES events(id),
    tier_id         UUID REFERENCES ticket_tiers(id),
    swap_id         TEXT UNIQUE,              -- Omniston swap ID
    from_chain      TEXT NOT NULL,            -- ethereum/polygon/bnb/ton
    from_token      TEXT NOT NULL,            -- ETH/USDC/BNB/TON
    from_amount     TEXT NOT NULL,            -- Source amount
    to_amount       TEXT,                     -- Received TON amount
    status          TEXT DEFAULT 'pending',   -- pending/completed/failed/expired
    tx_hash         TEXT,                     -- TON transaction hash
    source_tx_hash  TEXT,                     -- Source chain tx hash
    deposit_address TEXT,                     -- Omniston deposit address
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_swaps_status ON swaps(status);
CREATE INDEX idx_swaps_user ON swaps(user_id);
CREATE INDEX idx_swaps_swap_id ON swaps(swap_id);

-- ============================================
-- SBT TICKETS
-- ============================================
CREATE TABLE tickets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id        INT UNIQUE,              -- On-chain SBT token ID
    event_id        UUID REFERENCES events(id),
    tier_id         UUID REFERENCES ticket_tiers(id),
    owner_id        UUID REFERENCES users(id),
    seat_info       TEXT,
    payment_chain   TEXT,                    -- ton/ethereum/polygon/bnb/stars
    payment_tx      TEXT,                    -- Source tx hash
    price_paid      BIGINT,                  -- nanotons
    checked_in      BOOLEAN DEFAULT FALSE,
    check_in_time   TIMESTAMPTZ,
    minted_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tickets_owner ON tickets(owner_id);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_tickets_token ON tickets(token_id);

-- ============================================
-- TELEGRAM STARS PAYMENTS
-- ============================================
CREATE TABLE stars_payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id),
    event_id        UUID REFERENCES events(id),
    tier_id         UUID REFERENCES ticket_tiers(id),
    telegram_payment_id TEXT UNIQUE,
    stars_amount    INT NOT NULL,
    ton_equivalent BIGINT,                   -- nanotons received from Telegram
    status          TEXT DEFAULT 'pending',   -- pending/confirmed/refunded
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action          TEXT NOT NULL,            -- mint/transfer/checkin/refund
    entity_type     TEXT NOT NULL,            -- ticket/event/swap
    entity_id       UUID NOT NULL,
    actor_id        UUID REFERENCES users(id),
    metadata        JSONB,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_log(action);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Increment tickets_sold on ticket creation
CREATE OR REPLACE FUNCTION increment_tickets_sold()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE events SET tickets_sold = tickets_sold + 1 WHERE id = NEW.event_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_created AFTER INSERT ON tickets
    FOR EACH ROW EXECUTE FUNCTION increment_tickets_sold();
