CREATE TABLE "wallet" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_balance" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" integer NOT NULL,
	"currency" text NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "wallet_balance_wallet_currency_key" UNIQUE("wallet_id","currency")
);
--> statement-breakpoint
CREATE TABLE "exchange_transaction" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_id" integer NOT NULL,
	"from_currency" text NOT NULL,
	"to_currency" text NOT NULL,
	"from_amount" integer NOT NULL,
	"to_amount" integer NOT NULL,
	"rate" numeric(20, 10) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wallet_balance" ADD CONSTRAINT "wallet_balance_wallet_id_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallet"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_transaction" ADD CONSTRAINT "exchange_transaction_wallet_id_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallet"("id") ON DELETE no action ON UPDATE no action;