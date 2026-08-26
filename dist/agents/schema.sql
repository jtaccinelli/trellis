CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  request_id TEXT NOT NULL,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  pid INTEGER,
  task_preview TEXT,
  started_at INTEGER NOT NULL,
  exited_at INTEGER,
  exit_code INTEGER,
  result_text TEXT,
  coordinator_id TEXT,
  domain_id TEXT,
  queue_item_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_agents_request_id ON agents(request_id);
CREATE INDEX IF NOT EXISTS idx_agents_parent_id ON agents(parent_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_started_at ON agents(started_at);
