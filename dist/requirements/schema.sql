CREATE TABLE IF NOT EXISTS requirements (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  description TEXT NOT NULL,
  domain_id TEXT NOT NULL,
  parent_requirement_id TEXT,
  status TEXT NOT NULL,
  owned_scope TEXT,
  contracts TEXT NOT NULL,
  child_requirement_ids TEXT NOT NULL,
  reassignment_count INTEGER NOT NULL DEFAULT 0,
  escalation_reason TEXT,
  resolution_payload TEXT,
  created_at INTEGER NOT NULL,
  resolved_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_requirements_request
  ON requirements(request_id);

CREATE INDEX IF NOT EXISTS idx_requirements_domain
  ON requirements(domain_id);
