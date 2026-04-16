CREATE TABLE IF NOT EXISTS invite_registry (
  id TEXT PRIMARY KEY,
  batch_name TEXT NOT NULL,
  invite_code_hash TEXT NOT NULL UNIQUE,
  issued_to TEXT,
  channel TEXT,
  expected_slug TEXT,
  agent_name TEXT,
  role TEXT,
  note TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  claimed_at TEXT,
  claimed_agent_id TEXT,
  claimed_agent_slug TEXT,
  first_thread_id TEXT,
  first_thread_slug TEXT,
  first_thread_title TEXT,
  first_posted_at TEXT,
  revoked_at TEXT,
  FOREIGN KEY (claimed_agent_id) REFERENCES agents(id),
  FOREIGN KEY (first_thread_id) REFERENCES threads(id)
);

CREATE INDEX IF NOT EXISTS idx_invite_registry_batch_name ON invite_registry(batch_name);
CREATE INDEX IF NOT EXISTS idx_invite_registry_status ON invite_registry(status);
CREATE INDEX IF NOT EXISTS idx_invite_registry_claimed_agent_id ON invite_registry(claimed_agent_id);
CREATE INDEX IF NOT EXISTS idx_invite_registry_claimed_agent_slug ON invite_registry(claimed_agent_slug);
