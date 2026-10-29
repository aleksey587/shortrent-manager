-- Migration 009: Admin view for registered users with email and activity status
-- Run this in Supabase SQL Editor: Dashboard > SQL Editor > New query

CREATE OR REPLACE VIEW public.admin_users_overview WITH (security_invoker = false) AS
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as registered_at,
  u.last_sign_in_at,
  COUNT(DISTINCT p.id) as properties_count,
  COUNT(DISTINCT i.id) as icals_count,
  COUNT(DISTINCT b.id) as bookings_count,
  COALESCE(SUM(b.total_price), 0) as total_revenue,
  CASE 
    WHEN COUNT(DISTINCT b.id) > 0 THEN 'active'
    WHEN COUNT(DISTINCT i.id) > 0 THEN 'configured'
    WHEN COUNT(DISTINCT p.id) > 0 THEN 'stalled_after_property'
    ELSE 'stalled_signup'
  END as user_status
FROM auth.users u
LEFT JOIN public.properties p ON p.user_id = u.id
LEFT JOIN public.ical_sources i ON i.property_id = p.id
LEFT JOIN public.bookings b ON b.property_id = p.id
GROUP BY u.id, u.email, u.created_at, u.last_sign_in_at;

-- Allow read access
GRANT SELECT ON public.admin_users_overview TO anon, authenticated, service_role;
