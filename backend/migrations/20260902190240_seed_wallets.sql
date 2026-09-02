-- Seed the 10 demo wallets with fixed balances between $100.00 and $1000.00.
--
-- These values are DETERMINISTIC ON PURPOSE. test-environment.ts runs every
-- migration against a fresh container for each spec file, so these ten rows are a
-- test fixture in every test. Changing a balance here will break specs that assert
-- on it. The first and last rows pin the exact bounds of the requested range.
INSERT INTO "wallets" ("display_name", "balance_cents") VALUES
  ('Ada Lovelace',       10000),  -- $100.00  (lower bound)
  ('Grace Hopper',       24350),  -- $243.50
  ('Alan Turing',        31200),  -- $312.00
  ('Katherine Johnson',  45000),  -- $450.00
  ('Linus Torvalds',     52725),  -- $527.25
  ('Barbara Liskov',     61800),  -- $618.00
  ('Donald Knuth',       74500),  -- $745.00
  ('Margaret Hamilton',  83300),  -- $833.00
  ('Ken Thompson',       91050),  -- $910.50
  ('Radia Perlman',     100000);  -- $1000.00 (upper bound)
