-- ============================================================
-- tchaaFacture — Migration initiale
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: company_settings (1 ligne par utilisateur)
-- ============================================================
CREATE TABLE IF NOT EXISTS company_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL DEFAULT 'Ma Société',
  email           TEXT NOT NULL DEFAULT '',
  phone           TEXT NOT NULL DEFAULT '',
  address         TEXT NOT NULL DEFAULT '',
  logo_url        TEXT NOT NULL DEFAULT '',
  currency        TEXT NOT NULL DEFAULT 'XOF',
  payment_terms   INTEGER NOT NULL DEFAULT 30,
  invoice_prefix  TEXT NOT NULL DEFAULT 'INV-',
  starting_number INTEGER NOT NULL DEFAULT 1,
  tax_rate        NUMERIC(5,2) NOT NULL DEFAULT 18,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE TRIGGER trg_company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLE: customers
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL DEFAULT '',
  phone        TEXT NOT NULL DEFAULT '',
  company      TEXT NOT NULL DEFAULT '',
  address      TEXT NOT NULL DEFAULT '',
  avatar_seed  TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_user_id ON customers(user_id);

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLE: invoices
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id               TEXT PRIMARY KEY,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id      UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name    TEXT NOT NULL,
  customer_company TEXT NOT NULL DEFAULT '',
  customer_email   TEXT NOT NULL DEFAULT '',
  customer_phone   TEXT NOT NULL DEFAULT '',
  customer_address TEXT NOT NULL DEFAULT '',
  date             DATE NOT NULL,
  due_date         DATE NOT NULL,
  subtotal         INTEGER NOT NULL DEFAULT 0,
  tax              INTEGER NOT NULL DEFAULT 0,
  tax_rate         NUMERIC(5,2) NOT NULL DEFAULT 18,
  amount           INTEGER NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  notes            TEXT NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status  ON invoices(user_id, status);
CREATE INDEX idx_invoices_date    ON invoices(user_id, date DESC);

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLE: invoice_items
-- ============================================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
  quantity     NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price   INTEGER NOT NULL DEFAULT 0,
  total        INTEGER NOT NULL DEFAULT 0,
  position     INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items     ENABLE ROW LEVEL SECURITY;

-- company_settings : chaque user voit et modifie uniquement ses données
CREATE POLICY "company_settings: user isolation"
  ON company_settings
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- customers
CREATE POLICY "customers: user isolation"
  ON customers
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- invoices
CREATE POLICY "invoices: user isolation"
  ON invoices
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- invoice_items : accès via la facture parente
CREATE POLICY "invoice_items: via invoice owner"
  ON invoice_items
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
        AND invoices.user_id = auth.uid()
    )
  );

-- ============================================================
-- TRIGGER: créer les settings par défaut à l'inscription
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO company_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
