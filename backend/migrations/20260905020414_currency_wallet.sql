CREATE TABLE "wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" integer NOT NULL,
	"currency" text NOT NULL,
	"amount" bigint NOT NULL,
	CONSTRAINT "balances_wallet_currency_unique" UNIQUE("wallet_id","currency")
);
--> statement-breakpoint
CREATE TABLE "exchanges" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" integer NOT NULL,
	"from_currency" text NOT NULL,
	"to_currency" text NOT NULL,
	"from_amount" bigint NOT NULL,
	"to_amount" bigint NOT NULL,
	"from_rate_usd" numeric(20, 10) NOT NULL,
	"to_rate_usd" numeric(20, 10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "balances" ADD CONSTRAINT "balances_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchanges" ADD CONSTRAINT "exchanges_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;