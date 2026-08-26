CREATE TABLE IF NOT EXISTS queue_items (
  id TEXT PRIMARY KEY,
  domain_id TEXT NOT NULL,
  requirement_id TEXT NOT NULL,
  enqueued_by_coordinator_id TEXT NOT NULL,
  status TEXT NOT NULL,
  domain_agent_id TEXT,
  result_payload TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_queue_items_domain_status
  ON queue_items(domain_id, status, priority, created_at);

CREATE INDEX IF NOT EXISTS idx_queue_items_requirement
  ON queue_items(requirement_id);
