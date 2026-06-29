-- Seed data for local development (optional)

INSERT INTO players (name, initial_rate, current_rate) VALUES
  ('Player Alpha-1', 1500, 1500),
  ('Player Alpha-2', 1500, 1500),
  ('Player Alpha-3', 1500, 1500),
  ('Player Beta-1', 1500, 1500),
  ('Player Beta-2', 1500, 1500),
  ('Player Beta-3', 1500, 1500)
ON CONFLICT (name) DO NOTHING;
