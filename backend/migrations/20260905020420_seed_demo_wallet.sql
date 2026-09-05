-- Seeds the single demo wallet and its five balances.
--
-- The amounts were rolled once, at authoring time, to land each currency
-- between $100 and $200 of USD value, and are baked in as literals: a migration
-- is a fixed file, so every clone of the repo gets the same wallet. This is the
-- only path that creates balances — there is no seed script and no seeding on
-- server boot, so restarting the server can never reset or overwrite them.
--
--   USD  16423 minor = $164.23
--   EUR  17361 minor = $187.49
--   GBP   8890 minor = $112.90
--   CNY 102571 minor = $143.59
--   JPY  26626 minor = $178.39   (exponent 0 — yen, not sen)

INSERT INTO "wallets" ("id", "name") VALUES (1, 'Demo Wallet');
--> statement-breakpoint
SELECT setval(pg_get_serial_sequence('wallets', 'id'), (SELECT max("id") FROM "wallets"));
--> statement-breakpoint
INSERT INTO "balances" ("wallet_id", "currency", "amount") VALUES
  (1, 'USD', 16423),
  (1, 'EUR', 17361),
  (1, 'GBP', 8890),
  (1, 'CNY', 102571),
  (1, 'JPY', 26626);
