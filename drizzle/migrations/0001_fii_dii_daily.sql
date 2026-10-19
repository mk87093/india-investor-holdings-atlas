CREATE TABLE public.fii_dii_daily (
  trade_date date NOT NULL,
  category text NOT NULL,
  buy_cr numeric,
  sell_cr numeric,
  net_cr numeric,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (trade_date, category)
);
GRANT SELECT ON public.fii_dii_daily TO anon, authenticated;
GRANT ALL ON public.fii_dii_daily TO service_role;
ALTER TABLE public.fii_dii_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read fii_dii_daily" ON public.fii_dii_daily FOR SELECT TO anon, authenticated USING (true);