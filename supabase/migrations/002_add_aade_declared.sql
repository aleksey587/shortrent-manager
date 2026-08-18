-- Migration 002: Add aade_declared column to bookings
-- Run this in Supabase SQL Editor AFTER the initial schema

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS aade_declared BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_bookings_aade_declared ON bookings(aade_declared);
