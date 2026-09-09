INSERT INTO "wallet" ("id") VALUES (1);
--> statement-breakpoint
SELECT setval('wallet_id_seq', (SELECT MAX("id") FROM "wallet"));
--> statement-breakpoint
INSERT INTO "wallet_balance" ("wallet_id", "currency", "amount") VALUES
	(1, 'USD', 100000),
	(1, 'EUR', 0),
	(1, 'GBP', 0),
	(1, 'JPY', 0),
	(1, 'CNY', 0);
