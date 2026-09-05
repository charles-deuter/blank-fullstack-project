CREATE TABLE "wallet_balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"currency" text NOT NULL,
	"amount" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "wallet_balances_currency_unique" UNIQUE("currency")
);
--> statement-breakpoint
CREATE TABLE "exchanges" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_currency" text NOT NULL,
	"to_currency" text NOT NULL,
	"from_amount" bigint NOT NULL,
	"to_amount" bigint NOT NULL,
	"rate_used" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "wallet_balances" ("currency", "amount") VALUES
  ('USD', 100000),
  ('JPY', 0),
  ('EUR', 0),
  ('GBP', 0),
  ('CNY', 0);
