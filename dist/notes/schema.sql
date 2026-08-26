CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  from_agent_id TEXT NOT NULL,
  to_agent_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  in_reply_to TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_to_request
  ON notes(request_id, to_agent_id, created_at);

CREATE INDEX IF NOT EXISTS idx_notes_from
  ON notes(from_agent_id, created_at);
