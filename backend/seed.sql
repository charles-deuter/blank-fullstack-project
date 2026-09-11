-- Seeds the single demo wallet with $1,000 USD and a zero balance in every other
-- supported currency. Idempotent so it can run on every boot without duplicating.

INSERT INTO wallets (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Inserting an explicit id leaves the sequence behind, so a later id-less insert
-- would collide with the row above.
SELECT setval('wallets_id_seq', GREATEST((SELECT MAX(id) FROM wallets), 1));

INSERT INTO wallet_balances (wallet_id, currency, amount) VALUES
  (1, 'USD', 100000),
  (1, 'EUR', 0),
  (1, 'GBP', 0),
  (1, 'JPY', 0),
  (1, 'CNY', 0)
ON CONFLICT (wallet_id, currency) DO NOTHING;
