-- Migration 008: Enable full API & Cron synchronization for iCal, Bookings, and Properties
-- Run this in Supabase SQL Editor: Dashboard > SQL Editor > New query

-- 1. ical_sources: Allow server API and cron to fetch and update all sources
DROP POLICY IF EXISTS "Users see own ical_sources" ON ical_sources;
DROP POLICY IF EXISTS "Allow all via server API" ON ical_sources;
CREATE POLICY "Allow all via server API" ON ical_sources FOR ALL USING (true) WITH CHECK (true);

-- 2. bookings: Allow server API and cron to insert, update, and delete cancelled bookings
DROP POLICY IF EXISTS "Users see own bookings" ON bookings;
DROP POLICY IF EXISTS "Allow all via server API" ON bookings;
CREATE POLICY "Allow all via server API" ON bookings FOR ALL USING (true) WITH CHECK (true);

-- 3. properties: Allow server API to read properties for sync & pricing
DROP POLICY IF EXISTS "Users see own properties" ON properties;
DROP POLICY IF EXISTS "Allow all via server API" ON properties;
CREATE POLICY "Allow all via server API" ON properties FOR ALL USING (true) WITH CHECK (true);

-- 4. monthly_rates: Allow server API to read pricing for rate calculation
DROP POLICY IF EXISTS "Users see own monthly_rates" ON monthly_rates;
DROP POLICY IF EXISTS "Allow all via server API" ON monthly_rates;
CREATE POLICY "Allow all via server API" ON monthly_rates FOR ALL USING (true) WITH CHECK (true);
