-- Migration 006: Add property amenities, cleaner details and guest messaging templates

-- Add cleaner & amenity fields to properties if not already present
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cleaner_name TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cleaner_phone TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS check_in_time TEXT DEFAULT '15:00';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS check_out_time TEXT DEFAULT '11:00';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS wifi_name TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS wifi_password TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lockbox_code TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS directions TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS house_rules TEXT;

-- Custom cleaning tasks status tracking table (optional persistent overrides)
CREATE TABLE IF NOT EXISTS cleaning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  task_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id)
);

-- Guest message templates table
CREATE TABLE IF NOT EXISTS guest_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- confirmation, checkin, midstay, checkout, review
  language TEXT NOT NULL DEFAULT 'el', -- el, en
  subject TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE cleaning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cleaning tasks"
  ON cleaning_tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own templates"
  ON guest_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
