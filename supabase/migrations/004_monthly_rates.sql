-- Monthly rates per property (τιμή ανά νύχτα ανά μήνα)
CREATE TABLE IF NOT EXISTS monthly_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  price_per_night NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(property_id, year, month)
);

ALTER TABLE monthly_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own monthly_rates" ON monthly_rates
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_monthly_rates_property_id ON monthly_rates(property_id);
CREATE INDEX IF NOT EXISTS idx_monthly_rates_year_month ON monthly_rates(year, month);
