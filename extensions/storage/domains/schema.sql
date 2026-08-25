CREATE TABLE IF NOT EXISTS domains (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  remit TEXT NOT NULL,
  exclusions TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_domains_name ON domains(name);
