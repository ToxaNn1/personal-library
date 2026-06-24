-- Runs only on a fresh data directory (first start of the container).
-- Enable extensions we'll likely want for the project.

\c library

-- pgcrypto: gives us gen_random_uuid() for UUID primary keys.
-- (Postgres 13+ has gen_random_uuid() built-in, but enabling the extension
--  also gives us digest/encrypt helpers should we need them.)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
