-- Paiements partiels
CREATE TABLE IF NOT EXISTS payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_id  TEXT REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  amount      INTEGER NOT NULL,
  date        DATE NOT NULL,
  method      TEXT DEFAULT '',   -- virement, espèces, mobile money, chèque
  reference   TEXT DEFAULT '',
  notes       TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments: own data" ON payments
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
