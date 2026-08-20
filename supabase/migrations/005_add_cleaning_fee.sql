-- Add cleaning_fee to properties (default per property)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cleaning_fee NUMERIC(10,2) DEFAULT 0;

-- Add cleaning_fee to bookings (actual fee for each booking)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cleaning_fee NUMERIC(10,2) DEFAULT 0;
