CREATE TABLE public.stocks (
  symbol text PRIMARY KEY,
  name text NOT NULL,
  sector text,
  industry text,
  price numeric,
  market_cap_cr numeric,
  quarter text,
  fii numeric, fii_prev numeric,
  dii numeric, dii_prev numeric,
  result_quarter text,
  sales numeric, sales_yoy numeric,
  profit numeric, profit_yoy numeric,
  result_date date,
  updated_at timestamptz,
  last_error text
);
GRANT SELECT ON public.stocks TO anon, authenticated;
GRANT ALL ON public.stocks TO service_role;
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Market data is public" ON public.stocks FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX stocks_updated_idx ON public.stocks (updated_at NULLS FIRST);
CREATE INDEX stocks_fii_idx ON public.stocks (fii DESC NULLS LAST);