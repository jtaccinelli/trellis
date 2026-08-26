CREATE TABLE IF NOT EXISTS requests (
  request_id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  coordinator_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_requests_status
  ON requests(status);
