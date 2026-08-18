-- ShortRent Manager — Database Schema
-- Run this in Supabase SQL Editor

-- Enable Row Level Security
-- Properties
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  ama_number TEXT,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own properties" ON properties
  FOR ALL USING (auth.uid() = user_id);

-- iCal Sources (per property, per platform)
CREATE TABLE IF NOT EXISTS ical_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'airbnb', 'booking', 'vrbo', 'other'
  url TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ical_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own ical_sources" ON ical_sources
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = ical_sources.property_id AND p.user_id = auth.uid()
    )
  );

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  ical_uid TEXT, -- for deduplication from iCal
  platform TEXT DEFAULT 'manual', -- 'airbnb', 'booking', 'vrbo', 'manual'
  guest_name TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INT GENERATED ALWAYS AS (check_out - check_in) STORED,
  price_per_night NUMERIC(10,2),
  total_price NUMERIC(10,2),
  notes TEXT,
  source TEXT DEFAULT 'manual', -- 'ical', 'manual'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(property_id, ical_uid)
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own bookings" ON bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = bookings.property_id AND p.user_id = auth.uid()
    )
  );

-- ΑΑΔΕ Declarations tracker
CREATE TABLE IF NOT EXISTS aade_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quarter INT NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  year INT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'submitted', 'skipped'
  total_income NUMERIC(10,2),
  submitted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, quarter, year)
);

ALTER TABLE aade_declarations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own declarations" ON aade_declarations
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_check_in ON bookings(check_in);
CREATE INDEX IF NOT EXISTS idx_bookings_check_out ON bookings(check_out);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
