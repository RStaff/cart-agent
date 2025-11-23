-- Enable UUID generation extension (safe if already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core unified events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Which store this event belongs to
  store_id TEXT NOT NULL,

  -- What happened: cart_created, cart_abandoned, recovery_success, ai_label_applied, etc.
  event_type TEXT NOT NULL,

  -- Where this event came from: 'shopify', 'backend', 'ai', 'frontend'
  event_source TEXT NOT NULL,

  -- Optional IDs to link events together
  customer_id TEXT,
  cart_id TEXT,
  checkout_id TEXT,

  -- Numeric value associated with the event (cart total, recovered amount, discount, etc.)
  value NUMERIC,

  -- AI labels attached to this event, e.g. {"label": "discount_sensitive", "confidence": 0.87}
  ai_label JSONB,

  -- Flexible metadata payload, e.g. device, UTM params, product categories, message_template, etc.
  metadata JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful indexes for querying patterns efficiently
CREATE INDEX IF NOT EXISTS idx_events_store_created_at
  ON events (store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_type_created_at
  ON events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_customer_created_at
  ON events (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_store_type_created_at
  ON events (store_id, event_type, created_at DESC);

-- GIN index to make JSONB queries fast for ai_label / metadata
CREATE INDEX IF NOT EXISTS idx_events_ai_label_gin
  ON events USING GIN (ai_label);

CREATE INDEX IF NOT EXISTS idx_events_metadata_gin
  ON events USING GIN (metadata);
